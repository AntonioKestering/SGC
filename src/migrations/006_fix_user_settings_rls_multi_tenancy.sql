-- src/migrations/006_fix_user_settings_rls_multi_tenancy.sql
-- Corrige a política RLS de user_settings para garantir isolamento por usuário e organização

-- Remove políticas antigas/genéricas de user_settings
DROP POLICY IF EXISTS "Acesso total logado" ON public.user_settings;
DROP POLICY IF EXISTS "Isolamento por Organização" ON public.user_settings;

-- 1. Política para SELECT/UPDATE: Usuário só vê e edita suas próprias configurações
CREATE POLICY "Usuário vê suas próprias configurações" 
ON public.user_settings 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 2. Política para INSERT/UPDATE: Só pode inserir/atualizar suas próprias configurações
CREATE POLICY "Usuário edita suas próprias configurações" 
ON public.user_settings 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Política para INSERT: Só pode criar configurações para si mesmo
CREATE POLICY "Usuário cria suas próprias configurações" 
ON public.user_settings 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 4. Política para DELETE: Não permitir delete (opcional, comentado para segurança)
-- CREATE POLICY "Usuário deleta suas configurações" 
-- ON public.user_settings 
-- FOR DELETE 
-- TO authenticated 
-- USING (user_id = auth.uid());
