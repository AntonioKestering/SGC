# 🏗️ ARQUITETURA DO SISTEMA DE AGENDAMENTOS

## Diagrama de Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR (Cliente)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS (Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          pages/appointments/                        │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  • page.tsx          - Listar agendamentos        │  │
│  │  • new/page.tsx      - Criar agendamento           │  │
│  │  • [id]/edit/page.tsx - Editar agendamento        │  │
│  │                                                   │  │
│  │  Features:                                       │  │
│  │  • 3 visualizações (semana, mês, dia)           │  │
│  │  • Navegação de datas                           │  │
│  │  • Formulários com validação                    │  │
│  │  • Cores por status                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                       │                                     │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         api/ (Client → Server)                      │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  Faz requisições:                                 │  │
│  │  GET    /api/appointments                        │  │
│  │  POST   /api/appointments                        │  │
│  │  GET    /api/appointments/[id]                   │  │
│  │  PUT    /api/appointments/[id]                   │  │
│  │  DELETE /api/appointments/[id]                   │  │
│  │  GET    /api/specialists                         │  │
│  │  POST   /api/specialists                         │  │
│  │                                                   │  │
│  │  lib/dateTimeFormatter.ts (Utilitários)         │  │
│  │  • convertToDatetimeLocal()                      │  │
│  │  • formatDatePtBR()                             │  │
│  │  • formatTimePtBR()                             │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬──────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│           NEXT.JS API ROUTES (Backend)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │ app/api/appointments/    │  │ app/api/specialists/ │  │
│  ├──────────────────────────┤  ├──────────────────────┤  │
│  │ • route.ts               │  │ • route.ts           │  │
│  │   - GET (list)           │  │   - GET (list)       │  │
│  │   - POST (create)        │  │   - POST (create)    │  │
│  │                          │  │                      │  │
│  │ • [id]/route.ts          │  │ • [id]/route.ts      │  │
│  │   - GET (read)           │  │   - GET (read)       │  │
│  │   - PUT (update)         │  │   - PUT (update)     │  │
│  │   - DELETE (delete)      │  │   - DELETE (delete)  │  │
│  └──────────────────────────┘  └──────────────────────┘  │
│                                                             │
│  Responsabilidades:                                        │
│  • Validação de dados                                      │
│  • Autenticação (via Supabase)                            │
│  • Business logic                                         │
│  • Error handling                                         │
│  • Logging com [API] prefix                              │
│                                                             │
└─────────────────────────────────┬──────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│            SUPABASE (Database & Auth)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PostgreSQL Tables:                                         │
│  ┌─────────────────┐  ┌──────────────┐ ┌─────────────────┐│
│  │  appointments   │  │ specialists  │ │    patients     ││
│  ├─────────────────┤  ├──────────────┤ ├─────────────────┤│
│  │ id (UUID)       │  │ id (UUID)    │ │ id (UUID)       ││
│  │ specialist_id ──┼─→│ PK           │ │ PK              ││
│  │ patient_id ─────┼─────────────────┼→│                 ││
│  │ start_time      │  │ full_name    │ │ full_name       ││
│  │ end_time        │  │ specialty    │ │ cpf             ││
│  │ status (ENUM)   │  │ created_at   │ │ phone           ││
│  │ notes           │  │              │ │ birth_date      ││
│  │ created_at      │  │ RLS Policies │ │ medical_history ││
│  │                 │  │ ✓ All auth   │ │ created_at      ││
│  │ RLS Policies:   │  │              │ │                 ││
│  │ ✓ SELECT auth   │  │              │ │ RLS Policies    ││
│  │ ✓ INSERT auth   │  │              │ │ ✓ All auth      ││
│  │ ✓ UPDATE auth   │  │              │ │                 ││
│  │ ✓ DELETE auth   │  │              │ │                 ││
│  │                 │  │              │ │                 ││
│  │ Índices:        │  │              │ │                 ││
│  │ • specialist_id │  │              │ │                 ││
│  │ • patient_id    │  │              │ │                 ││
│  │ • start_time    │  │              │ │                 ││
│  │ • status        │  │              │ │                 ││
│  └─────────────────┘  └──────────────┘ └─────────────────┘│
│                                                             │
│  Authentication:                                            │
│  • Supabase Auth (email/senha)                            │
│  • JWT tokens                                              │
│  • Session management                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Diagrama de Componentes Frontend

