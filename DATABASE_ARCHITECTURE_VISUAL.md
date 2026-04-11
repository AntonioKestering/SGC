# Database Architecture - Batch Control System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE PostgreSQL Schema                           │
└─────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ PRODUCTS TABLE (Simplified - Metadata Only)                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ id (UUID)                    ← Primary key                               │
│ organization_id (UUID)       ← RLS filter (multi-tenancy)                │
│ name (TEXT) *required        ← "Acetaminofeno 500mg"                    │
│ description (TEXT)           ← "Analgésico/Antipirético"                 │
│ barcode (TEXT)              ← "7890123456789"                            │
│ price_sale (NUMERIC)        ← 15.50 (preço de venda padrão)             │
│ supplier_id (UUID)          ← FK para suppliers table                    │
│ created_at (TIMESTAMP)      ← Auto                                       │
│ updated_at (TIMESTAMP)      ← Auto                                       │
│                                                                          │
│ ❌ REMOVIDO: stock_quantity                                             │
│ ❌ REMOVIDO: expiry_date                                                │
│ ❌ REMOVIDO: price (cost)                                               │
│                                                                          │
│ RLS POLICIES:                                                            │
│   - SELECT: WHERE organization_id = auth.uid().org_id                  │
│   - INSERT: SET organization_id = auth.uid().org_id                    │
│   - UPDATE: WHERE organization_id = auth.uid().org_id                  │
│   - DELETE: WHERE organization_id = auth.uid().org_id                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N Relationship
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PRODUCT_BATCHES TABLE (Dynamic Stock Data)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ id (UUID)                       ← Primary key                            │
│ product_id (UUID) *FK           ← References products.id                 │
│ organization_id (UUID)          ← RLS filter                             │
│ batch_number (TEXT)             ← "LOT-2026-03-001"                      │
│ initial_quantity (INTEGER)      ← 100 (initial entry)                    │
│ current_quantity (INTEGER)      ← 75 (after sales) [UPDATABLE]           │
│ expiry_date (DATE)              ← '2026-12-31'                           │
│ cost_price (NUMERIC)            ← 8.50 (batch-specific cost)             │
│ created_at (TIMESTAMP)          ← Auto                                   │
│ updated_at (TIMESTAMP)          ← Auto (on each stock change)            │
│                                                                          │
│ INDEXES:                                                                 │
│   - product_id (for PVPS sort)                                           │
│   - expiry_date (for PVPS: ORDER BY expiry_date ASC)                    │
│   - organization_id (for RLS)                                            │
│   - created_at (for audit trail)                                         │
│                                                                          │
│ RLS POLICIES:                                                            │
│   - SELECT: WHERE organization_id = auth.uid().org_id                  │
│   - INSERT: SET organization_id = auth.uid().org_id                    │
│   - UPDATE: WHERE organization_id = auth.uid().org_id                  │
│   - DELETE: WHERE organization_id = auth.uid().org_id                  │
│                                                                          │
│ TRIGGERS:                                                                │
│   - AFTER UPDATE ON current_quantity                                     │
│     → Calls: log_batch_operation()                                       │
│     → Inserts row into batch_operations_log                              │
│     → Records: qty_before, qty_after, delta, user, timestamp             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
        │
        │ 1:N Relationship
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ BATCH_OPERATIONS_LOG TABLE (Audit Trail)                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ id (UUID)                    ← Primary key                               │
│ batch_id (UUID) *FK          ← References product_batches.id             │
│ product_id (UUID)            ← Denormalized for quick queries            │
│ organization_id (UUID)       ← RLS filter                                │
│ operation_type (TEXT)        ← 'entry' | 'sale' | 'return' | 'adjust'  │
│ quantity_before (INTEGER)    ← Stock level before operation              │
│ quantity_after (INTEGER)     ← Stock level after operation               │
│ quantity_delta (INTEGER)     ← Change amount (signed)                    │
│ sale_id (UUID)              ← FK to sales (if sale/return)               │
│ sale_item_id (UUID)         ← FK to sale_items (if sale/return)          │
│ notes (TEXT)                ← "Venda #ABC123" or "Cancelamento"          │
│ created_by (UUID)           ← User who triggered operation               │
│ created_at (TIMESTAMP)      ← Auto (immutable)                           │
│                                                                          │
│ INDEXES:                                                                 │
│   - batch_id (find all ops for batch)                                    │
│   - product_id (find all ops for product)                                │
│   - organization_id (RLS)                                                │
│   - sale_id (link to sales)                                              │
│   - created_at (time-series queries)                                     │
│   - created_by (user audit)                                              │
│                                                                          │
│ RLS POLICIES:                                                            │
│   - SELECT: WHERE organization_id = auth.uid().org_id                  │
│   - INSERT: SET organization_id = auth.uid().org_id                    │
│                                                                          │
│ IMMUTABLE:                                                               │
│   - No UPDATE allowed (complete history)                                 │
│   - Only INSERT (create audit records)                                   │
│   - Only SELECT (read audit trail)                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
        │
        └─→ Other tables (SALES, SALE_ITEMS, etc.) depend on this


