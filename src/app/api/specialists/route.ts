// src/app/api/specialists/route.ts

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    console.log('[API] GET /api/specialists');

    // Busca especialistas incluindo o campo profile_id (vínculo com profiles)
    const { data: specialists, error: specError } = await supabaseAdmin
      .from('specialists')
      .select('id, profile_id, specialty, registry_number, color_code');

    console.log('[API] Specialists query result:', { specialists, specError });

    if (specError) {
      console.error('[API] Error:', specError);
      return NextResponse.json({ error: specError.message }, { status: 400 });
    }

    if (!specialists || specialists.length === 0) {
      return NextResponse.json({ specialists: [] });
    }

    // Coleta todos profile_ids e busca em lote
    const profileIds = specialists.map((s: any) => s.profile_id).filter(Boolean);
    let profiles: any[] = [];
    if (profileIds.length > 0) {
      const { data: profilesData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', profileIds);

      if (profileError) {
        console.error('[API] Profile Error:', profileError);
      }
      profiles = profilesData || [];
    }

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const result = (specialists || []).map((spec: any) => {
      const profile = profileMap.get(spec.profile_id);
      return {
        id: spec.id,
        profile_id: spec.profile_id || null,
        specialty: spec.specialty,
        registry_number: spec.registry_number,
        color_code: spec.color_code,
        full_name: profile?.full_name || '',
        email: profile?.email || '',
        profiles: profile ? [profile] : []
      };
    });

    return NextResponse.json({ specialists: result });
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao buscar especialistas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/specialists');

    const body = await request.json();
    const { specialty } = body;

    if (!specialty) {
      return NextResponse.json(
        { error: 'Especialidade é obrigatória' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('specialists')
      .insert([{ specialty }])
      .select(`
        id,
        specialty,
        profiles(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('[API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ specialist: data }, { status: 201 });
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json(
      { error: 'Erro ao criar especialista' },
      { status: 500 }
    );
  }
}
