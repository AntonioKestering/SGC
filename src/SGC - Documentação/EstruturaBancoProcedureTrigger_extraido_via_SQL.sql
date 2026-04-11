/*
  Este arquivo contém a estrutura do banco de dados, incluindo tabelas, funções, gatilhos e políticas de segurança.
  Ele foi extraído via SQL para documentar a estrutura do banco de dados do projeto SGC.
  As tabelas representam as entidades principais do sistema, enquanto as funções e gatilhos implementam a lógica de negócios e garantem a integridade dos dados.
  As políticas de segurança garantem o isolamento por organização e definem os níveis de acesso para os usuários autenticados.
*/

/*
1. Extraindo as Policies (RLS) prontas para reuso
Este comando vai gerar o script CREATE POLICY prontinho. Copie o resultado da coluna comando_sql.

SELECT 
    'CREATE POLICY "' || policyname || '" ON "' || tablename || 
    '" FOR ' || cmd || ' TO ' || (roles[1])::text || 
    ' USING (' || qual || ')' || 
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ');' ELSE ';' END AS comando_sql
FROM pg_policies
WHERE schemaname = 'public';

2. Extraindo Triggers (Gatilhos)
O Postgres tem uma função que reconstrói o comando de criação para você:

SELECT pg_get_triggerdef(oid) || ';' AS comando_sql
FROM pg_trigger
WHERE tgisinternal = false;

3. Extraindo Functions e Procedures (A lógica)
Para pegar o código completo de criação (incluindo argumentos e retornos):

SELECT pg_get_functiondef(p.oid) || ';' AS comando_sql
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

4. Extraindo as Tabelas (Estrutura)
Para não ter que montar na mão, use esta query que gera o CREATE TABLE básico:

SELECT 
  'CREATE TABLE ' || table_name || ' (' || 
  string_agg(column_name || ' ' || data_type || 
  (CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END), ', ' ORDER BY ordinal_position) || 
  ');' AS comando_sql
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name;
*/

--Create Table:
CREATE TABLE anamnesis_form_templates (id uuid NOT NULL, name text NOT NULL, version integer NOT NULL, fields jsonb, created_at timestamp with time zone NOT NULL, organization_id uuid);
CREATE TABLE anamnesis_records (id uuid NOT NULL, patient_id uuid NOT NULL, specialist_id uuid NOT NULL, template_id uuid, response_data jsonb NOT NULL, created_at timestamp with time zone NOT NULL, organization_id uuid);
CREATE TABLE appointments (id uuid NOT NULL, specialist_id uuid NOT NULL, patient_id uuid NOT NULL, start_time timestamp with time zone NOT NULL, end_time timestamp with time zone NOT NULL, status USER-DEFINED, notes text, created_at timestamp with time zone NOT NULL, organization_id uuid);
CREATE TABLE organizations (id uuid NOT NULL, name text NOT NULL, full_name text, email text, phone text, status USER-DEFINED, owner_id uuid, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL);
CREATE TABLE patients (id uuid NOT NULL, full_name text NOT NULL, cpf text, phone text, birth_date date, medical_history text, created_at timestamp with time zone NOT NULL, organization_id uuid);
CREATE TABLE products (id uuid NOT NULL, supplier_id uuid, name text NOT NULL, description text, barcode text, stock_quantity integer, expiry_date date, price numeric, created_at timestamp with time zone NOT NULL, price_sale numeric, organization_id uuid);
CREATE TABLE profiles (id uuid NOT NULL, email text, full_name text, role USER-DEFINED, created_at timestamp with time zone NOT NULL, phone text, organization_id uuid);
CREATE TABLE sale_items (id uuid NOT NULL, sale_id uuid NOT NULL, product_id uuid NOT NULL, quantity integer NOT NULL, unit_price numeric NOT NULL, organization_id uuid, discount_amount numeric, cost_price numeric, total_price numeric NOT NULL, sku character varying, tax_percent numeric);
CREATE TABLE sales (id uuid NOT NULL, patient_id uuid, total_amount numeric NOT NULL, sale_date timestamp with time zone NOT NULL, organization_id uuid, status integer, subtotal numeric NOT NULL, discount_amount numeric, tax_amount numeric, payment_method integer, notes text, created_by uuid, updated_at timestamp with time zone);
CREATE TABLE specialists (id uuid NOT NULL, profile_id uuid NOT NULL, specialty text NOT NULL, registry_number text, color_code text, created_at timestamp with time zone NOT NULL, organization_id uuid);
CREATE TABLE suppliers (id uuid NOT NULL, company_name text NOT NULL, cnpj text, contact_name text, phone text, created_at timestamp with time zone NOT NULL, organization_id uuid);
CREATE TABLE user_settings (id uuid NOT NULL, user_id uuid NOT NULL, notify_expiry boolean, notify_days_before integer, created_at timestamp with time zone NOT NULL, updated_at timestamp with time zone NOT NULL, last_expiry_alert_dismissed timestamp with time zone DEFAULT NULL, organization_id uuid);

