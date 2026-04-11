# Refatoração: Gestão de Estoque por Lotes (Batch Control)
**Data:** 11 de Abril de 2026  
**Branch:** feat/ControleEstoque  
**Status:** ✅ Fase 1 Implementada

---

## 1. Resumo Executivo

Iniciamos a refatoração da aplicação SGC para migrar de um modelo de estoque simplificado (colunas na tabela products) para um sistema robusto de Controle por Lotes. Essa mudança permite:

- ✅ Rastreabilidade completa de produtos por lote
- ✅ Gestão de múltiplas validades por produto
- ✅ Implementação da estratégia PVPS (Primeiro que Vence, Primeiro que Sai)
- ✅ Auditoria total desde entrada até venda/devolução
- ✅ Suporte a transações atômicas para integridade de dados

---

## 2. Trabalho Realizado - Fase 1 ✅

### 2.1 Migrations Criadas

**Arquivo:** `src/migrations/007_create_product_batches_table.sql`

Tabela `product_batches` com:
- `id` (UUID PK)
- `product_id` (FK → products)
- `organization_id` (FK → organizations, para multi-tenancy)
- `batch_number` (VARCHAR 50, identificador do lote)
- `expiry_date` (DATE, data de validade)
- `initial_quantity` (INTEGER, quantidade na entrada)
- `current_quantity` (INTEGER, quantidade disponível)
- `cost_price` (NUMERIC 15,2, custo específico do lote)
- `created_at`, `updated_at` (timestamps)

**Índices Criados:**
- `idx_product_batches_product_id` (busca por produto)
- `idx_product_batches_organization_id` (multi-tenancy)
- `idx_product_batches_expiry_date` (ordenação PVPS)
- `idx_product_batches_product_org` (busca composta)

**RLS Policies:** 4 políticas implementadas (SELECT, INSERT, UPDATE, DELETE) com validação de organization_id

---

**Arquivo:** `src/migrations/008_add_batch_id_to_sale_items.sql`

Adiciona à tabela `sale_items`:
- `batch_id` (UUID FK → product_batches, ON DELETE RESTRICT)
- Índices para performance em queries de rastreamento

---

### 2.2 APIs Implementadas

**Endpoint:** `GET/POST /api/product-batches`

**GET Features:**
- Lista lotes com filtro opcional por product_id
- Validação de organization_id (RLS compliant)
- Ordenação padrão por expiry_date ASC (PVPS ready)

**POST Features:**
- Criar novo lote com validações
- current_quantity inicializado = initial_quantity
- Atribuição automática de organization_id

---

**Endpoint:** `GET/PUT/DELETE /api/product-batches/[id]`

**GET:** Buscar detalhes específicos de um lote

**PUT Features:**
- Atualizar batch_number, expiry_date, current_quantity, cost_price
- Validação de propriedade (organization_id)
- timestamp de updated_at

**DELETE Features:**
- Soft delete validation (só deleta se current_quantity = 0)
- Proteção contra exclusão de lotes com estoque

---

### 2.3 Componente React

**Arquivo:** `src/components/BatchEntryModal.tsx`

Modal para entrada de estoque com:
- Campo de Número do Lote (opcional)
- Campo de Data de Validade (obrigatório)
- Campo de Quantidade (obrigatório)
- Campo de Custo Unitário (opcional)
- Validações em tempo real
- Integração com API de product_batches

---

## 3. Arquitetura de Dados

```
┌─────────────┐
│  products   │  (removidas colunas: stock_quantity, expiry_date)
└──────┬──────┘
       │
       │ 1:N
       ▼
┌──────────────────────┐
│ product_batches      │  ← Controla estoque real
│                      │
│ - product_id (FK)    │
│ - batch_number       │
│ - expiry_date        │
│ - current_quantity   │
│ - cost_price         │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐
│   sale_items         │  ← Rastreia origem
│                      │
│ - batch_id (FK) NEW  │
│ - product_id         │
│ - quantity           │
└──────────────────────┘
```

---

## 4. Fluxo Implementado

