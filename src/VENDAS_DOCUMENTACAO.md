# Tela de Vendas - Documentação Completa

## Visão Geral

A tela de vendas foi implementada com os melhores padrões de UX, permitindo que usuários efetuem vendas de produtos com suporte a múltiplos itens, cálculos automáticos de descontos e impostos, e filtros por status.

## Estrutura Implementada

### APIs de Vendas

#### 1. **POST /api/sales** - Criar Venda
Cria uma nova venda com múltiplos itens.

**Request:**
```json
{
  "patient_id": "uuid-opcional",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 100.50,
      "discount_amount": 10.00,
      "cost_price": 50.00,
      "sku": "barcode",
      "tax_percent": 5.5
    }
  ],
  "payment_method": 1,
  "discount_amount": 10.00,
  "tax_amount": 15.50,
  "notes": "Observações da venda"
}
```

**Features:**
- Validação de organização (multi-tenancy)
- Cálculo automático de totais
- Inserção em cascata de itens
- RLS e segurança em camada de aplicação
- Status padrão: 1 (finalizada)

**Response:**
```json
{
  "sale": {
    "id": "uuid",
    "total_amount": 205.00,
    "organization_id": "uuid",
    ...
  }
}
```

---

#### 2. **GET /api/sales** - Listar Vendas
Lista todas as vendas da organização do usuário, com dados do paciente e itens.

**Features:**
- Relacionamento com pacientes (LEFT JOIN)
- Relacionamento com itens da venda
- Filtro automático por organization_id
- Ordenação por data (descendente)

**Response:**
```json
{
  "sales": [
    {
      "id": "uuid",
      "patient": { "id": "uuid", "name": "João" },
      "total_amount": 205.00,
      "sale_date": "2026-04-07T15:30:00Z",
      "status": 1,
      "payment_method": 1,
      "sale_items": [...]
    }
  ]
}
```

---

#### 3. **GET /api/sales/[id]** - Detalhes da Venda
Retorna detalhes completos de uma venda específica com itens expandidos.

**Features:**
- Validação de propriedade da venda (organization_id)
- Expansão de produto em cada item
- Barcode e nome do produto inclusos

**Response:**
```json
{
  "sale": {
    "id": "uuid",
    "patient": { "id": "uuid", "name": "João" },
    "sale_items": [
      {
        "product_id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Produto",
          "barcode": "123456"
        },
        "quantity": 2,
        "unit_price": 100.50,
        "total_price": 201.00
      }
    ]
  }
}
```

---

#### 4. **PUT /api/sales/[id]** - Atualizar Venda
Permite atualizar status e notas de uma venda existente.

**Request:**
```json
{
  "status": 0,
  "notes": "Novas observações"
}
```

**Features:**
- Validação de propriedade (organization_id)
- Atualização de timestamp
- Apenas status e notas podem ser alterados

---

#### 5. **DELETE /api/sales/[id]** - Cancelar Venda
Cancela uma venda (soft delete - muda status para -1).

**Features:**
- Validação de propriedade (organization_id)
- Soft delete (não remove dados, apenas marca como cancelada)
- Atualização de timestamp

---

### Páginas de Interface

#### 1. **/sales** - Listagem de Vendas

**Features:**
- ✅ Tabela com todas as vendas
- ✅ Filtro por status (Todas, Cancelada, Pendente, Finalizada)
- ✅ Colunas: Data, Cliente, Pagamento, Valor, Status, Ações
- ✅ Botão "Visualizar" (eye icon)
- ✅ Botão "Cancelar" (X icon) - apenas para vendas ativas
- ✅ Botão "+ Nova Venda"
- ✅ Formatação de moeda (BRL)
- ✅ Status com badges coloridas

**Filtros:**
- **Todas**: Mostra todas as vendas
- **Cancelada**: Status = -1 (vermelha)
- **Pendente**: Status = 0 (amarela)
- **Finalizada**: Status = 1 (verde)

---

#### 2. **/sales/new** - Nova Venda

**Padrão de UX Otimizado:**

