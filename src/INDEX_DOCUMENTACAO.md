# 📚 Sumário da Documentação

Bem-vindo ao SGC! Esta pasta contém toda a documentação necessária para entender e trabalhar com a aplicação.

## 📖 Arquivos de Documentação

### 1. **GUIA_RAPIDO.md** ⚡
   - **Para quem:** Quer colocar a aplicação rodando rápido
   - **Conteúdo:** Passos simplificados para setup em 5 minutos
   - **Comece aqui se:** Nunca usou a aplicação antes

### 2. **DOCUMENTACAO.md** 📋
   - **Para quem:** Quer entender tudo sobre a aplicação
   - **Conteúdo:** 
     - Instalação completa
     - Configuração de Supabase
     - Estrutura do projeto
     - Todas as funcionalidades
     - FAQ e troubleshooting
   - **Comece aqui se:** Quer conhecimento profundo

### 3. **EXEMPLOS_CODIGO.md** 💻
   - **Para quem:** Desenvolvedores que querem estender a aplicação
   - **Conteúdo:**
     - Exemplos de autenticação
     - Exemplos de banco de dados
     - Exemplos de componentes
     - Exemplos de API
     - Utilitários e hooks
   - **Comece aqui se:** Precisa adicionar funcionalidades

### 4. **GUIA_AGENDAMENTOS.md** 📅
   - **Para quem:** Quer aprender sobre o sistema de agendamentos
   - **Conteúdo:**
     - Visão geral de agendamentos
     - Arquivos criados
     - Schema do banco de dados
     - Como usar a interface
     - Cores de status
     - Validações
     - Padrões de código
   - **Comece aqui se:** Precisa trabalhar com agendamentos

---

## 🗺️ Mapa de Navegação da Documentação

```
DOCUMENTAÇÃO
│
├─ GUIA_RAPIDO.md
│  ├─ Passo 1: Preparação
│  ├─ Passo 2: Clonar e Instalar
│  ├─ Passo 3: Configurar Supabase
│  ├─ Passo 4: Banco de Dados
│  ├─ Passo 5: Rodar Aplicação
│  └─ Problemas Comuns
│
├─ DOCUMENTACAO.md
│  ├─ Visão Geral
│  ├─ Pré-requisitos
│  ├─ Instalação Detalhada
│  ├─ Configuração Inicial (Supabase)
│  ├─ Executar a Aplicação
│  ├─ Funcionalidades
│  ├─ Estrutura do Projeto
│  ├─ Variáveis de Ambiente
│  ├─ Primeiro Uso
│  ├─ Troubleshooting Completo
│  ├─ Recursos Adicionais
│  └─ Dicas de Desenvolvimento
│
└─ EXEMPLOS_CODIGO.md
   ├─ Autenticação
   ├─ Banco de Dados
   ├─ Componentes
   ├─ API
   ├─ Utilities
   └─ Dicas Gerais
```

---

## 🎯 Escolha Seu Caminho

### 👤 Sou novo aqui
1. Leia **GUIA_RAPIDO.md** (5 minutos)
2. Execute os passos de setup
3. Acesse http://localhost:3000
4. Crie um usuário teste
5. Explore a interface

### 👨‍💼 Sou gerente/stakeholder
1. Leia a seção "Visão Geral" em **DOCUMENTACAO.md**
2. Confira a seção "Funcionalidades"
3. Veja a "Estrutura do Projeto"
4. Pronto! Você entende o que foi feito.

### 👨‍💻 Sou desenvolvedor
1. Faça o setup com **GUIA_RAPIDO.md**
2. Leia **DOCUMENTACAO.md** completamente
3. Consulte **EXEMPLOS_CODIGO.md** conforme precisar
4. Explore os arquivos do projeto em `src/app/`
5. Comece a desenvolver!

### 🔧 Tenho um erro/problema
1. Vá para a seção "Troubleshooting" em **DOCUMENTACAO.md**
2. Se não achar, verifique **GUIA_RAPIDO.md** > "Problemas Comuns"
3. Leia os logs da aplicação (Console F12)
4. Se ainda não resolver, check **EXEMPLOS_CODIGO.md** para entender o fluxo

---

## 📋 Checklist Rápido

### Setup Inicial
- [ ] Node.js 18.17+ instalado
- [ ] Conta Supabase criada
- [ ] Projeto Supabase criado
- [ ] `.env.local` configurado
- [ ] SQL executado no Supabase
- [ ] `npm install` executado
- [ ] `npm run dev` funcionando

