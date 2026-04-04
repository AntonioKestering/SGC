## 🔴 RELATÓRIO CRÍTICO DE SEGURANÇA - MULTI-TENANCY

**Data**: 2026-04-04  
**Severidade**: 🔴 CRÍTICA  
**Status**: Vulnerabilidades encontradas e documentadas

---

## 1. VULNERABILIDADES ENCONTRADAS

### 🔴 **VULNERABILIDADE #1: API de Specialists GET - Sem filtro de organization_id**

**Local**: `src/app/api/specialists/route.ts` (Linha 30-35)

**Problema**:
```typescript
// ❌ ERRADO: Confía apenas em RLS, não força organization_id no application layer
if (currentUserProfile?.role !== 'admin') {
  query = query.eq('profile_id', user.id);
}
// RLS DEVERIA filtrar, mas o código não força organization_id
```

**Impacto**: 
- Um usuário ADMIN de ORG-A vê TODOS os specialists de TODAS as organizações
- Violação de isolamento de dados
- **Reprodução do bug relatado**: User de ORG-A vê specialists de ORG-B se RLS falhar

**Por que ocorre**:
- RLS está configurada corretamente no banco, MAS
- Se RLS tiver qualquer falha ou bug, a API não tem segunda camada de proteção
- Padrão: Sempre reforçar no application layer também

---

### 🔴 **VULNERABILIDADE #2: API de Patients GET - Sem filtro de organization_id**

**Local**: `src/app/api/patients/route.ts` (Linha 4-10)

**Problema**:
```typescript
// ❌ ERRADO: Não filtra por organization_id
const { data: patients, error } = await supabase
  .from('patients')
  .select('*')
  .order('created_at', { ascending: false });
```

**Impacto**: 
- Qualquer usuário logado vê TODOS os pacientes de TODAS as organizações
- RLS deveria filtrar, mas confiar apenas em RLS é insuficiente

---

### 🔴 **VULNERABILIDADE #3: API de Products GET - Sem filtro de organization_id**

**Local**: `src/app/api/products/route.ts` (Linha 7-11)

**Problema**:
```typescript
// ❌ ERRADO: Não valida organization_id
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });
```

**Impacto**: 
- Qualquer usuário vê todos os produtos de todas as organizações

---

### 🟡 **VULNERABILIDADE #4: Dropdowns em New/Edit Pages**

**Locais**: 
- `src/app/appointments/new/page.tsx`
- `src/app/appointments/[id]/edit/page.tsx`

**Problema**:
```typescript
// Fazem chamadas para /api/specialists e /api/patients sem filtro
const [specRes, patRes] = await Promise.all([
  fetch('/api/specialists'),  // ← Retorna de TODAS as org
  fetch('/api/patients'),     // ← Retorna de TODAS as org
]);
```

**Impacto**: 
- Dropdowns mostram dados de outras empresas
- Usuário pode (teoricamente) criar agendamentos com specialists/patients de outra org

---

## 2. MATRIZ DE RISCO

| API | GET List | GET By ID | POST | PUT | DELETE | RLS | App Layer | Status |
|-----|----------|-----------|------|-----|--------|-----|-----------|--------|
| specialists | 🔴 FAIL | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ MISSING | CRÍTICO |
| patients | 🔴 FAIL | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ MISSING | CRÍTICO |
| products | 🔴 FAIL | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ MISSING | CRÍTICO |
| appointments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | OK |
| admin/users | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | OK |

---

## 3. CAUSA RAIZ

**Deficiência de design**:
- Confiança excessiva em RLS (Row Level Security) sem reforço de application layer
- RLS é a 1ª linha de defesa, mas não é suficiente
- Best practice: **2 camadas de proteção**
  1. **RLS** (banco de dados)
  2. **Application Layer** (validação no código)

**Padrão correto** (já implementado em appointments):
```typescript
// 1. Obter organization_id do usuário
const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id)
  .single();

// 2. FORÇAR filtro na query
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('organization_id', profile.organization_id);  // ← APLICAR SEMPRE
```

---

## 4. SOLUÇÃO

### Aplicar padrão de validação em 3 APIs:

1. **`/api/specialists` GET** - Adicionar `.eq('organization_id', profile.organization_id)`
2. **`/api/patients` GET** - Adicionar `.eq('organization_id', profile.organization_id)`
3. **`/api/products` GET** - Adicionar `.eq('organization_id', profile.organization_id)`

### Mudança necessária em cada:

```typescript
// ANTES: ❌
const { data } = await supabase
  .from('table')
  .select('*');

// DEPOIS: ✅
const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id)
  .single();

const { data } = await supabase
  .from('table')
  .select('*')
  .eq('organization_id', profile.organization_id);  // ADICIONAR ISTO
```

---

## 5. VERIFICAÇÃO PÓS-FIX

Após aplicar as correções, testar:

```bash
# Teste 1: Login com User de ORG-A
curl -H "Authorization: Bearer TOKEN_ORG_A" \
  http://localhost:3000/api/specialists
# Deve retornar APENAS specialists de ORG-A

# Teste 2: Login com User de ORG-B
curl -H "Authorization: Bearer TOKEN_ORG_B" \
  http://localhost:3000/api/specialists
# Deve retornar APENAS specialists de ORG-B
# NÃO deve retornar os de ORG-A
```

---

## 6. CONCLUSÃO

✅ **Boas notícias**:
- RLS está corretamente configurada no banco
- Appointments está implementado corretamente (2 camadas)
- Admin routes têm proteção forte

🔴 **Ação Necessária**:
- 3 APIs precisam de reforço de application layer
- Mudanças são simples (adicionar 3-4 linhas em cada)
- Impacto: Segurança crítica + 0 breaking changes

⏱️ **Tempo estimado**: 15 minutos para corrigir

---