```
┌─────────────────────────────────────────────┐
│    DashboardLayout (Wrapper)                │
│    • Sidebar                                 │
│    • Navigation menu                         │
│    • Dark theme                              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │     /appointments/page.tsx           │  │
│  │                                      │  │
│  │  Header:                             │  │
│  │  • Título "Agendamentos"             │  │
│  │  • Botão "Novo Agendamento"          │  │
│  │                                      │  │
│  │  Controls:                           │  │
│  │  • Nav mês (prev/next)               │  │
│  │  • Toggle visualizações              │  │
│  │                                      │  │
│  │  ┌────────────────────────────────┐  │  │
│  │  │ Visualização SEMANA (padrão)   │  │  │
│  │  │ • Grid 7 dias                  │  │  │
│  │  │ • Cards coloridos              │  │  │
│  │  │ • Clique para editar           │  │  │
│  │  └────────────────────────────────┘  │  │
│  │                                      │  │
│  │  ┌────────────────────────────────┐  │  │
│  │  │ Visualização MÊS/LISTA         │  │  │
│  │  │ • Tabela formatada             │  │  │
│  │  │ • Botões Editar/Deletar        │  │  │
│  │  │ • Filtro automático            │  │  │
│  │  └────────────────────────────────┘  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │     /appointments/new/page.tsx       │  │
│  │                                      │  │
│  │  • Especialista (dropdown)           │  │
│  │  • Paciente (dropdown)               │  │
│  │  • Data/hora início (datetime)       │  │
│  │  • Data/hora fim (datetime)          │  │
│  │  • Status (select)                   │  │
│  │  • Notas (textarea)                  │  │
│  │  • Botões Salvar/Cancelar            │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  /appointments/[id]/edit/page.tsx    │  │
│  │                                      │  │
│  │  • Carrega dados via API             │  │
│  │  • Mesmos campos que create          │  │
│  │  • Botão Deletar                     │  │
│  │  • Confirmação de exclusão           │  │
│  │  • Feedback visual (salvando)        │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Fluxo de Requisição

### CREATE (Novo Agendamento)
```
1. Usuário preenche formulário
   ↓
2. Frontend valida (campos obrigatórios)
   ├─ Erro: Mostra mensagem em vermelho
   └─ OK: Continua
   ↓
3. Frontend POST /api/appointments
   ├─ body: { specialist_id, patient_id, start_time, end_time, status, notes }
   ↓
4. API Route valida
   ├─ Erro 400: Campos obrigatórios
   ├─ Erro 500: Database
   └─ OK: INSERT na tabela
   ↓
5. Supabase RLS verifica
   ├─ Erro 403: Não autenticado
   └─ OK: INSERT completo
   ↓
6. API retorna agendamento criado
   ↓
7. Frontend redireciona para /appointments
   ↓
8. Novo agendamento aparece na lista
```

### READ (Listar)
```
1. Página carrega
   ↓
2. useEffect busca agendamentos
   ├─ Parâmetros: startDate, endDate
   ├─ Faz GET /api/appointments?startDate=...&endDate=...
   ↓
3. API Route busca no Supabase
   ├─ SELECT * FROM appointments
   ├─ Inclui specialist (JOIN)
   ├─ Inclui patient (JOIN)
   ├─ Filter: start_time BETWEEN startDate AND endDate
   ├─ Order by: start_time ASC
   ↓
4. Supabase RLS verifica (auth)
   ├─ Erro 403: Não autenticado
   └─ OK: Retorna dados
   ↓
5. API formata e retorna JSON
   ↓
6. Frontend renderiza agendamentos
   ├─ Visualização semana (grid)
   ├─ Visualização mês (tabela)
   └─ Cores por status
```

### UPDATE (Editar)
```
1. Usuário clica em agendamento
   ↓
2. Carrega /appointments/[id]/edit
   ├─ Busca agendamento via GET /api/appointments/[id]
   ├─ Carrega especialistas via GET /api/specialists
   ├─ Carrega pacientes via GET /api/patients
   ↓
3. Frontend popula formulário
   ├─ Converte ISO → datetime-local
   ├─ Mostra dados atuais
   ↓
4. Usuário modifica campos
   ├─ Valida em tempo real (opcional)
   ↓
5. Frontend PUT /api/appointments/[id]
   ├─ body: { specialist_id, patient_id, start_time, end_time, status, notes }
   ↓
6. API Route valida e atualiza
   ├─ Verificar FK constraints
   ├─ UPDATE na tabela
   ↓
