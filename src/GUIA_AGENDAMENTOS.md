# Guia de Agendamentos - SGC

## Visão Geral

A tela de agendamentos foi criada com um design inspirado no Outlook, permitindo visualização em semana, mês ou lista com gerenciamento completo de consultas.

## Arquivos Criados

### Frontend (React/Next.js)

#### `src/app/appointments/page.tsx`
Página principal de agendamentos com múltiplas visualizações:
- **Visualização de Semana**: Grade 7x5 mostrando dias da semana com horas
- **Visualização de Mês**: Lista formatada com todas as informações
- **Visualização de Dia**: Alternar entre visualizações rápidas

**Funcionalidades:**
- Navegação entre meses (botões prev/next)
- Cores por status (agendado, confirmado, concluído, cancelado, falta)
- Clique em agendamento para editar
- Botão para criar novo agendamento
- Carregamento dinâmico com date range filtering

#### `src/app/appointments/new/page.tsx`
Formulário para criar novo agendamento:
- Seleção de especialista (carregado de `/api/specialists`)
- Seleção de paciente (carregado de `/api/patients`)
- Data/hora de início e término com validação
- Status inicial ("agendado")
- Campo de notas para observações
- Validação de hora de término > hora de início

#### `src/app/appointments/[id]/edit/page.tsx`
Página de edição com funcionalidades completas:
- Carregamento dos dados atuais do agendamento
- Edição de todos os campos (especialista, paciente, horários, status, notas)
- Conversão automática de ISO strings para formato datetime-local
- Botão para deletar agendamento com confirmação
- Feedback visual durante salvamento

### Backend (API Routes)

#### `src/app/api/appointments/route.ts`
Endpoints GET e POST:
- **GET**: Lista agendamentos com filtro por data (startDate, endDate params)
- **POST**: Cria novo agendamento com validação
- Retorna dados aninhados (especialista + paciente)

#### `src/app/api/appointments/[id]/route.ts`
Endpoints para operações individuais:
- **GET**: Carrega um agendamento específico
- **PUT**: Atualiza agendamento
- **DELETE**: Remove agendamento
- Implementa padrão async params do Next.js 16

#### `src/app/api/specialists/route.ts` (NOVO)
Endpoints para gerenciar especialistas:
- **GET**: Lista todos os especialistas
- **POST**: Cria novo especialista

#### `src/app/api/specialists/[id]/route.ts` (NOVO)
Operações individuais em especialistas:
- **GET**: Carrega especialista
- **PUT**: Atualiza especialista
- **DELETE**: Remove especialista

### Utilitários

#### `src/lib/dateTimeFormatter.ts` (NOVO)
Funções auxiliares para formatação de datas:
- `convertToDatetimeLocal()`: Converte ISO 8601 → formato datetime-local
- `formatDatePtBR()`: Formata data em português
- `formatTimePtBR()`: Formata hora em português
- `formatDateTimePtBR()`: Formata data e hora completas

## Schema do Banco de Dados

### Tabela: appointments
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status NOT NULL DEFAULT 'agendado',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ENUM type
CREATE TYPE appointment_status AS ENUM (
  'agendado',
  'confirmado',
  'concluido',
  'cancelado',
  'falta'
);
```

### Relacionamentos
- `appointments.specialist_id` → `specialists.id`
- `appointments.patient_id` → `patients.id`
- Delete cascata em ambos os relacionamentos

## Como Usar

### Criar Agendamento
1. Clique em "Novo Agendamento" na página `/appointments`
2. Selecione especialista e paciente
3. Defina data/hora de início e término
4. Adicione notas opcionais
5. Clique em "Salvar"

### Editar Agendamento
1. Na visualização de semana, clique no agendamento
2. Ou na visualização de lista, clique em "Editar"
3. Modifique os campos desejados
4. Clique em "Salvar" ou "Deletar"

### Visualizações
- **Semana**: Clique em "Semana" para ver grade 7 dias
- **Mês/Lista**: Clique em "Mês" ou "Dia" para ver tabela formatada
- **Navegação**: Use setas para mês anterior/seguinte

## Cores de Status (Tailwind CSS)

| Status | Cor | Classe |
|--------|-----|--------|
| agendado | Azul | `bg-blue-500/20 text-blue-200` |
| confirmado | Verde | `bg-green-500/20 text-green-200` |
| concluído | Cinza | `bg-gray-500/20 text-gray-200` |
| cancelado | Vermelho | `bg-red-500/20 text-red-200` |
| falta | Amarelo | `bg-yellow-500/20 text-yellow-200` |

## Validações

### No Frontend
- Campos obrigatórios: especialista, paciente, data/hora início, data/hora fim
- Hora de término deve ser posterior à hora de início
- Mensagens de erro destacadas em vermelho

### No Backend (API)
- Validação de campos obrigatórios antes de INSERT/UPDATE
- Verificação de relacionamentos com FK constraints
- RLS (Row Level Security) para acesso apenas a usuários autenticados

## Padrões de Código Utilizados

### Async Params (Next.js 16)
```typescript
{ params }: { params: Promise<{ id: string }> }
```

### Conversão de DateTime
```typescript
const datetimeLocal = convertToDatetimeLocal(isoString);
// Entrada: "2024-12-20T14:30:00Z"
// Saída: "2024-12-20T14:30"
```

### Busca com Relacionamentos
```typescript
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabaseAdmin = getSupabaseAdmin();

const { data } = await supabaseAdmin
  .from('appointments')
  .select('*, specialist:specialist_id(*), patient:patient_id(*)')
```

## Próximos Passos Opcionais

- [ ] Validação de conflitos de horário
- [ ] Sistema de notificações/lembretes
- [ ] Exportar agenda (PDF, iCal)
- [ ] Integração de calendário com drag-and-drop
- [ ] Envio automático de confirmação por email
- [ ] Dashboard com estatísticas de agendamentos

## Troubleshooting

**Erro: "Especialista não encontrado"**
- Verifique se especialistas foram criados em `/specialists`
- Execute: `/api/specialists` GET para listar

**Erro: "Paciente não encontrado"**
- Verifique se pacientes foram criados em `/patients`
- Execute: `/api/patients` GET para listar

**Datas não aparecem corretamente**
- Verifique timezone do servidor (usando UTC com TIMESTAMP WITH TIME ZONE)
- Confirme conversão locale em pt-BR

**Problema ao editar**
- Limpe cache do navegador (Ctrl+F5)
- Verifique se o agendamento não foi deletado
- Veja logs no terminal do servidor (prefixo `[API]`)
