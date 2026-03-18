-- SQL para executar no Supabase SQL Editor
-- Adiciona coluna phone à tabela profiles

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

-- Verifica se a coluna foi adicionada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'phone';
