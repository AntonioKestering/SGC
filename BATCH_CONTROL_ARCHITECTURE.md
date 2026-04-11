# Arquitetura Batch Control - Diagrama Visual

## Estrutura de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        SISTEMA SGC                              │
│                   Batch Control Architecture                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      LAYER: Database                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │   organizations │◄─── Multi-tenancy                          │
│  │                 │     (cada organização tem seu próprio      │
│  │ id (PK)         │      estoque e lotes)                      │
│  │ name            │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│           │ 1:N relationship                                   │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │   products      │                                            │
│  │ (ATUALIZADO)    │                                            │
│  ├─────────────────┤                                            │
│  │ id (PK)         │                                            │
│  │ name            │                                            │
│  │ barcode         │                                            │
│  │ price_sale      │                                            │
│  │ ❌ stock_quantity│  ← REMOVIDO (agora em product_batches)    │
│  │ ❌ expiry_date   │  ← REMOVIDO (agora em product_batches)    │
│  └────────┬────────┘                                            │
│           │                                                     │
│           │ 1:N relationship                                   │
│           ▼                                                     │
│  ┌─────────────────────────────────────┐                       │
│  │   product_batches  (NOVO)           │                       │
│  ├─────────────────────────────────────┤                       │
│  │ id (PK)                             │                       │
│  │ product_id (FK)                     │                       │
│  │ organization_id (FK)                │ ← Multi-tenancy       │
│  │ batch_number                        │   Identificador       │
│  │ expiry_date                         │   PVPS Sort Key ↑     │
│  │ initial_quantity                    │                       │
│  │ ► current_quantity ◄                │   ← Controla Estoque  │
│  │ cost_price                          │                       │
│  │ created_at, updated_at              │                       │
│  └────────┬─────────────────────────────┘                       │
│           │                                                     │
│           │ 1:N relationship                                   │
│           │ (rastreabilidade)                                  │
│           ▼                                                     │
│  ┌─────────────────────────────────────┐                       │
│  │   sale_items  (ATUALIZADO)          │                       │
│  ├─────────────────────────────────────┤                       │
│  │ id (PK)                             │                       │
│  │ sale_id (FK)                        │                       │
│  │ product_id (FK)                     │                       │
│  │ ► batch_id (FK) NEW ◄               │   ← Rastreia origem   │
│  │ quantity                            │     do item           │
│  │ unit_price                          │                       │
│  │ discount_amount                     │                       │
│  │ tax_percent                         │                       │
│  └─────────────────────────────────────┘                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

```

## Fluxo de Operações

### 1️⃣ Entrada de Estoque (Cadastro de Lote)

```
┌─────────────────────────────────────────────────────────────┐
│           USUÁRIO ADICIONA NOVO LOTE                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  BatchEntryModal (Frontend)       │
         ├───────────────────────────────────┤
         │ • batch_number (optional)         │
         │ • expiry_date (required) ◄─ PVPS  │
         │ • initial_quantity (required)     │
         │ • cost_price (optional)           │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  POST /api/product-batches        │
         ├───────────────────────────────────┤
         │ Validações:                       │
         │ • organization_id check           │
         │ • expiry_date not null            │
         │ • initial_quantity > 0            │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  CREATE in product_batches        │
         ├───────────────────────────────────┤
         │ current_quantity = initial_qty    │
         │ created_at = NOW()                │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  ✅ Lote Criado com Sucesso       │
         │  estoque ativo e pronto para      │
         │  ser consumido em vendas          │
         └───────────────────────────────────┘
```

### 2️⃣ Cálculo de Estoque Total (Produto)

```
┌─────────────────────────────────────────────────────────────┐
│       USUÁRIO VISUALIZA ESTOQUE DO PRODUTO                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  /products (Listagem)             │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  GET /api/product-batches         │
         │  ?product_id={id}                 │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  Query Database:                  │
         │  SELECT SUM(current_quantity)     │
         │  FROM product_batches             │
         │  WHERE product_id = ?             │
         │  AND organization_id = ?          │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  Exemplo:                         │
         │  Lote A: current_qty = 30         │
         │  Lote B: current_qty = 45         │
         │  Lote C: current_qty = 25         │
         │  ─────────────────────────        │
         │  Total: 100 unidades ✅           │
         └───────────────────────────────────┘
