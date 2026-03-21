// src/app/settings/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const { user, session, loading } = useAuth();
  const [notifyExpiry, setNotifyExpiry] = useState(false);
  const [notifyDays, setNotifyDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) return;

    async function loadSettings() {
      try {
        const token = session.access_token;
        const res = await fetch('/api/user-settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const s = json.settings;
        if (s) {
          setNotifyExpiry(Boolean(s.notify_expiry));
          setNotifyDays(s.notify_days_before ?? 7);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      }
    }

    loadSettings();
  }, [session, loading]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setMessage(null);

    try {
      const token = session.access_token;
      const res = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notify_expiry: notifyExpiry, notify_days_before: notifyDays }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao salvar configurações');
      }
      setMessage('Configurações salvas com sucesso.');
    } catch (err: any) {
      setMessage(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-zinc-50 mb-6">Configurações do Usuário</h2>

        <form onSubmit={handleSave} className="space-y-6 bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800">
          {message && (
            <div className="bg-green-900 p-4 rounded-lg text-green-200 border border-green-700">{message}</div>
          )}

          <div className="flex items-center gap-4">
            <input
              id="notifyExpiry"
              type="checkbox"
              checked={notifyExpiry}
              onChange={(e) => setNotifyExpiry(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="notifyExpiry" className="text-zinc-200">
              Aviso de vencimento de produtos
            </label>
          </div>

          <div>
            <label htmlFor="notifyDays" className="block text-sm font-medium text-zinc-200 mb-1">
              Dias antes do vencimento
            </label>
            <input
              id="notifyDays"
              type="number"
              min={0}
              value={notifyDays}
              onChange={(e) => setNotifyDays(Number(e.target.value))}
              className="w-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-4 rounded-lg text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
