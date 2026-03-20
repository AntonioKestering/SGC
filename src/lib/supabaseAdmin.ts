// src/lib/supabaseAdmin.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Avoid throwing during module import so Next.js build/prerender that imports
// server modules doesn't fail when CI/build environment hasn't set secrets yet.
// We create the client when env vars are present; otherwise export a proxy
// that will throw only when actually used at runtime.
let _supabaseAdminInstance: any | null = null;

export function getSupabaseAdmin() {
  if (_supabaseAdminInstance) return _supabaseAdminInstance;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('As variáveis de ambiente SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL precisam estar configuradas no servidor.');
  }
  _supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey);
  return _supabaseAdminInstance;
}

// Backwards-compatible `supabaseAdmin` export that lazily initializes the client.
export const supabaseAdmin: any = new Proxy({}, {
  get(_target, prop: PropertyKey) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  },
  apply() {
    throw new Error('Use getSupabaseAdmin() to call the Supabase admin client directly.');
  }
});

export default getSupabaseAdmin;