### Primeiro Usuário
- [ ] Acessar http://localhost:3000
- [ ] Registrar novo usuário
- [ ] Confirmar email
- [ ] Fazer login
- [ ] Ver dashboard

### Desenvolvimento
- [ ] Entender a estrutura do projeto
- [ ] Conhecer os exemplos de código
- [ ] Fazer primeira alteração
- [ ] Testar as mudanças
- [ ] Commitar no Git

---

## 🚀 Estrutura de Pasta

```
sgc/
├── README.md                          (Este arquivo)
├── src/
│   ├── GUIA_RAPIDO.md                 (Leia primeiro!)
│   ├── DOCUMENTACAO.md                (Documentação completa)
│   ├── EXEMPLOS_CODIGO.md             (Exemplos para devs)
│   ├── DOCUMENTACAO.md                (Este arquivo)
│   ├── app/                           (Aplicação Next.js)
│   ├── components/                    (Componentes React)
│   ├── context/                       (Context de autenticação)
│   ├── lib/                           (Utilities)
│   ├── migrations/                    (Scripts SQL)
│   ├── .env.local                     (Variáveis locais)
│   ├── package.json                   (Dependências)
│   └── tsconfig.json                  (Config TypeScript)
└── ...
```

---

## 🎓 Conceitos Importantes

### Supabase
- **Auth:** Gerencia login/registro de usuários
- **Database:** PostgreSQL para armazenar dados
- **RLS:** Row Level Security para segurança
- **Service Role:** Chave de admin para operações no servidor

### Next.js
- **App Router:** Sistema de roteamento moderno
- **API Routes:** Criar endpoints em `app/api/`
- **Client/Server:** `'use client'` para interatividade
- **Async Params:** Parâmetros dinâmicos são Promises

### Autenticação
- **Client:** Recomendado usar `getSupabaseClient()` do `lib/supabaseClient.ts` (inicialização tardia).
- **Server:** Recomendado usar `getSupabaseAdmin()` do `lib/supabaseAdmin.ts` (service role).
- **Nota:** Para compatibilidade retroativa os proxies `supabase` e `supabaseAdmin` ainda estão disponíveis, mas preferimos os getters para tornar a inicialização explícita.
- **Session:** Gerenciado automaticamente pelo Supabase

---

## 🔗 Links Úteis

| Recurso | Link |
|---------|------|
| Supabase | https://supabase.com |
| Next.js | https://nextjs.org |
| Tailwind CSS | https://tailwindcss.com |
| TypeScript | https://www.typescriptlang.org |
| Git | https://git-scm.com |

---

## ❓ Perguntas Frequentes Rápidas

**P: Onde configuro as chaves do Supabase?**  
R: No arquivo `.env.local` na pasta `src/`

**P: Como faço login?**  
R: Vá para http://localhost:3000/login e use email/senha cadastrados

**P: Posso alterar o tema?**  
R: Sim, modifique as cores em `app/globals.css` e `components/layout/DashboardLayout.tsx`

**P: Como adiciono uma nova página?**  
R: Crie um arquivo em `app/nova-pagina/page.tsx` (veja **EXEMPLOS_CODIGO.md**)

**P: Todos os usuários precisam confirmar email?**  
R: Sim, você pode desabilitar em Supabase > Authentication > Email Auth

---

## 📚 Arquivos Adicionais

### Na Raiz do Projeto
- **ALTERACOES_AGENDAMENTOS.md** - Resumo completo das mudanças (Sistema de Agendamentos)
- **CHECKLIST_AGENDAMENTOS.md** - Checklist de implementação e teste

### Na Pasta src/
- **GUIA_AGENDAMENTOS.md** - Guia detalhado do sistema de agendamentos

---

## 📝 Versionamento

- **Versão Atual:** 1.1.0 (com Sistema de Agendamentos)
- **Última Atualização:** Janeiro 2026
- **Node.js:** 18.17+
- **Next.js:** 16.0.3
- **Supabase SDK:** Última versão

---

## 🤝 Contribuindo

Ao fazer mudanças:
1. Teste completamente
2. Atualize a documentação
3. Faça commits descritivos
4. Crie uma pull request

---

## 📞 Suporte

- 📧 Abra uma issue no GitHub
- 💬 Consulte a seção "Troubleshooting" em **DOCUMENTACAO.md**
- 🔍 Verifique **EXEMPLOS_CODIGO.md** para saber como algo é feito

---

**Pronto para começar? Abra o GUIA_RAPIDO.md! 🚀**
