// src/components/UserRegisterForm.tsx

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatPhone } from '@/lib/phoneFormatter';

const roles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'recepcionista', label: 'Recepcionista' },
];

export default function UserRegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('recepcionista');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 1. Cria usuário no Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Erro ao criar usuário.');
      setLoading(false);
      return;
    }
    const userId = data.user.id;


    // 2. Só cria perfil se não existir
    const { data: existingProfile, error: fetchProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: userId,
          email,
          full_name: fullName,
          phone,
          role,
        },
      ]);
      if (profileError) {
        setError('Usuário criado, mas erro ao salvar perfil: ' + profileError.message);
        setLoading(false);
        return;
      }
    }

    setSuccess('Usuário cadastrado com sucesso!');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRole('recepcionista');
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-800 space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-50 mb-4">Cadastro de Usuário</h2>
      {error && <div className="bg-red-900 p-3 rounded text-red-200">{error}</div>}
      {success && <div className="bg-green-900 p-3 rounded text-green-200">{success}</div>}
      <div>
        <label className="block text-sm font-medium text-zinc-200 mb-1">Nome Completo</label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-200 mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-200 mb-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-200 mb-1">Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={e => {
            const rawPhone = e.target.value.replace(/\D/g, '');
            setPhone(rawPhone);
          }}
          placeholder="(11) 99999-9999"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
        />
        {phone && (
          <p className="text-zinc-400 text-sm mt-2">Formatado: {formatPhone(phone)}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-200 mb-1">Papel</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
        >
          {roles.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-zinc-900 disabled:opacity-50 transition duration-150"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
      </button>
    </form>
  );
}
