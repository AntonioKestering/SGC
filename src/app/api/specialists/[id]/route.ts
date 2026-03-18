// src/app/api/specialists/[id]/route.ts

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[API] GET /api/specialists/[id]', id);

    // Busca o especialista incluindo o campo profile_id
    const { data: specialist, error: specError } = await supabaseAdmin
      .from('specialists')
      .select('id, profile_id, specialty, registry_number, color_code')
      .eq('id', id)
      .single();

    if (specError || !specialist) {
      console.error('[API] Error:', specError);
      return NextResponse.json({ error: 'Especialista não encontrado' }, { status: 404 });
    }

    // Busca o profile vinculado (por profile_id)
    let profile = null;
    if (specialist.profile_id) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', specialist.profile_id)
        .maybeSingle();

      if (profileError) {
        console.error('[API] Profile Error:', profileError);
      }
      profile = profiles || null;
    }

    const result = {
      ...specialist,
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      profiles: profile ? [profile] : []
    };

    return NextResponse.json({ specialist: result });
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao buscar especialista' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { specialty, registry_number, color_code } = body;

    console.log('[API] PUT /api/specialists/[id]', id);

    if (!specialty) {
      return NextResponse.json(
        { error: 'Especialidade é obrigatória' },
        { status: 400 }
      );
    }

    const { data: specialist, error: updateError } = await supabaseAdmin
      .from('specialists')
      .update({ specialty, registry_number, color_code })
      .eq('id', id)
      .select('id, profile_id, specialty, registry_number, color_code')
      .single();

    if (updateError) {
      console.error('[API] Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Busca o profile vinculado
    let profile = null;
    if (specialist.profile_id) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', specialist.profile_id)
        .maybeSingle();

      if (profileError) {
        console.error('[API] Profile Error:', profileError);
      }
      profile = profiles || null;
    }

    const result = {
      ...specialist,
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      profiles: profile ? [profile] : []
    };

    return NextResponse.json({ specialist: result });
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar especialista' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[API] DELETE /api/specialists/[id]', id);

    const { error } = await supabaseAdmin
      .from('specialists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Especialista deletado com sucesso' });
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao deletar especialista' },
      { status: 500 }
    );
  }
}
