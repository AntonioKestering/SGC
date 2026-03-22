// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _supabaseInstance: any | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // No servidor, sempre criamos uma nova instância se necessário, 
    // mas o ideal é usar o supabaseServer.ts para rotas e middleware.
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  if (_supabaseInstance) return _supabaseInstance;

  // O createBrowserClient cuida automaticamente de salvar a sessão nos COOKIES
  // permitindo que o Middleware e as APIs (Route Handlers) vejam quem você é.
  _supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  
  return _supabaseInstance;
}

// Exportação padrão para manter compatibilidade com seus componentes atuais
export const supabase = getSupabaseClient();

export default getSupabaseClient;