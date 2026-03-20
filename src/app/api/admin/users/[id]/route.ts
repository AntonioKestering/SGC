// src/app/api/admin/users/[id]/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID do usuário é necessário' }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      console.error('Erro deleteUser admin:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro inesperado em DELETE /api/admin/users/[id]:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
