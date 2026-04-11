-- Migration: Remove deprecated columns from products table
-- These fields are now managed exclusively through product_batches table
-- Date: 2026-04-11

-- ⚠️ IMPORTANTE: Execute esta migração APÓS fazer backup do banco de dados

-- Step 1: Remover a coluna stock_quantity
ALTER TABLE products DROP COLUMN IF EXISTS stock_quantity;

-- Step 2: Remover a coluna expiry_date  
ALTER TABLE products DROP COLUMN IF EXISTS expiry_date;

-- Step 3: Remover a coluna price (dados movidos para product_batches.cost_price)
-- Nota: Se você precisar preservar os preços históricos, faça um backup antes
ALTER TABLE products DROP COLUMN IF EXISTS price;

-- Resultado: Tabela products agora contém apenas:
-- - id (UUID)
-- - organization_id (UUID) - multi-tenancy
-- - name (TEXT)
-- - description (TEXT)
-- - barcode (TEXT)
-- - price_sale (NUMERIC) - preço de venda do produto
-- - supplier_id (UUID)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- Todas as informações de lote, estoque e validade agora estão em product_batches:
-- - product_batches.current_quantity: estoque atual do lote
-- - product_batches.initial_quantity: estoque inicial do lote
-- - product_batches.expiry_date: data de validade do lote
-- - product_batches.cost_price: preço de custo específico do lote
-- - product_batches.batch_number: identificação do lote
-- - product_batches.created_at: quando o lote foi registrado