7. Supabase RLS verifica (auth + ownership)
   ↓
8. API retorna agendamento atualizado
   ↓
9. Frontend redireciona para /appointments
```

### DELETE (Deletar)
```
1. Usuário clica "Deletar"
   ↓
2. Frontend mostra window.confirm()
   ├─ Cancelado: Volta
   └─ Confirmado: Continua
   ↓
3. Frontend DELETE /api/appointments/[id]
   ↓
4. API Route verifica autenticação
   ├─ Erro 403: Não autenticado
   └─ OK: Continua
   ↓
5. DELETE FROM appointments WHERE id = [id]
   ↓
6. Supabase RLS verifica (auth)
   ├─ Cascata: Deleta relacionamentos
   ↓
7. API retorna sucesso
   ↓
8. Frontend redireciona para /appointments
   ↓
9. Agendamento desaparece da lista
```

---

## Estrutura de Dados

### Appointments
```typescript
interface Appointment {
  id: UUID;                          // pk
  specialist_id: UUID;               // fk → specialists
  patient_id: UUID;                  // fk → patients
  start_time: TIMESTAMP WITH TZ;     // ISO 8601
  end_time: TIMESTAMP WITH TZ;       // ISO 8601
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'falta';
  notes?: string;
  created_at: TIMESTAMP WITH TZ;
}
```

### Response com Relacionamentos
```typescript
interface AppointmentWithRelations {
  id: string;
  specialist: {
    id: string;
    full_name: string;
    specialty: string;
  };
  patient: {
    id: string;
    full_name: string;
    phone?: string;
  };
  start_time: string;        // ISO string
  end_time: string;          // ISO string
  status: string;
  notes?: string;
}
```

---

## Fluxo de Validação

```
┌─────────────────────────────────┐
│   FRONTEND VALIDAÇÃO            │
├─────────────────────────────────┤
│ • Campos obrigatórios vazios?   │
│   └─ Sim: Erro (não envia)      │
│   └─ Não: Continua              │
│                                 │
│ • End time > Start time?        │
│   └─ Não: Erro                  │
│   └─ Sim: Continua              │
│                                 │
│ • Formulário válido?            │
│   └─ Sim: Envia POST/PUT        │
│   └─ Não: Mostra erro           │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│   API VALIDAÇÃO (route.ts)      │
├─────────────────────────────────┤
│ • Todos os campos presentes?    │
│   └─ Não: Status 400            │
│   └─ Sim: Continua              │
│                                 │
│ • IDs existem no banco?         │
│   └─ Não: Status 400            │
│   └─ Sim: Continua              │
│                                 │
│ • Usuário autenticado?          │
│   └─ Não: Status 401            │
│   └─ Sim: Continua              │
│                                 │
│ • Operação bem-sucedida?        │
│   └─ Não: Status 500            │
│   └─ Sim: Status 200/201        │
└─────────────────────────────────┘
                ↓
┌─────────────────────────────────┐
│   DATABASE VALIDAÇÃO (RLS)      │
├─────────────────────────────────┤
│ • Usuário autenticado?          │
│   └─ Não: Bloqueia              │
│   └─ Sim: Continua              │
│                                 │
│ • FK constraints válidas?       │
│   └─ Não: Erro no banco         │
│   └─ Sim: Executa operação      │
└─────────────────────────────────┘
```

---

## Performance & Escalabilidade

### Índices de Database
```sql
-- Queries rápidas em:
CREATE INDEX idx_appointments_specialist_id ON appointments(specialist_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### Otimizações
- ✅ Dados aninhados (1 query = appointment + specialist + patient)
- ✅ Date range filtering (não carrega todo mês desnecessariamente)
- ✅ Ordenação no banco (not in memory)
- ✅ RLS no nível do banco (segurança eficiente)

---

## Diagrama de Transições de Estado

```
        CREATE
          ↓
    [AGENDADO] ←─→ [CONFIRMADO]
       ↓ ↘            ↙ ↓
       │  [CANCELADO] │
       │              │
       └─→ [CONCLUÍDO] ← [FALTA]
           
Fluxo típico:
AGENDADO → CONFIRMADO → CONCLUÍDO (sucesso)
AGENDADO → CANCELADO (usuário cancela)
CONCLUÍDO ← FALTA (paciente não compareceu)
```

---

**Arquitetura documentada e testada ✅**
