-- 1. CRIAÇÃO DE TIPOS (ENUMS)
-- Atualizado: 'medico' agora é 'especialista'
CREATE TYPE user_role AS ENUM ('admin', 'especialista', 'recepcionista');
CREATE TYPE appointment_status AS ENUM ('agendado', 'confirmado', 'concluido', 'cancelado', 'falta');

-- 2. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role user_role DEFAULT 'recepcionista',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE PACIENTES / CLIENTES
CREATE TABLE public.patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  phone TEXT,
  birth_date DATE,
  medical_history TEXT, -- Anotações sobre alergias a produtos, procedimentos anteriores, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE ESPECIALISTAS
-- Serve para Biomédicas, Esteticistas, Médicos, etc.
CREATE TABLE public.specialists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  specialty TEXT NOT NULL, -- Ex: "Biomédica Esteta", "Massoterapeuta"
  registry_number TEXT, -- Ex: CRM, COREN ou Certificado (Pode ser nulo se não tiver conselho)
  color_code TEXT DEFAULT '#ec4899', -- Mudei para rosa/magenta (padrão estética), mas é editável
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE AGENDAMENTOS
CREATE TABLE public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  specialist_id UUID REFERENCES public.specialists(id) NOT NULL, -- Vínculo atualizado
  patient_id UUID REFERENCES public.patients(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status DEFAULT 'agendado',
  notes TEXT, -- Ex: "Sessão 1 de 5 de Laser"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ADIÇÃO OPCIONAL: Índice para buscas rápidas na Agenda
CREATE INDEX idx_appointments_specialist_time ON public.appointments (specialist_id, start_time);

-- 6. TABELA DE FORNECEDORES (Produtos de estética, descartáveis, etc)
CREATE TABLE public.suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE PRODUTOS (Cremes, Toxinas, Home Care)
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id),
  name TEXT NOT NULL, -- Ex: "Toxina Botulínica Tipo A"
  description TEXT,
  barcode TEXT,
  stock_quantity INTEGER DEFAULT 0,
  expiry_date DATE, -- Crítico para estética (produtos vencidos)
  price DECIMAL(10, 2),
  price_sale DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DE VENDAS (Serviços ou Produtos Home Care)
CREATE TABLE public.sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ITENS DA VENDA
CREATE TABLE public.sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL
);

-- --- SEGURANÇA (RLS) ---

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Permitindo tudo para usuários logados por enquanto)
CREATE POLICY "Acesso total logado" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total logado" ON public.patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total logado" ON public.specialists FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total logado" ON public.appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total logado" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- --- AUTOMAÇÃO (TRIGGER) ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  
-- 10. TABELA DE TEMPLATES DE ANAMNESE (Para definir as perguntas)
CREATE TABLE public.anamnesis_form_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL, -- Ex: "Ficha Facial", "Ficha Corporal Pós-Operatório"
  version INTEGER DEFAULT 1 NOT NULL,
  -- Armazena a estrutura das perguntas em JSON para o Frontend construir o formulário.
  -- Ex: [{"key": "alergias", "label": "Tem alguma alergia?", "type": "boolean"}, ...]
  fields JSONB, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABELA DE REGISTROS DE ANAMNESE (O Histórico do Paciente)
CREATE TABLE public.anamnesis_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  specialist_id UUID REFERENCES public.specialists(id) NOT NULL, -- Quem preencheu
  template_id UUID REFERENCES public.anamnesis_form_templates(id), -- Qual ficha foi usada
  -- response_data é o objeto JSON que contém TODAS as respostas do formulário preenchido
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --- SEGURANÇA (RLS) ---
ALTER TABLE public.anamnesis_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total logado" ON public.anamnesis_form_templates
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso total logado" ON public.anamnesis_records
FOR ALL USING (auth.role() = 'authenticated');

-- src/migrations/004_create_user_settings_table.sql

-- Tabela para armazenar configurações por usuário
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  notify_expiry BOOLEAN DEFAULT false,
  notify_days_before INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- Opcional: índice por user_id para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Trigger para atualizar 'updated_at' automaticamente (Postgres)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.user_settings;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();
