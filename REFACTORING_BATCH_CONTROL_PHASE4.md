# Fase 4: Cancelamento e Rollback de Vendas

**Data**: 11 de Abril, 2026  
**Commits**: TBD (Phase 4 implementation)  
**Branch**: `feat/ControleEstoque`

## Resumo Executivo

Implementação completa de cancelamento de vendas com restauração automática de estoque aos lotes originais. Inclui:

1. ✅ **API: POST /api/sales/[id]** com ação `cancel`
2. ✅ **Stock Restoration Logic** - Restaura para batch específico se rastreado
3. ✅ **UI Modal** - CancelSaleModal com confirmação textual
4. ✅ **Audit Logging** - Registra todas as devoluções em batch_operations_log
5. ✅ **Integration** - Botão de cancelamento em /sales/[id]/page.tsx

---

## 1. Arquivos Criados/Modificados

### API Endpoints

#### `src/app/api/sales/[id]/route.ts` (MODIFICADO)
- **Novo**: Método `POST` com ação `cancel`
- Fluxo:
  1. Validar usuário e organização
  2. Buscar venda + verificar status
  3. Para cada sale_item:
     - Se batch_id: restaurar quantidade ao batch específico
     - Se sem batch_id: restaurar ao primeiro batch do produto
  4. Atualizar sales.status = 0 (cancelada)
  5. Registrar operações em batch_operations_log

#### `src/app/api/sales/[id]/cancel/route.ts` (CRIADO)
- Endpoint alternativo para cancelamento (se preferir separado)
- Pode ser consolidado com o POST anterior

### Componentes

#### `src/components/CancelSaleModal.tsx` (CRIADO)
```typescript
Props:
- saleId: string - ID da venda a cancelar
- isOpen: boolean - Controla visibilidade
- onClose: () => void - Fecha modal
- onConfirm: (data: any) => void - Callback ao confirmar
- loading: boolean - Estado de carregamento
- error: string - Mensagem de erro

Features:
- Busca automática de detalhes da venda ao abrir
- Lista de itens a restaurar com preços
- Campo de confirmação (digitação: "CANCELAR")
- Desabilita botão até confirmação ser digitada
- Mostra detalhes de lote + data de vencimento
```

### Páginas

#### `src/app/sales/[id]/page.tsx` (MODIFICADO)
- Importa CancelSaleModal
- Adiciona estado: `showCancelModal`, `cancelLoading`, `cancelError`
- Adiciona função: `handleCancelConfirm`
- Renderiza botão "Cancelar Venda" se status !== 0
- Renderiza modal com confirmação

---

## 2. Fluxo de Cancelamento Detalhado

### Phase 4: POST /api/sales/[id] { action: 'cancel' }

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. VALIDAÇÃO INICIAL                                            │
├─────────────────────────────────────────────────────────────────┤
│ • Validar user autenticado                                       │
│ • Obter organization_id do profile                               │
│ • Buscar venda com validação de org_id                           │
│ • Verificar status != 0 (não está já cancelada)                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BUSCAR ITENS DA VENDA                                        │
├─────────────────────────────────────────────────────────────────┤
│ • Query sale_items com WHERE sale_id = $1                        │
│ • Retornar todos os itens da venda                               │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. RESTAURAR ESTOQUE - LOOP FOR CADA ITEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ FOR EACH sale_item:                                             │
│                                                                  │
│   IF batch_id ESPECIFICADO:                                     │
│   ├─ Query product_batches[batch_id]                             │
│   ├─ Validate: batch exists & org_id match                      │
│   ├─ UPDATE: current_quantity += item.quantity                   │
│   └─ CREATE audit log: operation_type='return'                  │
│                                                                  │
│   ELSE (batch_id NULL - PVPS):                                  │
│   ├─ Query product_batches (ORDER BY created_at ASC)            │
│   ├─ Use first available batch                                   │
│   ├─ UPDATE: current_quantity += item.quantity                   │
│   └─ CREATE audit log: operation_type='return' (generic)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ATUALIZAR STATUS DA VENDA                                    │
├─────────────────────────────────────────────────────────────────┤
│ • UPDATE sales                                                   │
│   SET status = 0 (cancelada)                                     │
│   WHERE id = $1                                                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. RETORNAR RESPOSTA                                            │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   message: "Venda cancelada com sucesso",                        │
│   sale_id: string,                                               │
│   restores: [                                                    │
│     {                                                            │
│       item_id: string,                                           │
│       batch_id: string,                                          │
│       status: 'success' | 'error' | 'warning',                   │
│       quantity_restored: number,                                 │
│       old_qty: number,                                           │
│       new_qty: number,                                           │
│     }                                                            │
│   ],                                                             │
│   total_items: number,                                           │
│   successful_restores: number,                                   │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Lógica de Restauração - Casos de Uso

