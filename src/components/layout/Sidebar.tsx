// src/components/Layout/Sidebar.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Importação de ícones (você precisará instalar uma biblioteca de ícones)
// Sugestão: npm install lucide-react
import { useState } from 'react';
import { Users, Calendar, Syringe, Package, DollarSign, Home, Menu, X, UserCog } from 'lucide-react'; 

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, group: 'Principal' },
  // CADASTROS
  { name: 'Pacientes', href: '/patients', icon: Users, group: 'Cadastros' },
  { name: 'Especialistas', href: '/specialists', icon: UserCog, group: 'Cadastros' },
  { name: 'Usuários', href: '/users', icon: UserCog, group: 'Cadastros' },
  // GESTÃO OPERACIONAL
  { name: 'Agenda', href: '/appointments', icon: Calendar, group: 'Gestão' },
  { name: 'Produtos/Estoque', href: '/products', icon: Package, group: 'Gestão' },
  { name: 'Fornecedores', href: '/suppliers', icon: Syringe, group: 'Cadastros' },
  // FINANCEIRO
  { name: 'Vendas', href: '/sales', icon: DollarSign, group: 'Financeiro' },
  // Você pode adicionar: { name: 'Relatórios', href: '/reports', icon: BarChart, group: 'Financeiro' },
];

// Componente do Link da Sidebar (Define o estilo ativo)
const NavLink = ({ item }: { item: typeof navigation[0] }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  
  const baseClasses = 'flex items-center px-4 py-2 rounded-lg transition-colors';
  
  return (
    <Link 
      href={item.href} 
      className={`${baseClasses} ${
        isActive 
          ? 'bg-pink-600 text-white shadow-lg' 
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-pink-500'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.name}
    </Link>
  );
};

export function Sidebar() {
  // Estado para menu mobile (opcional)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Agrupando os itens para melhor UX
  const groupedNavigation = navigation.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 text-zinc-300">
      
      {/* Título/Logo */}
      <div className="p-6 text-2xl font-semibold text-pink-500 border-b border-zinc-800">
        SGC | Estética
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {Object.entries(groupedNavigation).map(([group, items]) => (
          <div key={group}>
            {/* Título do Grupo para melhor UX */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-4 mb-2">
              {group}
            </h3>
            <div className="space-y-1">
              {items.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}