##### A. Seção Superior - Dados da Venda
- **Cliente (Opcional)**: Dropdown com pacientes cadastrados
- **Método de Pagamento**: 5 opções (Dinheiro, PIX, Crediário, Débito, Crédito)

##### B. Seção de Busca - Autocomplete Inteligente
- **Campo de Busca**: Busca por código de barras OU nome do produto
- **Dropdown Dinâmico**: Aparece conforme digita
- **Informações do Produto**: Exibe nome, código, preço e estoque
- **Ao Selecionar**: Produto é adicionado à tabela com quantidade 1

**Recursos:**
- Validação de campo vazio
- Dropdown com max-height (scrollável)
- Busca case-insensitive
- Click fora fecha dropdown
- Enter ou clique na opção adiciona item

##### C. Tabela de Itens - Edição Inline

| Campo | Tipo | Features |
|-------|------|----------|
| **Produto** | Texto | Nome + código do barcode |
| **Qtd** | Input | Min=1, edição em tempo real |
| **Unitário** | Input | Campo monetário, edição em tempo real |
| **Desconto** | Input | Campo monetário, edição em tempo real |
| **Imposto %** | Input | Campo percentual, edição em tempo real |
| **Total** | Display | Cálculo automático |
| **Ação** | Botão | Remover item |

**Cálculos por Linha:**
```
LineSubtotal = Qtd × Unitário
LineBeforeTax = LineSubtotal - Desconto
LineTax = LineBeforeTax × (Imposto% / 100)
LineTotal = LineBeforeTax + LineTax
```

##### D. Resumo Financeiro - Cards com Cores
- **Subtotal**: Texto cinza
- **Desconto**: Texto vermelho (negativo)
- **Impostos**: Texto amarelo (positivo)
- **Total**: Texto rosa, fonte maior, destacado

##### E. Observações
- Textarea de 3 linhas
- Suporta quebras de linha
- Opcional

##### F. Botões de Ação
- **Registrar Venda**: Roxo (desabilitado se sem itens)
- **Cancelar**: Cinza

---

#### 3. **/sales/[id]** - Visualizar Venda

**Seções:**

1. **Informações Principais** (4 cards em grid)
   - Data da Venda
   - Status (badge colorida)
   - Cliente
   - Método de Pagamento

2. **Tabela de Itens** (somente leitura)
   - Mesmo layout da tela de nova venda
   - Sem campos editáveis
   - Displays com valores formatados

3. **Resumo Financeiro** (cards)
   - Subtotal
   - Desconto (se houver)
   - Impostos (se houver)
   - Total

4. **Observações** (se houver)
   - Seção separada com texto pre-formatado

---

## Padrões de UX Implementados

### 1. **Busca com Autocomplete**
- Dropdown aparece apenas quando há resultados
- Suporta busca por barcode ou nome
- Exibe informações relevantes (preço, estoque)
- Fecha ao selecionar ou digitar vazio

### 2. **Edição Inline**
- Alterações em tempo real
- Cálculos automáticos conforme digita
- Sem necessidade de salvar linha a linha

### 3. **Feedback Visual**
- Status com badges coloridas
- Campos editáveis com anéis de foco (pink)
- Erros em vermelho
- Estados disabled quando salvando

### 4. **Responsividade**
- Sidebar inteligente
- Container max-width em páginas centralizadas
- Tabelas com overflow-x em mobile
- Botões distribuídos com flexbox

### 5. **Acessibilidade**
- Labels vinculados a inputs
- Placeholders descritivos
- Títulos semânticos
- Validações com mensagens de erro claras

---

## Integração Multi-Tenancy

Todas as operações incluem:

1. **Validação de Autenticação**
   - Busca usuário do JWT (Supabase Auth)
   - Rejeita requisições sem autenticação (401)

2. **Validação de Organização**
   - Busca organization_id do perfil do usuário
   - Filtra dados por organization_id
   - Rejeita acesso não autorizado (403)

3. **Suporte a RLS (Row Level Security)**
   - RLS do Supabase como segunda camada
   - Validação em camada de aplicação como redundância

---

