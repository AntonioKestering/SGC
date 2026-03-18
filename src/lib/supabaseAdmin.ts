// src/lib/supabaseAdmin.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('As variáveis de ambiente SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL precisam estar configuradas no servidor.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
