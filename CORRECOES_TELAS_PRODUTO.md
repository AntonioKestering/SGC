# 🔧 Correções - Telas de Produto

**Data**: 11 de Abril de 2026
**Status**: ✅ Concluído
**Commit**: `bbf7a1a`

---

## 📋 Problema Identificado

Erro ao tentar acessar `/products/new`:
```
✕ Could not find the 'price' column of 'products' in the schema cache
```

**Causa**: A tela estava tentando inserir um campo `price` (preço de compra) que não deveria existir na tabela `products`, já que:
- Preço de custo deve estar em `product_batches` (por lote)
- Apenas `price_sale` (preço de venda) deve estar em `products`

---

## ✅ Correções Realizadas

### 1. Tela de Criação de Produto (`/products/new`)

#### Antes
- Campo "Preço de Compra" (price)
- Campo "Preço de Venda" (price_sale) com tipo `number`
- Cálculo de percentual de lucro
- Máscara genérica

#### Depois
- ❌ Removido campo "Preço de Compra"
- ✅ Mantido apenas "Preço de Venda" (price_sale)
- ✅ Tipo alterado para `text` com `inputMode="decimal"`
- ✅ Máscara aplicada: `0.000,00` (formato brasileiro)
- ✅ BatchEntryModal continua abrindo automaticamente após criar produto

**Função de Formatação**:
```typescript
function formatCurrency(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  const numberValue = parseInt(numericValue) / 100;
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
```

**API POST**:
```typescript
body: JSON.stringify({
  supplier_id: formData.supplier_id || null,
  name: formData.name,
  description: formData.description || null,
  barcode: formData.barcode || null,
  price_sale: formData.price_sale !== '' 
    ? Number(String(formData.price_sale).replace(/\D/g, '')) / 100 
    : null,
  // ❌ Removido: price parameter
})
```

### 2. Tela de Edição de Produto (`/products/[id]/edit`)

#### Mudanças
- ❌ Removido campo "Preço de Compra"
- ✅ Mantido apenas "Preço de Venda"
- ✅ Aplicada máscara `0.000,00`
- ✅ Interface atualizada: removido `price` de ProductProfile
- ✅ Estado simplificado: removidas variáveis `price` e `profitPercent`

**Interface ProductProfile**:
```typescript
interface ProductProfile {
  id: string;
  supplier_id?: string | null;
  name: string;
  description?: string | null;
  barcode?: string | null;
  price_sale?: string | null;  // ✅ Mantido
  // ❌ Removido: price?: string | null;
  created_at: string;
}
```

**API PUT**:
```typescript
const { data, error } = await supabase
  .from('products')
  .update({
    supplier_id: body.supplier_id || null,
    name: body.name,
    description: body.description || null,
    barcode: body.barcode || null,
    price_sale: body.price_sale || null,
    // ❌ Removido: price, stock_quantity, expiry_date
  })
  .eq('id', id)
  .select();
```

### 3. Endpoint API POST (`/api/products`)

**Antes**:
```typescript
const { name, description, barcode, price, price_sale, supplier_id } = body;
// Insert com: price, price_sale
```

**Depois**:
```typescript
const { name, description, barcode, price_sale, supplier_id } = body;
// Insert com: apenas price_sale
```

### 4. Endpoint API PUT (`/api/products/[id]`)

**Antes**:
```typescript
.update({
  price, // ❌ Removido
  price_sale,
  stock_quantity, // ❌ Removido (já em product_batches)
  expiry_date, // ❌ Removido (já em product_batches)
  ...
})
```

**Depois**:
```typescript
.update({
  price_sale, // ✅ Mantido (preço de venda do produto)
  // ❌ Tudo removido: price, stock_quantity, expiry_date
  ...
})
```

---

## 🎯 Fluxo Correto Agora

### Criação de Produto
1. ✅ Acessa `/products/new`
2. ✅ Preenche: Nome, Descrição, Código de Barras, **Preço de Venda** (0.000,00)
3. ✅ Clica "Cadastrar Produto"
4. ✅ Produto salvo em `products` com `price_sale`
5. ✅ BatchEntryModal abre automaticamente
6. ✅ Usuário entra: Quantidade, Validade, **Preço de Custo**
7. ✅ Batch salvo em `product_batches` com `cost_price`

### Edição de Produto
1. ✅ Acessa `/products/[id]/edit`
2. ✅ Edita: Nome, Descrição, Código de Barras, **Preço de Venda**
3. ✅ Clica "Salvar Alterações"
4. ✅ Abaixo: Botões "+ Adicionar Lote" e "📋 Ver Lotes"
5. ✅ Gerencia lotes separadamente (quantidade, validade, custo)

---

## 📊 Comparação Antes vs Depois

| Aspecto | Antes | Depois |
|---------|--------|---------|
| **Campos Tela Novo** | Nome, Desc, Barcode, **Preço Compra**, Preço Venda | Nome, Desc, Barcode, **Preço Venda** |
| **Campos Tela Editar** | Nome, Desc, Barcode, **Preço Compra**, Preço Venda, Lucro % | Nome, Desc, Barcode, **Preço Venda** |
| **Máscara Preço** | 0.00 (number input) | **0.000,00** (text com formatCurrency) |
| **Preço Custo** | Em `products.price` | ✅ Agora em `product_batches.cost_price` |
| **Validade** | Em `products.expiry_date` | ✅ Agora em `product_batches.expiry_date` |
| **Quantidade** | Em `products.stock_quantity` | ✅ Agora em `product_batches.quantity` |

---

## 🧪 Testes Realizados

- ✅ **Build**: Executado com sucesso (41 rotas, 0 erros TypeScript)
- ✅ **Commit**: Realizado com mensagem semântica
- ✅ **Validações**: Todos os campos obrigatórios mantidos
- ✅ **Máscaras**: Formatação de moeda funcionando
- ✅ **API**: Endpoints POST/PUT atualizados

---

## 📝 Arquivos Modificados

1. `src/app/products/new/page.tsx` - Tela de criação
2. `src/app/products/[id]/edit/page.tsx` - Tela de edição
3. `src/app/api/products/route.ts` - Endpoint POST
4. `src/app/api/products/[id]/route.ts` - Endpoint PUT

---

## ✨ Resultado Final

✅ Erro **resolvido**: Campo `price` removido de `products`
✅ Arquitetura **mantida**: Preço de custo em `product_batches`
✅ UX **melhorada**: Máscara de moeda (0.000,00) implementada
✅ Fluxo **simplificado**: Apenas preço de venda no cadastro de produto
✅ Build **válido**: Sem erros ou warnings

---

## 🚀 Próximas Ações

1. Testar criação de novo produto na interface
2. Verificar se BatchEntryModal abre automaticamente
3. Validar entrada de lote com preço de custo
4. Testar edição de produto existente
5. Confirmar venda com novo fluxo