## Campos da Tabela sales

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| patient_id | UUID | Referência ao cliente (opcional) |
| total_amount | NUMERIC | Valor total (com descontos e impostos) |
| sale_date | TIMESTAMP | Data/hora da venda |
| organization_id | UUID | Vínculo com organização |
| status | INTEGER | -1=cancelada, 0=pendente, 1=finalizada |
| subtotal | NUMERIC | Valor antes de descontos/impostos |
| discount_amount | NUMERIC | Desconto total da venda |
| tax_amount | NUMERIC | Impostos totais da venda |
| payment_method | INTEGER | 0=dinheiro, 1=PIX, 2=crediário, 3=débito, 4=crédito |
| notes | TEXT | Observações da venda |
| created_by | UUID | Usuário que criou |
| updated_at | TIMESTAMP | Última atualização |

---

## Campos da Tabela sale_items

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária |
| sale_id | UUID | Referência à venda |
| product_id | UUID | Referência ao produto |
| quantity | INTEGER | Quantidade (validado > 0) |
| unit_price | NUMERIC | Preço unitário |
| discount_amount | NUMERIC | Desconto do item |
| cost_price | NUMERIC | Custo (para análise) |
| total_price | NUMERIC | Preço final do item |
| sku | VARCHAR | Código do barcode |
| tax_percent | NUMERIC | Percentual de imposto |
| organization_id | UUID | Vínculo com organização |

---

## Funcionalidades de Cálculo

### Cálculo de Totais (Nova Venda)

```typescript
items.forEach((item) => {
  const lineSubtotal = item.quantity * item.unit_price;
  subtotal += lineSubtotal;
  
  const lineDiscount = item.discount_amount || 0;
  const lineBeforeTax = lineSubtotal - lineDiscount;
  discountTotal += lineDiscount;
  
  const lineTax = lineBeforeTax * (item.tax_percent || 0) / 100;
  taxTotal += lineTax;
});

total = subtotal - discountTotal + taxTotal;
```

---

## Segurança Implementada

1. ✅ **Autenticação**: JWT via Supabase Auth
2. ✅ **Autorização**: Validação de organization_id
3. ✅ **Soft Delete**: Status = -1 em vez de remover
4. ✅ **RLS**: Supabase Row Level Security
5. ✅ **Validação**: Quantidade > 0, arrays não vazios
6. ✅ **Tipagem**: TypeScript strict mode

---

## Páginas Adicionadas

```
src/
├── app/
│   ├── api/
│   │   └── sales/
│   │       ├── route.ts (GET, POST)
│   │       └── [id]/
│   │           └── route.ts (GET, PUT, DELETE)
│   └── sales/
│       ├── page.tsx (Listagem)
│       ├── new/
│       │   └── page.tsx (Nova venda)
│       └── [id]/
│           └── page.tsx (Detalhes)
```

---

## Rotas Totais do Projeto

- 38 rotas estáticas
- 2 rotas API de vendas (+ 1 dinâmica)
- Build validado: ✅ Zero erros TypeScript

---

## Como Usar

### Criar uma Venda

1. Clique em **"+ Nova Venda"** na página /sales
2. (Opcional) Selecione um cliente
3. Selecione o método de pagamento
4. Digite o código do barcode no campo de busca
5. Selecione o produto no dropdown
6. Ajuste quantidade, desconto, imposto conforme necessário
7. Repita para outros produtos
8. (Opcional) Adicione observações
9. Clique em **"Registrar Venda"**

### Visualizar Venda

1. Acesse a página **Vendas**
2. Clique no ícone de "olho" para visualizar detalhes
3. Veja todos os itens, valores e informações

### Cancelar Venda

1. Na listagem de vendas, clique em **"X"**
2. Confirme o cancelamento
3. Venda será marcada como "Cancelada"

---

## Próximas Melhorias Possíveis

- [ ] Relatórios de vendas por período
- [ ] Exportação para PDF/Excel
- [ ] Integração com fluxo de caixa
- [ ] Comissões para vendedores
- [ ] Cupom fiscal
- [ ] Devolução de itens
- [ ] Histórico de alterações (audit log)

---

**Versão:** 1.0  
**Data:** 2026-04-07  
**Status:** ✅ Implementação Completa
