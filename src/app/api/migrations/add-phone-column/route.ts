// src/app/api/migrations/add-phone-column/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('[Migration] Iniciando migração: adicionar coluna phone');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Variáveis de ambiente não configuradas',
        manual_sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT \'\';'
      }, { status: 500 });
    }

    // Cria cliente com permissões de admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Tenta executar a migração via RPC se existir, caso contrário via SQL direto
    // Nota: Supabase não permite SQL direto via cliente JS, precisa ser via RPC ou pg_net
    // Então vamos usar a abordagem de tentar uma operação que falharia se a coluna não existisse

    // Primeiro, tentamos selecionar a coluna phone
    const { data: checkData, error: checkError } = await supabase
      .from('profiles')
      .select('phone')
      .limit(1);

    if (checkError?.code === '42703') {
      // Coluna não existe, precisamos criá-la
      // Como Supabase não permite ALTER TABLE via cliente JS, retornamos instruções
      console.log('[Migration] Coluna phone não existe. Instruções para criá-la retornadas.');
      return NextResponse.json({
        status: 'column_missing',
        message: 'Coluna phone não existe na tabela profiles',
        manual_sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT \'\';',
        instructions: 'Execute o SQL acima no Supabase SQL Editor (Database > SQL Editor)'
      }, { status: 400 });
    }

    if (checkError && checkError.code !== '42703') {
      console.error('[Migration] Erro ao verificar coluna:', checkError);
      return NextResponse.json({
        error: checkError.message,
        manual_sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT \'\';'
      }, { status: 500 });
    }

    // Se chegou aqui, a coluna existe
    console.log('[Migration] Coluna phone já existe na tabela profiles');
    return NextResponse.json({
      status: 'success',
      message: 'Coluna phone já existe na tabela profiles'
    });
  } catch (err: any) {
    console.error('[Migration] Erro inesperado:', err);
    return NextResponse.json({
      error: err.message || 'Erro ao executar migração',
      manual_sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT \'\';'
    }, { status: 500 });
  }
}
