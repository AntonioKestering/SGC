-- SQL para criar tabela de agendamentos
-- Execute este script no Supabase SQL Editor

CREATE TYPE appointment_status AS ENUM ('agendado', 'confirmado', 'concluido', 'cancelado', 'falta');

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status DEFAULT 'agendado',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow read all appointments" 
  ON appointments FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert appointments" 
  ON appointments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update appointments" 
  ON appointments FOR UPDATE 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete appointments" 
  ON appointments FOR DELETE 
  USING (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_specialist_id ON appointments(specialist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
