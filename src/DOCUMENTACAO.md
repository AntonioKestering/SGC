# SGC - Sistema de Gestão de Cadastros

Uma aplicação web moderna para gerenciar usuários, especialistas e agendamentos, construída com Next.js, Supabase e Tailwind CSS.

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação](#instalação)
4. [Configuração Inicial](#configuração-inicial)
5. [Executar a Aplicação](#executar-a-aplicação)
6. [Funcionalidades](#funcionalidades)
7. [Estrutura do Projeto](#estrutura-do-projeto)
8. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## 📱 Visão Geral

O SGC é um sistema web completo para gerenciamento de usuários com autenticação segura, controle de acesso baseado em papéis (RBAC) e interface moderna com tema escuro.

**Tecnologias principais:**
- **Framework:** Next.js 16 com Turbopack
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Estilo:** Tailwind CSS
- **Componentes:** React com Hooks
- **Ícones:** Lucide React

---

## 🔧 Pré-requisitos

Antes de começar, você precisará ter instalado:

- **Node.js** 18.17 ou superior ([Download](https://nodejs.org/))
- **npm** 9 ou superior (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))
- Conta no **Supabase** ([https://supabase.com](https://supabase.com)) - gratuita

### Verificar Instalação

```bash
node --version
npm --version
git --version
```

---

## 📥 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/AntonioKestering/sgc.git
cd sgc
```

### 2. Instalar Dependências

```bash
cd src
npm install
```

---

## ⚙️ Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em "New project"
3. Preencha:
   - **Name:** sgc (ou o nome desejado)
   - **Database Password:** Crie uma senha forte
   - **Region:** Selecione a região mais próxima
4. Clique em "Create new project" e aguarde a criação

### 2. Configurar Arquivo .env.local

Na pasta `src`, crie um arquivo chamado `.env.local` com as seguintes variáveis:

```bash
# URLs do Supabase (encontre em Project > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica

# Service Role Key (encontre em Project > Settings > API)
# ⚠️ NUNCA compartilhe esta chave publicamente!
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

**Como encontrar as chaves:**

1. No Supabase, vá para **Project > Settings > API**
2. Copie `Project URL` para `NEXT_PUBLIC_SUPABASE_URL`
3. Copie `anon public` para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copie `service_role secret` para `SUPABASE_SERVICE_ROLE_KEY`

### 3. Criar Tabelas e Estrutura do Banco

1. No Supabase, vá para **SQL Editor**
2. Clique em "New Query"
3. Cole o seguinte SQL:

```sql
-- Criar tabela profiles para armazenar dados adicionais dos usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'recepcionista',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura dos próprios dados
CREATE POLICY "Users can read their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Política para permitir atualização dos próprios dados
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para inserção (admin)
CREATE POLICY "Enable insert for authenticated users" 
  ON profiles FOR INSERT 
  WITH CHECK (true);

-- Adicionar coluna phone se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
```

4. Clique em "Run"

### 4. Habilitar Autenticação por Email

1. No Supabase, vá para **Authentication > Providers**
2. Verifique se **Email** está habilitado (deve estar por padrão)
3. Configure o email de confirmação:
   - Vá para **Email Templates**
   - Customize a mensagem de confirmação se desejar

---

## 🚀 Executar a Aplicação

### Modo Desenvolvimento

Na pasta `src`, execute:

```bash
npm run dev
```

A aplicação estará disponível em: **http://localhost:3000**

### Parar o Servidor

Pressione `Ctrl + C` no terminal

### Modo Produção

```bash
npm run build
npm run start
```

---

## 🎯 Funcionalidades

### Autenticação
- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Recuperação de senha ("Esqueci minha senha")
- ✅ Confirmação por email
- ✅ Reenvio de email de confirmação

### Gerenciamento de Usuários
- ✅ Listar todos os usuários
- ✅ Criar novo usuário com:
  - Email e senha
  - Nome completo
  - Telefone formatado (00) 00000-0000
  - Papel/Role (Administrador, Especialista, Recepcionista)
- ✅ Editar dados do usuário
- ✅ Alterar senha do usuário
- ✅ Excluir usuário
- ✅ Visualizar informações do usuário

### Interface
- ✅ Tema escuro com Tailwind CSS
- ✅ Layout responsivo
- ✅ Mensagens de erro e sucesso
- ✅ Carregamento com indicadores
- ✅ Formatação automática de telefone

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── users/              # Rotas da API para gerenciar usuários
│   │   └── migrations/             # Migrations do banco de dados
│   ├── auth/
│   │   └── reset-password/         # Página de reset de senha
│   ├── login/
│   │   └── page.tsx                # Página de login
│   ├── dashboard/
│   │   └── page.tsx                # Dashboard principal
│   ├── users/
│   │   ├── page.tsx                # Listagem de usuários
│   │   ├── new/
│   │   │   └── page.tsx            # Criar novo usuário
│   │   └── [id]/edit/
│   │       └── page.tsx            # Editar usuário
│   ├── specialists/                # Gerencimento de especialistas
│   ├── setup/
│   │   └── page.tsx                # Página de configuração inicial
│   ├── layout.tsx                  # Layout raiz
│   ├── page.tsx                    # Splash page
│   └── globals.css                 # Estilos globais
├── components/
│   ├── UserRegisterForm.tsx        # Formulário de registro
│   ├── PasswordResetModal.tsx      # Modal de reset de senha
│   └── layout/
│       ├── DashboardLayout.tsx     # Layout do dashboard
│       └── Sidebar.tsx             # Sidebar de navegação
├── context/
│   └── AuthContext.tsx             # Context de autenticação
├── lib/
│   ├── supabaseClient.ts           # Cliente Supabase (lado cliente)
│   ├── supabaseAdmin.ts            # Cliente Supabase (lado servidor)
│   └── phoneFormatter.ts           # Formatação de telefone
├── migrations/                     # Scripts SQL de migration
└── public/                         # Arquivos estáticos
```

---

## 🔐 Variáveis de Ambiente

### Obrigatórias

```bash
# URL do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública para cliente
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx

# Chave de serviço (CONFIDENCIAL - use apenas no servidor)
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxx
```

### Notas de Segurança

- ⚠️ **NUNCA** compartilhe `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **NUNCA** faça commit do arquivo `.env.local` no Git
- ✅ Use `.env.local` para desenvolvimento local
- ✅ Configure as variáveis no host de produção (Vercel, Netlify, etc.)

---

## 🔍 Primeiro Uso da Aplicação

### 1. Acessar a Aplicação

Abra no navegador: **http://localhost:3000**

Você será automaticamente redirecionado para: **http://localhost:3000/login**

### 2. Criar Primeiro Usuário

1. Na página de login, clique em **"Registre-se"** ou acesse `/users/new`
2. Preencha os campos:
   - **Email:** seu-email@example.com
   - **Senha:** Mínimo 6 caracteres
   - **Nome Completo:** Seu Nome
   - **Telefone:** Digite apenas números, será formatado automaticamente como (00) 00000-0000
   - **Papel:** Selecione "Administrador"
3. Clique em **"Cadastrar Usuário"**

### 3. Confirmar Email

1. Verifique seu email
2. Clique no link de confirmação
3. Você será redirecionado para confirmar sua senha

### 4. Fazer Login

1. Retorne para http://localhost:3000/login
2. Digite seu email e senha
3. Clique em **"Entrar"**

### 5. Acessar o Dashboard

Após login bem-sucedido, você terá acesso a:
- **Dashboard:** Página inicial
- **Usuários:** Gerenciar todos os usuários
- **Especialistas:** Gerenciar especialistas
- **Perfil:** Suas informações

---

## 🐛 Troubleshooting

### Erro: "Could not find a declaration file for module '@supabase/supabase-js'"

**Solução:**
```bash
npm install --save-dev @types/node @types/react
```

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"

**Solução:** Verifique se o arquivo `.env.local` existe e contém todas as variáveis necessárias. Reinicie o servidor com `npm run dev`.

### Erro: "Connect timeout to Supabase"

**Solução:** Verifique sua conexão de internet e se as URLs do Supabase estão corretas em `.env.local`.

### Erro: "User not allowed" ao acessar API de usuários

**Solução:** Apenas o servidor pode acessar a API com `SERVICE_ROLE_KEY`. Certifique-se de estar fazendo requisições do lado do servidor.

### Página em branco após login

**Solução:** 
1. Abra o Console (F12)
2. Verifique se há erros
3. Limpe o cache do navegador (Ctrl + Shift + Delete)
4. Reinicie o servidor

### Coluna "phone" não existe

**Solução:** Execute o SQL fornecido na seção "Configuração Inicial > 3. Criar Tabelas e Estrutura do Banco" ou acesse **http://localhost:3000/setup** para mais instruções.

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tutoriais Úteis
- [Autenticação com Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Banco de Dados PostgreSQL](https://supabase.com/docs/guides/database)
- [Segurança com RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## 💡 Dicas de Desenvolvimento

### Adicionar Nova Página

1. Crie um arquivo em `app/nova-pagina/page.tsx`
2. Importe `DashboardLayout` para manter o tema consistente
3. Exporte como default function

```tsx
'use client';

import { DashboardLayout } from '@/components/Layout/DashboardLayout';

export default function NovaPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-zinc-50">Minha Nova Página</h1>
    </DashboardLayout>
  );
}
```

### Adicionar Nova Rota API

1. Crie um arquivo em `app/api/meu-endpoint/route.ts`
2. Exporte funções para os métodos HTTP (GET, POST, PUT, DELETE)

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: Request) {
  const data = await request.json();
  return NextResponse.json({ received: data });
}
```

### Usar Supabase no Cliente

```typescript
import { supabase } from '@/lib/supabaseClient';

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

### Usar Supabase no Servidor

```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const { data, error } = await supabaseAdmin.auth.admin.listUsers();
```

### Formatar Telefone

```typescript
import { formatPhone } from '@/lib/phoneFormatter';

const telefone = formatPhone('11999999999'); // Retorna: (11) 99999-9999
```

---

## 📋 Checklist de Configuração

- [ ] Node.js 18.17+ instalado
- [ ] Conta Supabase criada
- [ ] Projeto Supabase criado
- [ ] Arquivo `.env.local` configurado com as 3 variáveis
- [ ] SQL executado no Supabase SQL Editor
- [ ] Dependências instaladas com `npm install`
- [ ] Servidor iniciado com `npm run dev`
- [ ] Aplicação acessível em http://localhost:3000

---

## 📄 Licença

Este projeto é fornecido como está para fins educacionais e comerciais.

---

## 👨‍💻 Suporte

Para problemas, sugestões ou contribuições, abra uma issue no repositório do GitHub.

---

**Última atualização:** Janeiro 2026
**Versão:** 1.0.0
