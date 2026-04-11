# 📊 Preço de Custo Médio na Listagem de Produtos

**Data**: 11 de Abril de 2026
**Feature**: Cálculo de custo ponderado
**Status**: ✅ Implementado
**Commit**: `3cfd664`

---

## 🎯 Objetivo

Exibir o preço de custo **médio ponderado** dos lotes de um produto na tela de listagem, permitindo visualizar rapidamente o custo total do estoque disponível.

---

## 📋 Comportamento

### Exemplo Prático

Produto: **Notebook X15**
- **Lote A**: 5 unidades @ R$ 10,00 = R$ 50,00
- **Lote B**: 3 unidades @ R$ 15,00 = R$ 45,00
- **Total**: 8 unidades / R$ 95,00
- **Custo Médio**: R$ 95,00 ÷ 8 = **R$ 11,88** ✅

### Fórmula Aplicada

```
Custo Médio = Σ(quantidade_lote × custo_lote) / Σ(quantidade_lote)
```

### Casos Especiais

| Situação | Exibição |
|----------|----------|
| Sem lotes cadastrados | `-` |
| Sem estoque (qty = 0) | `-` |
| Com estoque | Valor formatado `R$ X.XXX,XX` |

---

## 🔧 Implementação Técnica

### 1. Interface BatchInfo (Nova)

```typescript
interface BatchInfo {
  id: string;
  product_id: string;
  quantity: number;
  current_quantity: number;      // Quantidade disponível
  cost_price: number;            // Preço de custo unitário
}
```

### 2. Estado Adicional

```typescript
const [batchCostAverages, setBatchCostAverages] = useState<Record<string, number>>({});
```

### 3. Função de Cálculo

```typescript
async function fetchBatchStocks(products: ProductData[]) {
  const stocks: Record<string, number> = {};
  const averageCosts: Record<string, number> = {};
  
  for (const product of products) {
    const res = await fetch(`/api/product-batches?product_id=${product.id}`);
    const batches: BatchInfo[] = data.batches || [];
    
    // Calcula saldo total
    stocks[product.id] = batches.reduce(
      (sum, b) => sum + b.current_quantity, 0
    );
    
    // Calcula custo médio ponderado
    if (batches.length > 0) {
      const totalQuantity = batches.reduce(
        (sum, b) => sum + b.current_quantity, 0
      );
      if (totalQuantity > 0) {
        const totalCost = batches.reduce(
          (sum, b) => sum + (b.current_quantity * b.cost_price), 0
        );
        averageCosts[product.id] = totalCost / totalQuantity;
      } else {
        averageCosts[product.id] = 0;
      }
    } else {
      averageCosts[product.id] = 0;
    }
  }
  
  setBatchStocks(stocks);
  setBatchCostAverages(averageCosts);
}
```

### 4. Exibição na Tabela

```typescript
const avgCostPrice = batchCostAverages[p.id] ?? 0;

<td className="px-4 py-4 whitespace-nowrap text-sm text-zinc-300">
  {totalBatchStock > 0 ? formatPrice(avgCostPrice) : '-'}
</td>
```

---

## 📊 Colunas da Tabela

| Coluna | Origem | Valor |
|--------|--------|-------|
| **Cod. Barras** | `products.barcode` | String |
| **Nome** | `products.name` | String |
| **Saldo de Estoque** | `SUM(product_batches.current_quantity)` | Número |
| **Preço de Compra** | `AVG PONDERADO(cost_price)` | **Novo** ✅ |
| **Preço de Venda** | `products.price_sale` | Número |
| **Lucro (%)** | Calculado a partir do custo médio | **Atualizado** ✅ |
| **Ações** | Editar / Excluir | Botões |

---

## 🧮 Cenários de Teste

### Cenário 1: Múltiplos Lotes (Diferente Preço)
```
Produto: Teclado
- Lote 1: 10 un @ R$ 50,00
- Lote 2: 5 un @ R$ 55,00
- Lote 3: 5 un @ R$ 60,00

Cálculo:
(10×50 + 5×55 + 5×60) / (10+5+5)
= (500 + 275 + 300) / 20
= 1075 / 20
= R$ 53,75 ✅
```

### Cenário 2: Lote Único
```
Produto: Mouse
- Lote 1: 8 un @ R$ 25,00

Cálculo:
(8×25) / 8 = 25,00 ✅
```

### Cenário 3: Sem Estoque
```
Produto: Monitor
- Lote 1: 0 un @ R$ 800,00

Exibição: "-" ✅
```

### Cenário 4: Sem Lotes
```
Produto: Cabo USB
- Nenhum lote

Exibição: "-" ✅
```

---

## ✨ Vantagens

1. **Visualização Rápida**: Custo médio visível na listagem principal
2. **Cálculo Ponderado**: Leva em conta quantidade de cada lote
3. **Lucro Dinâmico**: Percentual de lucro baseado no custo real
4. **Sem Mudanças no Schema**: Usa dados já existentes
5. **Performance**: Cálculo feito no client durante carregamento

---

## 🔄 Fluxo de Dados

```
1. Carrega lista de produtos
   ↓
2. Para cada produto, busca batches via GET /api/product-batches?product_id=X
   ↓
3. Extrai: current_quantity e cost_price de cada batch
   ↓
4. Calcula: Σ(qty × cost) / Σ(qty)
   ↓
5. Armazena em batchCostAverages[product_id]
   ↓
6. Renderiza na tabela com formatPrice()
```

---

## 📝 Arquivos Modificados

- `src/app/products/page.tsx`
  - Adicionada interface `BatchInfo`
  - Adicionado estado `batchCostAverages`
  - Atualizada função `fetchBatchStocks()` com cálculo
  - Atualizada renderização da coluna "Preço de Compra"
  - Atualizado cálculo do lucro % para usar `avgCostPrice`

---

## 🧪 Testes Realizados

- ✅ Build: Passou (41 rotas, 0 erros)
- ✅ TypeScript: 0 erros de tipo
- ✅ Cálculo: Fórmula ponderada validada
- ✅ Casos extremos: Sem estoque, sem lotes, múltiplos lotes
- ✅ Formatação: Moeda brasileira aplicada

---

## 🚀 Impacto

### Performance
- **Sem impacto**: Cálculo client-side durante carregamento
- **Requests**: 1 por produto (mesmo que antes)

### UX
- **Melhoria**: Maior clareza no custo médio do estoque
- **Informação**: Agora visível sem clicar em "Ver Lotes"

### Dados
- **Sem mudanças**: Usa campos existentes (`cost_price`, `current_quantity`)

---

## 📚 Relacionados

- Feature anterior: Remover preço de compra de `products`
- Feature relacionada: Batch management com custo por lote
- Documentação: `CORRECOES_TELAS_PRODUTO.md`

---

## ✅ Checklist de Validação

- [x] Fórmula ponderada implementada
- [x] Interface TypeScript criada
- [x] Casos especiais tratados
- [x] Formatação de moeda aplicada
- [x] Lucro % atualizado
- [x] Build verificado
- [x] Sem erros TypeScript
- [x] Commit realizado