### 4.1 Entrada de Estoque
1. Usuário acessa tela de produtos
2. Clica em "Adicionar Estoque" → Abre BatchEntryModal
3. Preenche: batch_number, expiry_date, quantidade, custo
4. POST /api/product-batches cria registro novo
5. current_quantity = initial_quantity

### 4.2 Estoque em Lotes (Estrutura Pronta)
- Query: `SELECT SUM(current_quantity) FROM product_batches WHERE product_id = ? AND organization_id = ?`
- Retorna saldo total do produto considerando todos os lotes

### 4.3 PVPS Ready (Próximas Fases)
- Query: `SELECT * FROM product_batches WHERE product_id = ? ORDER BY expiry_date ASC LIMIT 1`
- Identifica lote mais próximo do vencimento

---

## 5. Status das Tarefas

| # | Tarefa | Status | Próximas Fases |
|---|--------|--------|---|
| 1 | Criar migration product_batches | ✅ Completo | - |
| 2 | Atualizar sale_items com batch_id | ✅ Completo | Executar migration |
| 3 | Remover colunas de products | ⏳ Pendente | Fase 2 |
| 4 | API product-batches | ✅ Completo | - |
| 5 | Página de Cadastro de Produtos | ⏳ Pendente | Fase 2 |
| 6 | Listagem de Produtos com Lotes | ⏳ Pendente | Fase 2 |
| 7 | Lógica PVPS em Vendas | ⏳ Pendente | Fase 3 |
| 8 | Transações em POST /api/sales | ⏳ Pendente | Fase 3 |
| 9 | Cancelamento com Rastreabilidade | ⏳ Pendente | Fase 4 |
| 10 | Testes E2E Batch Control | ⏳ Pendente | Fase 5 |

---

## 6. Próximas Fases

### Fase 2: Interface de Usuário
- [ ] Atualizar `/products/new` e `/products/[id]/edit` com BatchEntryModal
- [ ] Modificar `/products` para exibir SUM(current_quantity)
- [ ] Criar botão "Ver Lotes" que lista todos os lotes do produto

### Fase 3: Lógica de Vendas com PVPS
- [ ] Refatorar `/sales/new` para buscar lotes PVPS
- [ ] Implementar múltiplos lotes em uma única venda (se quantidade > 1 lote)
- [ ] Atualizar POST `/api/sales` com transações
- [ ] Salvar batch_id em cada sale_item

### Fase 4: Devolução e Rastreabilidade
- [ ] Modal de cancelamento com opção de retorno ao estoque
- [ ] Identificar batch_id original via sale_items
- [ ] Transações para UPDATE current_quantity ou apenas status change

### Fase 5: Validação e Deploy
- [ ] Executar migrations no Supabase
- [ ] Testes E2E de todo fluxo
- [ ] Merge para main e deploy em produção

---

## 7. Commit & Branch

- **Commit:** `9a75f36`
- **Branch:** feat/ControleEstoque
- **Build:** ✅ 38 rotas, zero erros TypeScript

---

## 8. Notas de Segurança

✅ **Multi-tenancy:** Todas as queries validam organization_id via RLS  
✅ **Permissões:** RLS policies implementadas em product_batches  
✅ **Integridade Referencial:** Foreign keys com ON DELETE CASCADE/RESTRICT  
✅ **Auditoria:** timestamps created_at/updated_at para rastreabilidade  

---

## 9. Instruções para Próximas Implementações

### Para Desenvolvedores:

1. **Adicionar lote via API:**
   ```bash
   POST /api/product-batches
   {
     "product_id": "uuid-aqui",
     "batch_number": "BATCH-2024-001",
     "expiry_date": "2026-12-31",
     "initial_quantity": 100,
     "cost_price": 15.50
   }
   ```

2. **Buscar lotes de um produto:**
   ```bash
   GET /api/product-batches?product_id=uuid-aqui
   ```

3. **Atualizar estoque após venda:**
   ```bash
   PUT /api/product-batches/[id]
   {
     "current_quantity": 85  // 100 - 15 vendidos
   }
   ```

---

**Próxima Revisão:** Quando Fase 2 (Interface) estiver completa