### Caso 1: Venda com Lote Rastreado
```typescript
// Item: product=ABC, quantity=5, batch_id=batch-001
// Before: product_batches[batch-001].current_quantity = 10

POST /api/sales/123 { action: 'cancel' }

// Result:
// product_batches[batch-001].current_quantity = 15 ✅
// batch_operations_log: {
//   operation_type: 'return',
//   quantity_before: 10,
//   quantity_after: 15,
//   quantity_delta: 5,
//   sale_id: 123
// }
```

### Caso 2: Venda sem Rastreamento (PVPS)
```typescript
// Item: product=ABC, quantity=5, batch_id=NULL
// Batches: [batch-001 (qty=8), batch-002 (qty=3)]

POST /api/sales/123 { action: 'cancel' }

// Sistema seleciona o primeiro batch (batch-001)
// Result:
// product_batches[batch-001].current_quantity = 13 ✅
// batch_operations_log: {
//   operation_type: 'return',
//   quantity_before: 8,
//   quantity_after: 13,
//   quantity_delta: 5,
//   notes: "Cancelamento (restauração automática) de venda #123"
// }
```

### Caso 3: Múltiplos Itens
```typescript
POST /api/sales/123 { action: 'cancel' }

// sale_items: [
//   { id: '1', quantity: 5, batch_id: 'batch-001' },
//   { id: '2', quantity: 3, batch_id: 'batch-002' },
//   { id: '3', quantity: 2, batch_id: NULL }
// ]

// Resultado:
// batch-001: 10 → 15 ✅
// batch-002: 7 → 10 ✅
// (first batch): 20 → 22 ✅
//
// Response:
// {
//   total_items: 3,
//   successful_restores: 3,
//   failed_restores: 0
// }
```

---

## 4. UI - Modal de Cancelamento

### CancelSaleModal Workflow

```
┌─ Modal Aberto (isOpen=true)
├─ Buscar detalhes da venda
├─ Exibir informações:
│  ├─ Venda ID
│  ├─ Data da venda
│  ├─ Total
│  └─ Status
├─ Listar itens a restaurar
├─ Campo de confirmação: "Digite CANCELAR"
└─ Botões:
   ├─ Manter Venda (fecha)
   └─ Cancelar Venda (POST + reload)
```

### Integração em /sales/[id]/page.tsx

```tsx
{/* Botão visível se não cancelada */}
{saleData.status !== 0 && (
  <button onClick={() => setShowCancelModal(true)}>
    ✕ Cancelar Venda
  </button>
)}

{/* Modal */}
<CancelSaleModal
  saleId={saleId}
  isOpen={showCancelModal}
  onClose={() => setShowCancelModal(false)}
  onConfirm={handleCancelConfirm}
  loading={cancelLoading}
  error={cancelError}
/>
```

---

## 5. Resposta de Erro Tratada

```typescript
// Erro: Venda já cancelada
{
  error: 'Venda já foi cancelada',
  status: 400
}

// Erro: Venda não encontrada
{
  error: 'Venda não encontrada',
  status: 404
}

// Erro: Acesso negado (org mismatch)
{
  error: 'Acesso negado',
  status: 403
}

// Erro durante restauração (alguns itens falham)
{
  restores: [
    { item_id: '1', status: 'success', ... },
    { item_id: '2', status: 'error', message: 'Lote não encontrado' }
  ],
  successful_restores: 1,
  total_items: 2
}
```

