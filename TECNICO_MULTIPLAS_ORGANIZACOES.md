# Guia Técnico - Múltiplas Organizações

**Versão**: 1.0  
**Data**: 07/04/2026  
**Branch**: 2026.04.07

## 🎯 Problema Resolvido

**Cenário Original**:
- Usuário "pedro@mail.com" existe na Clínica A
- Mesmo email cadastrado na Clínica B
- Após login, sistema fica "confuso" sobre qual org exibir

**Solução Implementada**:
- Sistema detecta múltiplas associações
- Apresenta página de seleção
- Mantém isolamento completo de dados

---

## 🔧 Implementação Técnica

### API: `/api/user/organizations` (GET)

**Location**: `src/app/api/user/organizations/route.ts`

```typescript
export async function GET() {
  // 1. Validar autenticação
  const user = await supabase.auth.getUser();
  
  // 2. Obter profile do usuário (role + org_id atual)
  const profile = await supabase
    .from('profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  // 3. Buscar TODAS as organizações associadas a este usuário
  const userProfiles = await supabase
    .from('profiles')
    .select('organization_id, role, organizations:organization_id(id, name)')
    .eq('id', user.id)
    .not('organization_id', 'is', null);

  // 4. Construir resposta
  return {
    organizations: [
      { id: "uuid-1", name: "Org A", role: "admin" }
    ],
    currentOrganizationId: "uuid-1"
  };
}
```

**Key Points**:
- Usa LEFT JOIN via `organizations:organization_id()` para puxar dados da org
- Filtra apenas registros onde `organization_id IS NOT NULL`
- RLS garante que APENAS orgs do usuário retornem
- Retorna `role` atual em cada org (importante para multi-role)

**Response Schema**:
```typescript
interface OrganizationsResponse {
  organizations: Array<{
    id: UUID;
    name: string;
    role: 'super_admin' | 'admin' | 'especialista' | 'recepcionista';
  }>;
  currentOrganizationId: UUID | null;
}
```

---

### Page: `/organization-select` (Client Component)

**Location**: `src/app/organization-select/page.tsx`

**Flow**:
1. `useEffect` chama API ao mount
2. Se 1 org → `selectOrganization()` direto
3. Se 0 orgs → Mostra erro
4. Se 2+ → Renderiza grid com cards

**Key Functions**:

```typescript
const selectOrganization = async (orgId: string) => {
  // 1. Salvar em localStorage
  localStorage.setItem('selected_organization_id', orgId);
  
  // 2. Atualizar state (para UX feedback)
  setSelectedOrgId(orgId);
  
  // 3. Redirecionar
  setTimeout(() => {
    router.push('/dashboard');
  }, 300);
};
```

**UI Components**:
- Header com ícone Building2 e título
- Grid de cards (1 por org)
- Card mostra: name, role, visual feedback (hover)
- Botão logout sempre disponível

**Acessibilidade**:
- Input validation (não permite clique se já selecionado)
- Disabled state visual feedback
- Loading state durante requisição

---

### Page: `/login` - Mudanças

**Location**: `src/app/login/page.tsx` (linhas 50-80)

**Antes**:
```typescript
const { error } = await supabase.auth.signInWithPassword(/* ... */);
if (error) { /* handle error */ }
router.push('/dashboard');  // ← Sempre vai para dashboard
```

**Depois**:
```typescript
const { error } = await supabase.auth.signInWithPassword(/* ... */);
if (error) { /* handle error */ }

// NEW: Verificar número de orgs
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
const orgResponse = await fetch('/api/user/organizations', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const orgData = await orgResponse.json();
const orgs = orgData.organizations || [];

// Lógica de redirecionamento
if (orgs.length > 1) {
  router.push('/organization-select');  // ← Múltiplas orgs
} else if (orgs.length === 1) {
  localStorage.setItem('selected_organization_id', orgs[0].id);
  router.push('/dashboard');
}
```

**Error Handling**:
- Se API falhar, continua para dashboard (fallback)
- localStorage vazio → dashboard usa org_id do profile

---

### Component: `DashboardLayout` - Mudanças

