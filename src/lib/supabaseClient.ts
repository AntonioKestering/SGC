// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são carregadas automaticamente pelo Next.js
// O prefixo NEXT_PUBLIC_ permite que sejam acessadas no frontend.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Inicializa o cliente Supabase somente quando as chaves estiverem presentes.
// Isso evita que a importação do módulo lance durante a etapa de build/prerender
// quando o CI não fornece variáveis de ambiente (por exemplo, antes de configurar secrets).
let _supabase: any;
if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  const message = 'As chaves do Supabase (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY) não foram encontradas. Verifique o arquivo .env.local ou configure os secrets no CI.';
  _supabase = new Proxy({}, {
    get() {
      throw new Error(message);
    },
    apply() {
      throw new Error(message);
    }
  });
}

export const supabase = _supabase;