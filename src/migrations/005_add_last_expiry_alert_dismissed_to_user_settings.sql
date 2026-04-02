-- src/migrations/005_add_last_expiry_alert_dismissed_to_user_settings.sql
-- Adiciona coluna para rastrear quando o alerta de vencimento foi descartado

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS last_expiry_alert_dismissed timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_settings_last_alert_dismissed 
ON public.user_settings(last_expiry_alert_dismissed);