--Controle de estoque e validade
ALTER TABLE products 
  DROP COLUMN stock_quantity, 
  DROP COLUMN expiry_date;

CREATE TABLE product_batches (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL, -- FK para a tabela products
    organization_id uuid NOT NULL,    
    batch_number VARCHAR(50), -- O lote que vem impresso na caixa pelo fabricante
    expiry_date DATE NOT NULL, -- A validade específica deste lote    
    initial_quantity integer NOT NULL, -- Quantidade que entrou
    current_quantity integer NOT NULL DEFAULT 0, -- Quantidade que ainda resta    
    cost_price numeric(15,2), -- Preço de custo deste lote específico
    created_at timestamp with time zone NOT NULL DEFAULT now(),    
    -- Relacionamento (Chave Estrangeira)
    CONSTRAINT fk_product_batch 
        FOREIGN KEY (product_id) 
        REFERENCES products(id) 
        ON DELETE CASCADE
);

-- Índice para acelerar a busca de validade (essencial para o PVPS)
CREATE INDEX idx_batches_expiry ON product_batches(product_id, expiry_date);

-- Comentário para clareza
COMMENT ON COLUMN sales.status IS 'Ex: -1 cancelada, 0 pendente, 1 finalizada';
COMMENT ON COLUMN sales.payment_method IS 'Ex: 0 dinheiro, 1 pix, 2 crediario, 3 débito, 4 crédito,';

CREATE INDEX IF NOT EXISTS idx_user_settings_last_alert_dismissed 
ON public.user_settings(last_expiry_alert_dismissed);

--Create Function (routines)
comando_sql
CREATE OR REPLACE FUNCTION public.get_my_profile_data()
 RETURNS TABLE(role text, org_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role::text, organization_id 
  FROM public.profiles 
  WHERE id = auth.uid();
$function$
;
CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$function$
;
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_user_organization()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, organization_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    'especialista', -- Define a role padrão como 'especialista'
    NULL    -- O organization_id começa nulo até ele ser convidado ou criar uma empresa
  );
  RETURN new;
END;
$function$
;

--Create Trigger:
CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();
CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();
CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();
CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

--Policies
CREATE POLICY Isolamento por Organização ON patients FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON appointments FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON suppliers FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON products FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON sales FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON sale_items FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON anamnesis_form_templates FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON anamnesis_records FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Isolamento por Organização ON user_settings FOR ALL TO authenticated USING (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role))) WITH CHECK (((organization_id = get_user_organization()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role)));
CREATE POLICY Super Admin gerencia organizações ON organizations FOR ALL TO authenticated USING ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'super_admin'::user_role));
CREATE POLICY Isolamento por Organização ON specialists FOR ALL TO authenticated USING ((organization_id IN ( SELECT profiles.organization_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));
CREATE POLICY Permitir leitura para autenticados ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY Permitir leitura para autenticados ON specialists FOR SELECT TO authenticated USING (true);