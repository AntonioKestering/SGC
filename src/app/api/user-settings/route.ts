// src/app/api/user-settings/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function getUserFromAuthHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return { error: 'Unauthorized' };

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function GET(request: Request) {
  try {
    const u = await getUserFromAuthHeader(request);
    if ((u as any).error) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = (u as any).user;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: settings, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is supabase-js single() not found message; still treat as empty
      console.error('[API] Erro ao buscar configurações:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: settings || null });
  } catch (err: any) {
    console.error('[API] Erro em GET /api/user-settings:', err);
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const u = await getUserFromAuthHeader(request);
    if ((u as any).error) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = (u as any).user;

    const body = await request.json();
    const { notify_expiry, notify_days_before } = body;

    const supabaseAdmin = getSupabaseAdmin();

    const payload = {
      user_id: user.id,
      notify_expiry: Boolean(notify_expiry),
      notify_days_before: Number(notify_days_before) || 0,
    };

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select();

    if (error) {
      console.error('[API] Erro ao salvar configurações:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data?.[0] });
  } catch (err: any) {
    console.error('[API] Erro em PUT /api/user-settings:', err);
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 });
  }
}
