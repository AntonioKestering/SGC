-- SQL para adicionar coluna batch_id na tabela sale_items
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna batch_id (opcional, pois nem todas as vendas podem ter lote rastreado)
ALTER TABLE sale_items
ADD COLUMN batch_id UUID REFERENCES product_batches(id) ON DELETE RESTRICT;

-- Criar índice para buscar itens de um lote
CREATE INDEX idx_sale_items_batch_id ON sale_items(batch_id);

-- Criar índice composto para análise de vendas por lote
CREATE INDEX idx_sale_items_product_batch ON sale_items(product_id, batch_id);
