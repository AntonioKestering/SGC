// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são carregadas automaticamente pelo Next.js
// O prefixo NEXT_PUBLIC_ permite que sejam acessadas no frontend.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificação de segurança: Lança um erro se as chaves estiverem faltando
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As chaves do Supabase (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY) não foram encontradas. Verifique o arquivo .env.local.');
}

// Inicializa o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);