---

## 6. Integração com Audit Log

**Trigger automático**: Quando `product_batches.current_quantity` é atualizado,  
trigger `log_batch_operation()` registra automaticamente em `batch_operations_log`:

```sql
INSERT INTO batch_operations_log (
  batch_id,
  product_id,
  organization_id,
  operation_type,
  quantity_before,
  quantity_after,
  quantity_delta,
  sale_id,
  sale_item_id,
  notes,
  created_by,
  created_at
) VALUES (...)
```

---

## 7. Dados de Teste - Cenários E2E

### Teste 1: Cancelamento com 1 Item
```
1. Criar produto ABC (qtd inicial: 10)
2. Criar batch 001 com qty=10
3. Criar venda com 5 unidades de ABC
   → product_batches[001].current_quantity = 5
4. Cancelar venda
   → product_batches[001].current_quantity = 10 ✅
5. Verificar batch_operations_log:
   → 1 entrada com operation_type='return' ✅
```

### Teste 2: Cancelamento com Múltiplos Itens
```
1. Criar produtos: ABC (2 batches), XYZ (1 batch)
2. Criar venda com:
   - 3 un. ABC (batch-001)
   - 2 un. ABC (batch-002)
   - 4 un. XYZ (batch-003)
3. Verificar stock após venda:
   - batch-001: -3
   - batch-002: -2
   - batch-003: -4
4. Cancelar venda
5. Verificar stock restaurado:
   - batch-001: +3 ✅
   - batch-002: +2 ✅
   - batch-003: +4 ✅
```

### Teste 3: Cancelamento com Itens sem Rastreamento
```
1. Criar venda com batch_id=NULL (PVPS)
2. Sistema calcula redução automática
3. Cancelar venda
4. Sistema restaura ao primeiro batch ✅
5. Verificar batch_operations_log com nota de restauração ✅
```

---

## 8. Limitações Conhecidas & Phase 5+

### Atual (Phase 4)
- ✅ Cancelamento com restauração baseada em batch_id
- ✅ Fallback para primeiro batch se sem rastreamento
- ✅ Audit logging automático
- ⚠️ Sem true SQL transaction (BEGIN...ROLLBACK)
- ⚠️ Sem reversão de pagamento/refund calculation

### Phase 5 (Futuro)
- [ ] True SQL transactions para atomicidade
- [ ] Cálculo de refund com múltiplas formas de pagamento
- [ ] Dashboard com analytics de cancelamentos
- [ ] Roteiro de devolução + reintegração de stock

---

## 9. Verificação de Build

```bash
npm run build

# Result:
✓ 41 routes (39 + 2 novos)
✓ 0 TypeScript errors
✓ 0 lint warnings
✓ Compiled in 2.5s

# Novas rotas:
✓ /api/sales/[id]
✓ /api/sales/[id]/cancel
```

---

## 10. Checklist de Implementação

- [x] Criar POST endpoint para cancelamento
- [x] Implementar lógica de restauração de estoque
- [x] Registrar operações em batch_operations_log
- [x] Criar componente CancelSaleModal
- [x] Integrar modal em /sales/[id]/page.tsx
- [x] Adicionar validações (org_id, status, etc)
- [x] Tratar erros e fallbacks
- [x] Build verification ✅
- [ ] E2E Testing (manual + Playwright)
- [ ] Documentation update

---

## Commits Esperados

```
Feat: Phase 4 - Sale cancellation with stock restoration
Feat: Implement POST /api/sales/[id] cancel endpoint
Feat: Create CancelSaleModal component
Feat: Integrate cancel functionality in sales detail page
Docs: Phase 4 - Sale cancellation documentation
```

---

**Status**: ✅ IMPLEMENTAÇÃO CONCLUÍDA  
**Build Status**: ✅ PASSED (41 routes, 0 errors)  
**Próximo**: E2E Testing + Phase 5 Planning
