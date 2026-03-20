// src/app/api/admin/users/[id]/password/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'ID do usuário é necessário' },
      { status: 400 }
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Senha é necessária' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    console.log(`[API] Atualizando senha do usuário ${id}`);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: password,
    });

    if (error) {
      console.error('[API] Erro ao atualizar senha:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

    console.log('[API] Senha atualizada com sucesso');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro inesperado:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
