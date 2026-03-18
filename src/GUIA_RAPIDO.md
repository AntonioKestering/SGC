# 🚀 Guia Rápido de Início

Se você quer colocar a aplicação rodando **em menos de 5 minutos**, siga este guia simplificado.

## Passo 1: Preparação (1 minuto)

### Instale Node.js
- Baixe de: https://nodejs.org/ (versão LTS)
- Instale normalmente
- Verifique: `node --version`

### Crie uma conta Supabase
- Acesse: https://supabase.com
- Crie uma conta gratuita
- Crie um novo projeto

## Passo 2: Clonar e Instalar (2 minutos)

```bash
# Abra o terminal/PowerShell e execute:
git clone https://github.com/AntonioKestering/sgc.git
cd sgc/src
npm install
```

## Passo 3: Configurar Supabase (1 minuto)

### Encontre as chaves:
1. No Supabase, vá para **Project > Settings > API**
2. Copie as 3 informações:
   - `Project URL`
   - `anon public` key
   - `service_role` secret

### Crie o arquivo `.env.local`:

Na pasta `src`, crie um arquivo chamado `.env.local` e cole:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service
```

## Passo 4: Preparar Banco de Dados (1 minuto)

1. No Supabase, vá para **SQL Editor**
2. Clique **New Query**
3. Cole este SQL:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'recepcionista',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" 
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" 
  ON profiles FOR INSERT WITH CHECK (true);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
```

4. Clique **Run**

## Passo 5: Rodar a Aplicação (na pasta `src`)

```bash
npm run dev
```

✅ Pronto! Abra: **http://localhost:3000**

---

## Agora O Que Fazer?

### Para Criar um Usuário:
1. Você é redirecionado para `/login`
2. Clique em "Registre-se"
3. Preencha os dados
4. Confirme seu email
5. Faça login

### Acessar Diferentes Partes:
- **Listar Usuários:** http://localhost:3000/users
- **Novo Usuário:** http://localhost:3000/users/new
- **Dashboard:** http://localhost:3000/dashboard
- **Login:** http://localhost:3000/login

---

## Problemas Comuns?

| Problema | Solução |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY is not defined` | Verifique o `.env.local` |
| `Module not found` | Execute `npm install` novamente |
| Página branca | Limpe cache (Ctrl+Shift+Delete) e reinicie o servidor |
| Timeout Supabase | Verifique internet e URLs do `.env.local` |

---

## Próximos Passos

Leia a documentação completa em `DOCUMENTACAO.md` para:
- Entender a estrutura do projeto
- Aprender como adicionar funcionalidades
- Conhecer todas as features disponíveis
- Dicas de desenvolvimento

---

**Dica:** Se algo não funcionar, verifique os erros no console (F12) e compare com a seção de Troubleshooting em `DOCUMENTACAO.md`.