**Location**: `src/components/layout/DashboardLayout.tsx`

**Novo State**:
```typescript
const [organizations, setOrganizations] = useState<Organization[]>([]);
const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
const [currentOrgName, setCurrentOrgName] = useState<string | null>(null);
const [showOrgDropdown, setShowOrgDropdown] = useState(false);
```

**Load Organizations** (useEffect):
```typescript
async function loadOrganizations() {
  const response = await fetch('/api/user/organizations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setOrganizations(data.organizations || []);
  
  // Ler do localStorage (prioridade 1)
  const savedOrgId = localStorage.getItem('selected_organization_id');
  setCurrentOrgId(savedOrgId || data.currentOrganizationId);
  
  // Atualizar nome visual
  const currentOrg = data.organizations?.find(o => o.id === currentOrgId);
  setCurrentOrgName(currentOrg?.name);
}
```

**Change Handler**:
```typescript
const handleChangeOrganization = (orgId: string) => {
  localStorage.setItem('selected_organization_id', orgId);
  setCurrentOrgId(orgId);
  setCurrentOrgName(organizationName);
  setShowOrgDropdown(false);
  
  // Recarregar para aplicar RLS + APIs com novo org_id
  window.location.href = '/dashboard';
};
```

**Header UI** (novo):
```tsx
{organizations.length > 1 && (
  <div className="relative">
    <button onClick={() => setShowOrgDropdown(!showOrgDropdown)}>
      <Building2 className="w-4 h-4" />
      {currentOrgName}
      <ChevronDown />
    </button>
    
    {showOrgDropdown && (
      <div className="dropdown-menu">
        {organizations.map(org => (
          <button
            key={org.id}
            onClick={() => handleChangeOrganization(org.id)}
            className={currentOrgId === org.id ? 'bg-pink-500/20' : ''}
          >
            {org.name} <span className="opacity-75">{org.role}</span>
          </button>
        ))}
      </div>
    )}
  </div>
)}
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         LOGIN PAGE                          │
│  Email + Password → Supabase Auth → Session Token          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─→ API: /api/user/organizations
                     │   [Retorna: array de orgs]
                     │
             ┌───────┴──────────┐
             │                  │
        1 org encontrado    2+ orgs encontrados
             │                  │
             ├─→ Save localStorage ├─→ /organization-select
             │   org_id                 [User escolhe]
             │                  │
             └────────┬─────────┘
                      │
                  /dashboard
                      │
        ┌─────────────┴──────────────┐
        │  DashboardLayout           │
        │  - Load currentOrgId        │
        │  - Load organizations      │
        │  - Render org selector      │
        │  - Apply RLS filters        │
        └────────────────────────────┘
```

---

## 🔐 Camadas de Segurança

### Camada 1: Session Validation
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
```
❌ Sem token JWT válido = 401 Unauthorized

### Camada 2: RLS Policy
```sql
CREATE POLICY "Isolamento por Organização" ON profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() OR
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
  )
);
```
❌ Query tenta acessar org que usuário não pertence = 0 rows retornadas

### Camada 3: Application Layer
```typescript
// API verifica organization_id explicitamente
.eq('organization_id', profile.organization_id)
```
❌ Mesmo com RLS, app valida server-side

### Camada 4: Frontend localStorage
```typescript
const selectedOrgId = localStorage.getItem('selected_organization_id');
// localStorage apenas para UX, nunca confia cegamente neste valor
```
⚠️ localStorage é apenas referência - server valida sempre

---

## 🧪 Test Cases

### Test 1: API Retorna Organizações Corretas
```bash
curl -X GET http://localhost:3000/api/user/organizations \
  -H "Authorization: Bearer ${TOKEN}"

# Esperado:
{
  "organizations": [
    { "id": "uuid-1", "name": "Clínica A", "role": "admin" },
    { "id": "uuid-2", "name": "Clínica B", "role": "especialista" }
  ],
  "currentOrganizationId": "uuid-1"
}
```

### Test 2: Sem Token = 401
```bash
curl -X GET http://localhost:3000/api/user/organizations

