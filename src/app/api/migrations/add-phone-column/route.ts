// src/app/api/migrations/add-phone-column/route.ts

import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    // 1. SEGURANÇA: Verificar se o usuário logado é SUPER_ADMIN
    const supabase = await createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso restrito a Super Admins' }, { status: 403 });
    }

    console.log('[Migration] Super Admin autenticado. Verificando coluna phone...');

    // 2. AÇÃO: Usar o Admin apenas para a verificação técnica
    const supabaseAdmin = getSupabaseAdmin();

    const { error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .limit(1);

    // Erro 42703 significa "column does not exist" no Postgres
    if (checkError?.code === '42703') {
      return NextResponse.json({
        status: 'column_missing',
        message: 'A coluna "phone" não existe na tabela profiles.',
        manual_sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';",
        instructions: 'Execute o SQL acima no SQL Editor do Supabase.'
      }, { status: 400 });
    }

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'A coluna "phone" já está presente no banco de dados.'
    });

  } catch (err: any) {
    console.error('[Migration] Erro:', err);
    return NextResponse.json({ error: 'Erro interno na migração' }, { status: 500 });
  }
}