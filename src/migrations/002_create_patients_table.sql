-- SQL para criar tabela de pacientes
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  phone TEXT,
  birth_date DATE,
  medical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow read all patients" 
  ON patients FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert patients" 
  ON patients FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update patients" 
  ON patients FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete patients" 
  ON patients FOR DELETE 
  USING (true);

-- Criar índice para CPF (busca rápida)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);

-- Criar índice para nome (busca rápida)
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);
