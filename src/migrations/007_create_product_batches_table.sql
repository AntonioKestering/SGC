-- SQL para criar tabela de controle de lotes de produtos
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS product_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  batch_number VARCHAR(50), -- Identificador do fabricante ou entrada
  expiry_date DATE NOT NULL, -- Data de validade
  initial_quantity INTEGER NOT NULL, -- Quantidade na entrada
  current_quantity INTEGER NOT NULL DEFAULT 0, -- Quantidade disponível
  cost_price NUMERIC(15, 2), -- Custo específico deste lote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para performance
CREATE INDEX idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX idx_product_batches_organization_id ON product_batches(organization_id);
CREATE INDEX idx_product_batches_expiry_date ON product_batches(expiry_date);
CREATE INDEX idx_product_batches_product_org ON product_batches(product_id, organization_id);

-- Ativar RLS (Row Level Security)
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver lotes apenas da sua organização
CREATE POLICY "Users can view batches from their organization"
  ON product_batches
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política: Usuários podem inserir lotes na sua organização
CREATE POLICY "Users can insert batches in their organization"
  ON product_batches
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política: Usuários podem atualizar lotes da sua organização
CREATE POLICY "Users can update batches in their organization"
  ON product_batches
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política: Usuários podem deletar lotes da sua organização
CREATE POLICY "Users can delete batches from their organization"
  ON product_batches
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