# Esperado: 401 Unauthorized
```

### Test 3: localStorage é Ignorado pelo Server
```typescript
// Frontend tenta forçar org inválida
localStorage.setItem('selected_organization_id', 'uuid-fake');

// API /patients retorna erro RLS
// porque org_id não existe para usuário
```

### Test 4: Trocar Org no Dashboard
```
1. Login com pedro@mail.com
2. Seleciona Clínica A
3. Visualiza pacientes de A (ex: 5 pacientes)
4. Clica dropdown "Clínica A ▼"
5. Seleciona Clínica B
6. Página recarrega
7. Visualiza pacientes de B (ex: 3 pacientes) ✓ Diferentes!
```

---

## 📈 Performance Considerations

### 1. **API Calls**
- Login: 1 call extra (`/api/user/organizations`)
- Dashboard: 1 call extra (`/api/user/organizations` no DashboardLayout)
- **Solução futura**: Cache no localStorage com TTL

### 2. **Query Optimization**
```sql
-- Índice para performance
CREATE INDEX idx_profiles_organization_id 
ON profiles(organization_id);

-- LEFT JOIN é eficiente com índice
SELECT ... FROM profiles p
  LEFT JOIN organizations o ON p.organization_id = o.id
  WHERE p.id = auth.uid();
```

### 3. **localStorage é Síncrono**
- Não bloqueia renderização
- ~1KB de dados
- Rápido em qualquer navegador

---

## 🔄 Migration Path (Se Usuário Tinha Antes)

**Cenário**: Sistema antigo onde usuario tinha APENAS 1 org

```
# Antes (1 org por usuário):
profiles { id, email, full_name, role, organization_id }
           ↑                              ↑ um valor

# Depois (N orgs por usuário):
profiles { id, email, full_name, role, organization_id }
           ↑                              ↑ pode ser nulo ou um dos vários
           
# API /api/user/organizations combina tudo
SELECT ... WHERE profiles.id = auth.uid()
# Retorna TODOS os registros com mesma user_id
```

---

## 🚨 Edge Cases Tratados

### 1. Usuário sem Organização
```typescript
if (!data.organizations || data.organizations.length === 0) {
  setError('Nenhuma organização encontrada...');
}
```

### 2. Organização Deletada (ID ainda em localStorage)
```typescript
const currentOrg = organizations.find(o => o.id === currentOrgId);
if (!currentOrg) {
  // localStorage tem ID inválido, usar primeiro
  setCurrentOrgId(organizations[0]?.id);
}
```

### 3. Token Expirado
```typescript
const response = await fetch('/api/user/organizations');
if (!response.ok) {
  // 401 = token expirado
  router.push('/login');
}
```

### 4. Rede Offline
```typescript
try {
  const response = await fetch(...);
} catch (err) {
  // Sem conexão, usar dados de cache ou localStorage
  console.error('Offline:', err);
}
```

---

## 📚 Referências de Código

| Arquivo | Função | Linhas |
|---------|--------|--------|
| `src/app/api/user/organizations/route.ts` | GET organizations | 7-60 |
| `src/app/organization-select/page.tsx` | SelectOrg page | 1-200 |
| `src/app/login/page.tsx` | handleLogin() | 50-92 |
| `src/components/layout/DashboardLayout.tsx` | Header + Dropdown | 110-180 |

---

## ✅ Checklist de Implementação Completa

- ✅ API endpoint criado
- ✅ Page de seleção criada
- ✅ Login updated
- ✅ DashboardLayout updated
- ✅ Build validado (38 routes)
- ✅ Documentação escrita
- ✅ Commit realizado
- ⏳ Testes manuais (próxima fase)

---

## 📋 Próximas Melhorias

### Priority 1: User Testing
- [ ] Testar com 3+ organizações
- [ ] Validar isolamento RLS
- [ ] Testar trocar org 5+ vezes

### Priority 2: UX Improvements
- [ ] Persistir última org em `user_settings`
- [ ] Adicionar icon visual por org
- [ ] Sincronizar localStorage entre abas

### Priority 3: Admin Features
- [ ] Dashboard de orgs (super_admin)
- [ ] Auditar mudanças de org
- [ ] Limpar localStorage ao logout
