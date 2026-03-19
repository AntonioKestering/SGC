// src/lib/supabaseAdmin.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Avoid throwing during module import so Next.js build/prerender that imports
// server modules doesn't fail when CI/build environment hasn't set secrets yet.
// We create the client when env vars are present; otherwise export a proxy
// that will throw only when actually used at runtime.
let _supabaseAdmin: any;

if (supabaseUrl && supabaseServiceRoleKey) {
  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
} else {
  const message = 'As variáveis de ambiente SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL precisam estar configuradas no servidor.';
  _supabaseAdmin = new Proxy({}, {
    get() {
      throw new Error(message);
    },
    apply() {
      throw new Error(message);
    }
  });
}

export const supabaseAdmin = _supabaseAdmin;
