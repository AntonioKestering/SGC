// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente são carregadas automaticamente pelo Next.js
// O prefixo NEXT_PUBLIC_ permite que sejam acessadas no frontend.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Inicializa o cliente Supabase somente quando as chaves estiverem presentes.
// Isso evita que a importação do módulo lance durante a etapa de build/prerender
// quando o CI não fornece variáveis de ambiente (por exemplo, antes de configurar secrets).
let _supabaseInstance: any | null = null;

export function getSupabaseClient() {
  if (_supabaseInstance) return _supabaseInstance;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('As chaves do Supabase (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY) não foram encontradas. Verifique o arquivo .env.local ou configure os secrets no CI.');
  }
  _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return _supabaseInstance;
}

// Backwards-compatible `supabase` export that lazily initializes the client.
export const supabase: any = new Proxy({}, {
  get(_target, prop: PropertyKey) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
  apply() {
    throw new Error('Use getSupabaseClient() to call the Supabase client directly.');
  }
});

export default getSupabaseClient;