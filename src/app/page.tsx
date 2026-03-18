'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Após 1.5 segundos, inicia o fade out
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Após 2 segundos, redireciona
    const timer2 = setTimeout(() => {
      router.push('/login');
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [router]);

  return (
    <div className={`flex min-h-screen items-center justify-center bg-zinc-950 transition-opacity duration-500 ${
      fadeOut ? 'opacity-0' : 'opacity-100'
    }`}>
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold text-zinc-100 animate-pulse">
          Bem-vindo ao SGC
        </h1>
        <p className="max-w-md text-lg text-zinc-400">
          Sistema de Gerenciamento Clínico
        </p>
        <div className="mt-6 flex gap-2">
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
