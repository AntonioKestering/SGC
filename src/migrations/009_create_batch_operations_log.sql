-- SQL para criar tabela de audit log de operações de estoque
-- Execute este script no Supabase SQL Editor

-- Criar tabela de histórico de operações de estoque
CREATE TABLE batch_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Tipo de operação: 'entry', 'sale', 'return', 'adjustment'
  operation_type TEXT NOT NULL CHECK (operation_type IN ('entry', 'sale', 'return', 'adjustment')),
  
  -- Quantidade mudou de -> para
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  quantity_delta INTEGER NOT NULL,  -- Positivo = entrada, Negativo = saída
  
  -- Rastreamento de origem
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  sale_item_id UUID REFERENCES sale_items(id) ON DELETE SET NULL,
  
  -- Metadados
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  
  -- Índices para performance
  CONSTRAINT operation_type_check CHECK (operation_type IN ('entry', 'sale', 'return', 'adjustment'))
);

-- Índices para queries comuns
CREATE INDEX idx_batch_operations_batch_id ON batch_operations_log(batch_id);
CREATE INDEX idx_batch_operations_product_id ON batch_operations_log(product_id);
CREATE INDEX idx_batch_operations_organization_id ON batch_operations_log(organization_id);
CREATE INDEX idx_batch_operations_sale_id ON batch_operations_log(sale_id);
CREATE INDEX idx_batch_operations_created_at ON batch_operations_log(created_at);
CREATE INDEX idx_batch_operations_created_by ON batch_operations_log(created_by);
CREATE INDEX idx_batch_operations_type_date ON batch_operations_log(operation_type, created_at DESC);

-- RLS: Permitir que usuários vejam apenas logs da sua organização
ALTER TABLE batch_operations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view batch operations for their organization"
  ON batch_operations_log
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can insert batch operations for their organization"
  ON batch_operations_log
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE auth.uid() = id
    )
  );

-- Trigger: Criar log automático quando produto_batch é atualizado
CREATE OR REPLACE FUNCTION log_batch_operation()
RETURNS TRIGGER AS $$
BEGIN
  -- Só criar log se current_quantity foi alterada
  IF OLD.current_quantity != NEW.current_quantity THEN
    INSERT INTO batch_operations_log (
      batch_id,
      product_id,
      organization_id,
      operation_type,
      quantity_before,
      quantity_after,
      quantity_delta,
      notes,
      created_by
    ) VALUES (
      NEW.id,
      NEW.product_id,
      NEW.organization_id,
      CASE
        WHEN NEW.current_quantity > OLD.current_quantity THEN 'entry'
        ELSE 'sale'  -- Ou outro tipo, dependendo do contexto
      END,
      OLD.current_quantity,
      NEW.current_quantity,
      NEW.current_quantity - OLD.current_quantity,
      'Auto-logged via trigger',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER product_batches_audit_trigger
AFTER UPDATE ON product_batches
FOR EACH ROW
EXECUTE FUNCTION log_batch_operation();
