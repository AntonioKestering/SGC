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