┌──────────────────────────────────────────────────────────────────────────┐
│ SALE_ITEMS TABLE (Updated to track batches)                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ id (UUID)                    ← Primary key                               │
│ sale_id (UUID) *FK           ← References sales.id                       │
│ product_id (UUID)            ← References products.id                    │
│ batch_id (UUID)              ← ✅ NEW: References product_batches.id    │
│ quantity (INTEGER)           ← Units sold from this batch                │
│ unit_price (NUMERIC)         ← Sale price per unit                       │
│ created_at (TIMESTAMP)       ← Auto                                      │
│                                                                          │
│ NOTE: batch_id can be NULL during import from old system                │
│       but should always be set for new sales (POST-refactor)             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════

DATA FLOW EXAMPLES

════════════════════════════════════════════════════════════════════════════


1️⃣  ENTRY: New Product Created (01:00:00)
    ─────────────────────────────────────

    INSERT INTO products (name, price_sale, organization_id)
    VALUES ('Acetaminofeno 500mg', 15.50, 'org-123')
    RETURNING id → 'prod-001'

    INSERT INTO product_batches (product_id, batch_number, initial_quantity, 
                                 current_quantity, expiry_date, cost_price)
    VALUES ('prod-001', 'LOT-001', 100, 100, '2026-12-31', 8.50)
    RETURNING id → 'batch-001'

    ✅ TRIGGER: log_batch_operation()
       INSERT INTO batch_operations_log:
       {
         batch_id: 'batch-001',
         operation_type: 'entry',
         quantity_before: 0,
         quantity_after: 100,
         quantity_delta: 100,
         notes: 'Entrada inicial de estoque'
       }

    Result in DB:
    ┌─ products[prod-001]
    │  └─ stock_quantity: (removed) ❌
    │
    └─ product_batches[batch-001]
       ├─ current_quantity: 100 ✅
       └─ expiry_date: 2026-12-31
          │
          └─ batch_operations_log (1 entry)
             └─ operation: 'entry', qty 0→100


2️⃣  SALE: Sale Transaction (02:15:00)
    ──────────────────────────

    POST /api/sales {
      items: [
        {
          product_id: 'prod-001',
          batch_id: 'batch-001',    ← Rastreamento!
          quantity: 25,
          unit_price: 15.50
        }
      ]
    }

    ✅ VALIDATION:
       SELECT current_quantity FROM product_batches 
       WHERE batch_id = 'batch-001' AND organization_id = 'org-123'
       → 100 >= 25 ✓

    ✅ CONSUME:
       UPDATE product_batches SET current_quantity = 75
       WHERE id = 'batch-001'
       → current_quantity changed: 100 → 75

    ✅ TRIGGER: log_batch_operation()
       INSERT INTO batch_operations_log:
       {
         batch_id: 'batch-001',
         operation_type: 'sale',
         quantity_before: 100,
         quantity_after: 75,
         quantity_delta: -25,
         sale_id: 'sale-001',
         sale_item_id: 'sale-item-001',
         notes: 'Venda #sale-001'
       }

    INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price)
    VALUES ('sale-001', 'prod-001', 'batch-001', 25, 15.50)

    Result in DB:
    ├─ sales[sale-001]
    │  └─ sale_items[sale-item-001]
    │     ├─ product_id: 'prod-001'
    │     └─ batch_id: 'batch-001' ← Rastreado!
    │
    └─ product_batches[batch-001]
       ├─ current_quantity: 75 (updated)
       │
       └─ batch_operations_log (2 entries now)
          ├─ 'entry': qty 0→100
          └─ 'sale': qty 100→75


