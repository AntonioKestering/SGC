# 📖 Exemplos de Código

Este documento contém exemplos práticos para desenvolvedores que querem entender ou estender a aplicação.

## 📌 Índice

1. [Autenticação](#autenticação)
2. [Banco de Dados](#banco-de-dados)
3. [Componentes](#componentes)
4. [API](#api)
5. [Utilities](#utilities)

---

## Autenticação

### Fazer Login

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function handleLogin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Erro ao fazer login:', error.message);
    return null;
  }

  console.log('Login bem-sucedido:', data.user.email);
  return data.user;
}
```

### Registrar Novo Usuário

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function handleSignUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Erro ao registrar:', error.message);
    return null;
  }

  return data.user;
}
```

### Fazer Logout

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Erro ao sair:', error.message);
  }
}
```

### Obter Usuário Atual

```typescript
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
```

### Reset de Senha

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    console.error('Erro:', error.message);
  }
}
```

### Atualizar Senha

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Erro ao atualizar senha:', error.message);
  }
}
```

---

## Banco de Dados

### Ler Dados (Cliente)

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Erro:', error);
    return null;
  }

  return data;
}
```

### Ler Dados com Filtro

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function getAdminUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin');

  return data || [];
}
```

### Inserir Dados (Cliente)

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function createProfile(userId: string, fullName: string, phone: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        full_name: fullName,
        phone: phone,
        role: 'recepcionista',
      },
    ]);

  if (error) {
    console.error('Erro ao criar perfil:', error);
  }

  return data;
}
```

### Atualizar Dados (Cliente)

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function updateProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Erro ao atualizar:', error);
  }

  return data;
}
```

### Deletar Dados (Cliente)

```typescript
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

async function deleteProfile(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Erro ao deletar:', error);
  }
}
```

### Listar Usuários (Servidor - Admin)

```typescript
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabaseAdmin = getSupabaseAdmin();

export async function listAllUsers() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('Erro:', error);
    return [];
  }

  return data.users;
}
```

### Deletar Usuário (Servidor - Admin)

```typescript
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabaseAdmin = getSupabaseAdmin();

export async function deleteUser(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Erro ao deletar usuário:', error);
  }
}
```

### Atualizar Senha (Servidor - Admin)

```typescript
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabaseAdmin = getSupabaseAdmin();

export async function updateUserPassword(userId: string, newPassword: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error('Erro ao atualizar senha:', error);
  }
}
```

---

## Componentes

### Usar AuthContext

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export function MyComponent() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <p>Não autenticado</p>;
  }

  return <p>Bem-vindo, {user.email}</p>;
}
```

### Componente com Estado

```typescript
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Contagem: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Incrementar
      </button>
    </div>
  );
}
```

### Componente com Effect

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*');

      setUsers(data || []);
      setLoading(false);
    }

    fetchUsers();
  }, []);

  if (loading) return <p>Carregando...</p>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.full_name}</li>
      ))}
    </ul>
  );
}
```

### Componente com Props TypeScript

```typescript
interface UserProps {
  id: string;
  name: string;
  email: string;
  onDelete?: (id: string) => void;
}

export default function UserCard({ id, name, email, onDelete }: UserProps) {
  return (
    <div className="p-4 border rounded">
      <h3>{name}</h3>
      <p>{email}</p>
      {onDelete && (
        <button onClick={() => onDelete(id)}>Deletar</button>
      )}
    </div>
  );
}
```

---

## API

### GET Endpoint

```typescript
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const users = await fetchUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}
```

### POST Endpoint

```typescript
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await createUser(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
```

### PUT Endpoint com Parâmetros Dinâmicos

```typescript
// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  try {
    const user = await updateUser(id, body);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar' },
      { status: 500 }
    );
  }
}
```

### DELETE Endpoint

```typescript
// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar' },
      { status: 500 }
    );
  }
}
```

### Chamar API do Cliente

```typescript
async function fetchUsers() {
  const res = await fetch('/api/users');
  if (!res.ok) {
    throw new Error('Erro ao buscar usuários');
  }
  const { users } = await res.json();
  return users;
}
```

### Chamar API com POST

```typescript
async function createUser(userData: any) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}
```

---

## Utilities

### Formatar Telefone

```typescript
import { formatPhone } from '@/lib/phoneFormatter';

// Uso
const formatted = formatPhone('11999999999');
console.log(formatted); // (11) 99999-9999

// Com dados incompletos
formatPhone('123'); // '123' (retorna como está)
formatPhone(''); // ''
formatPhone(undefined); // ''
```

### Validar Email

```typescript
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Uso
isValidEmail('user@example.com'); // true
isValidEmail('invalid'); // false
```

### Validar Senha

```typescript
function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

// Uso
isValidPassword('123456'); // true
isValidPassword('123'); // false
```

### Debounce Hook

```typescript
import { useEffect, useState } from 'react';

export function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Uso
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  // Executar busca quando debouncedSearchTerm mudar
}, [debouncedSearchTerm]);
```

### Local Storage Hook

```typescript
import { useEffect, useState } from 'react';

export function useLocalStorage(key: string, initialValue: any) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== 'undefined' && window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: any) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Uso
const [theme, setTheme] = useLocalStorage('theme', 'dark');
```

---

## 🎨 Tailwind CSS - Classes Utilizadas

### Cores (Tema Escuro)
```css
/* Fundo */
bg-zinc-950  /* Muito escuro */
bg-zinc-900  /* Escuro */
bg-zinc-800  /* Menos escuro */

/* Texto */
text-zinc-50    /* Branco */
text-zinc-200   /* Cinza claro */
text-zinc-400   /* Cinza médio */

/* Acentos */
text-pink-500
bg-pink-600
hover:bg-pink-700
```

### Layout Comum
```tsx
<div className="max-w-4xl mx-auto">
  <h1 className="text-3xl font-bold text-zinc-50">Título</h1>
  <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
    {/* Conteúdo */}
  </div>
</div>
```

---

## 📝 Dicas Gerais

### Sempre Usar 'use client' em Componentes Interativos
```typescript
'use client';

import { useState } from 'react';
```

### TypeScript - Tipagem de Props
```typescript
interface ComponentProps {
  id: string;
  name: string;
  email?: string; // Opcional
  onAction: (id: string) => void;
}
```

### Tratamento de Erros
```typescript
try {
  const result = await fetchData();
  // sucesso
} catch (error) {
  console.error('Erro:', error);
  // tratamento
}
```

### Async/Await em Components
```typescript
useEffect(() => {
  async function fetchData() {
    const data = await supabase.from('table').select('*');
    setData(data);
  }
  fetchData();
}, []);
```

---

**Última atualização:** Janeiro 2026