```

### 3️⃣ Venda com PVPS (Próxima Fase)

```
┌─────────────────────────────────────────────────────────────┐
│       USUÁRIO CRIA VENDA (PVPS - Primeiro que Vence)        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  /sales/new (Tela de Vendas)      │
         │  Seleciona: Produto + Quantidade  │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  Sistema Busca Lote PVPS:         │
         │  GET /api/product-batches         │
         │  WHERE product_id = ?             │
         │  ORDER BY expiry_date ASC         │
         │  LIMIT 1                          │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  Lote Selecionado:                │
         │  • batch_id = UUID                │
         │  • expiry_date = 2024-06-30       │
         │  • current_qty = 50               │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  Se qty_vendida <= qty_disponível:│
         │  ✅ Usa 1 lote                     │
         │                                   │
         │  Se qty_vendida > qty_disponível: │
         │  ✅ Consome lote 1                 │
         │  ✅ Busca próximo lote             │
         │  ✅ Consome lote 2                 │
         │  (múltiplos lotes em 1 venda)     │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  Transaction BEGIN                │
         │  • INSERT sale_items com batch_id │
         │  • UPDATE product_batches         │
         │    current_qty -= vendido         │
         │  • UPDATE sales status=finalizado │
         │  Transaction COMMIT               │
         │  (Atômico: sucesso ou falha total)│
         └───────────────────────────────────┘
```

### 4️⃣ Devolução/Cancelamento (Próxima Fase)

```
┌─────────────────────────────────────────────────────────────┐
│    USUÁRIO CANCELA VENDA (Com Rastreabilidade)             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  /sales (Listagem)                │
         │  Clica em Cancelar                │
         └───────────────────────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │  Modal: "Retornar ao estoque?"    │
         │  [SIM] ► Devolve quantidade       │
         │  [NÃO] ► Apenas cancela           │
         └───────────────────────────────────┘
                          │
                          ├──────────────┬──────────────┐
                          ▼              ▼              ▼
            [SIM]   [NÃO]         [AMBOS]
              │       │               │
              ▼       ▼               ▼
         ┌─────────────────────────────────────┐
         │ Identifica batch_id original:      │
         │ SELECT batch_id FROM sale_items    │
         │ WHERE id = ?                       │
         └─────────────────────────────────────┘
              │            │
              ▼            ▼
         UPDATE          UPDATE
         current_qty   status=
         += returnado  cancelado
              │            │
              ▼            ▼
         Estoque        Apenas
         Restaurado     Registro
              │            │
              └─────┬──────┘
                    ▼
            ✅ Operação Completa
            (Transação Atômica)
```

## Índices e Performance

```
┌─────────────────────────────────────────────────────────────┐
│               ÍNDICES CRIADOS                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ idx_product_batches_product_id                            │
│  ↓ Busca rápida: Todos lotes de um produto                │
│    Query: WHERE product_id = ? LIMIT 100                  │
│    Performance: O(log n)                                   │
│                                                             │
│ idx_product_batches_organization_id                       │
│  ↓ Filtro de multi-tenancy                                │
│    Query: WHERE organization_id = ?                       │
│    Performance: O(log n)                                   │
│                                                             │
│ idx_product_batches_expiry_date                           │
│  ↓ Ordenação PVPS                                          │
│    Query: ORDER BY expiry_date ASC                        │
│    Performance: O(log n) sorted scan                       │
│                                                             │
│ idx_product_batches_product_org (Composto)               │
│  ↓ Otimiza queries com ambos filtros                       │
│    Query: WHERE product_id = ? AND org_id = ?            │
│    Performance: O(log n)                                   │
│                                                             │
│ idx_sale_items_batch_id                                    │
│  ↓ Rastreabilidade de vendas por lote                      │
│    Query: WHERE batch_id = ?                              │
│    Performance: O(log n)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Segurança e Validações

```
┌─────────────────────────────────────────────────────────────┐
│            VALIDAÇÕES E SEGURANÇA                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ RLS (Row Level Security)                                │
│    Todas queries filtram por organization_id              │
│    Usuários veem apenas lotes da sua organização          │
│                                                             │
│ ✅ Foreign Key Constraints                                 │
│    product_id FK → products(id)                           │
│    organization_id FK → organizations(id)                 │
│    batch_id FK → product_batches(id)                      │
│                                                             │
│ ✅ Transações Atômicas                                     │
│    Venda: CREATE sale_items + UPDATE batches              │
│    Ambas succeed ou ambas fail                            │
│                                                             │
│ ✅ Soft-Delete Validation                                  │
│    Só deleta lote se current_quantity = 0                 │
│    Protege contra perda de histórico                      │
│                                                             │
│ ✅ Validações de Negócio                                   │
│    expiry_date not null                                   │
│    initial_quantity > 0                                   │
│    current_quantity >= 0                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Próximo Passo:** Executar migrations no Supabase → Fase 2 UI