3️⃣  PVPS AUTO-SELECTION (if batch_id not specified)
    ──────────────────────────────────

    POST /api/sales {
      items: [
        {
          product_id: 'prod-001',
          batch_id: null,          ← Não especificado
          quantity: 10,
          unit_price: 15.50
        }
      ]
    }

    ✅ AUTO-DETECT:
       SELECT * FROM product_batches 
       WHERE product_id = 'prod-001' 
       ORDER BY expiry_date ASC  ← Mais próximo de vencer
       LIMIT 1
       → Returns batch-001 (expires 2026-12-31)

    ✅ ASSIGN batch_id automatically
       batch_id = 'batch-001'

    ✅ CONSUME & LOG as before


4️⃣  CANCELLATION: Sale Cancelled (03:30:00)
    ──────────────────────────────

    POST /api/sales/sale-001 { action: 'cancel' }

    ✅ VALIDATE:
       SELECT * FROM sales WHERE id = 'sale-001' AND status != 0
       → Found, not yet cancelled ✓

    ✅ FETCH ITEMS:
       SELECT * FROM sale_items WHERE sale_id = 'sale-001'
       → Returns: sale-item-001 with batch_id='batch-001', qty=25

    ✅ RESTORE:
       UPDATE product_batches SET current_quantity = 100
       WHERE id = 'batch-001'
       → current_quantity: 75 → 100

    ✅ TRIGGER: log_batch_operation()
       INSERT INTO batch_operations_log:
       {
         batch_id: 'batch-001',
         operation_type: 'return',
         quantity_before: 75,
         quantity_after: 100,
         quantity_delta: 25,
         sale_id: 'sale-001',
         sale_item_id: 'sale-item-001',
         notes: 'Cancelamento de venda #sale-001'
       }

    ✅ UPDATE SALE:
       UPDATE sales SET status = 0 WHERE id = 'sale-001'
       → Sales status: 1 (completed) → 0 (cancelled)

    Result in DB:
    ├─ sales[sale-001]
    │  └─ status: 0 (cancelled) ✅
    │
    └─ product_batches[batch-001]
       ├─ current_quantity: 100 (restored)
       │
       └─ batch_operations_log (3 entries now)
          ├─ 'entry': qty 0→100
          ├─ 'sale': qty 100→75
          └─ 'return': qty 75→100 ← Cancelamento logged


════════════════════════════════════════════════════════════════════════════

QUERIES EXAMPLES

════════════════════════════════════════════════════════════════════════════

-- Get total stock for product (shown in product list)
SELECT SUM(current_quantity) as total_stock
FROM product_batches
WHERE product_id = 'prod-001' AND organization_id = 'org-123'
RESULT: 75 (after all transactions above)


-- Get batch history (shown in Details modal)
SELECT 
  id, batch_number, initial_quantity, current_quantity,
  expiry_date, cost_price, created_at
FROM product_batches
WHERE product_id = 'prod-001' AND organization_id = 'org-123'
ORDER BY created_at DESC


-- Get complete audit trail for batch
SELECT 
  operation_type, quantity_before, quantity_after, 
  sale_id, created_by, created_at
FROM batch_operations_log
WHERE batch_id = 'batch-001' AND organization_id = 'org-123'
ORDER BY created_at ASC
RESULT: 3 rows (entry, sale, return)


-- Find products expiring soon
SELECT p.id, p.name, pb.batch_number, pb.expiry_date,
       SUM(pb.current_quantity) as quantity
FROM products p
JOIN product_batches pb ON pb.product_id = p.id
WHERE pb.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND p.organization_id = 'org-123'
ORDER BY pb.expiry_date ASC


-- Get all sales for batch (traceability)
SELECT s.id, s.created_at, si.quantity, si.unit_price
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
WHERE si.batch_id = 'batch-001' AND s.organization_id = 'org-123'
ORDER BY s.created_at DESC


════════════════════════════════════════════════════════════════════════════

SUMMARY

════════════════════════════════════════════════════════════════════════════

✅ Data is NORMALIZED:
   Products table → Metadata only
   Product_batches table → Dynamic stock data
   Batch_operations_log → Immutable audit trail

✅ Multi-tenancy ENFORCED:
   Every table has organization_id
   RLS policies on all sensitive tables
   No cross-org data leakage

✅ Auditability COMPLETE:
   Every stock change logged
   Linked to sales/users for accountability
   Complete history preserved

✅ Performance OPTIMIZED:
   Proper indexes on join columns
   Organization_id indexed for RLS
   Expiry_date indexed for PVPS

✅ Referential Integrity:
   Foreign keys on product_id
   No orphaned records
   Cascade delete options

════════════════════════════════════════════════════════════════════════════
