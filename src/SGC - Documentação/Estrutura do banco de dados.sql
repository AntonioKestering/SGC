-- 1. CRIAÇÃO DE TIPOS (ENUMS)
-- Atualizado: 'medico' agora é 'especialista'
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'especialista', 'recepcionista');
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

-- Fim da criação de tabelas do sistema
-- Início das tabelas e definições de segurança
-- Multi-tenancy

-- 1. Criação do Tipo de Status para a Empresa
CREATE TYPE organization_status AS ENUM ('active', 'inactive', 'trial');

-- 2. Criação da Tabela de Organizações (Inquilinos)
CREATE TABLE public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT,
  email TEXT,  
  phone TEXT,
  status organization_status DEFAULT 'trial',
  owner_id UUID REFERENCES auth.users(id), -- Quem criou a conta da empresa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Lista de tabelas que precisam de isolamento
DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('profiles', 'patients', 'specialists', 'appointments', 'suppliers', 'products', 'sales', 'sales_items', 'anamnesis_form_templates', 'anamnesis_records', 'user_settings') 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE', t);
        EXECUTE format('CREATE INDEX idx_%I_organization_id ON public.%I(organization_id)', t, t);
    END LOOP; 
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'organization_id')::uuid -- Captura do meta-data no signup
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Removemos a tentativa anterior se ela tiver criado algo parcial
DROP FUNCTION IF EXISTS public.get_user_organization();

-- 2. Criamos a função no schema PUBLIC
CREATE OR REPLACE FUNCTION public.get_user_organization() 
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Damos permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.get_user_organization() TO authenticated;
-- Cria isolamento nas tabelas
DO $$ 
DECLARE 
    t text;
    tables_to_secure text[] := ARRAY[
        'profiles', 
        'patients', 
        'specialists', 
        'appointments', 
        'suppliers', 
        'products', 
        'sales', 
        'sale_items',
        'anamnesis_form_templates', 
        'anamnesis_records', 
        'user_settings'
    ];
BEGIN 
    FOREACH t IN ARRAY tables_to_secure 
    LOOP 
        -- 1. Remove políticas anteriores para evitar conflitos
        EXECUTE format('DROP POLICY IF EXISTS "Acesso total logado" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Isolamento por Organização" ON public.%I', t);
        
        -- 2. Cria a nova política de Multi-tenancy com suporte a Super Admin
        -- Lógica: O usuário vê o dado se (pertencer à empresa dele) OU (se ele for super_admin)
        EXECUTE format('
            CREATE POLICY "Isolamento por Organização" ON public.%I
            FOR ALL 
            TO authenticated
            USING (
                organization_id = public.get_user_organization() 
                OR 
                (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''super_admin''
            )
            WITH CHECK (
                organization_id = public.get_user_organization() 
                OR 
                (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''super_admin''
            )', 
            t
        );
    END LOOP; 
END $$;

-- Política específica para a tabela de organizações
-- 1. Remove a política se ela já existir para evitar o erro 42710
DROP POLICY IF EXISTS "Super Admin gerencia organizações" ON public.organizations;
-- Apenas Super Admins podem ver/editar a tabela de empresas
CREATE POLICY "Super Admin gerencia organizações" ON public.organizations
FOR ALL TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'contato.antoniokestering@gmail.com';