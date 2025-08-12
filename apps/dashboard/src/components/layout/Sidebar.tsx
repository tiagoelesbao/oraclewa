'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  UsersIcon,
  DevicePhoneMobileIcon,
  SpeakerWaveIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Visão geral do sistema',
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: UsersIcon,
    description: 'Gestão de clientes',
  },
  {
    name: 'Instâncias',
    href: '/instances',
    icon: DevicePhoneMobileIcon,
    description: 'WhatsApp instances',
  },
  {
    name: 'Broadcast',
    href: '/broadcast',
    icon: SpeakerWaveIcon,
    description: 'Disparos em massa',
  },
  {
    name: 'Webhooks',
    href: '/webhooks',
    icon: CursorArrowRaysIcon,
    description: 'Monitor de eventos',
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: DocumentTextIcon,
    description: 'Mensagens template',
  },
  {
    name: 'Chip Maturation',
    href: '/chip-maturation',
    icon: CpuChipIcon,
    description: 'Maturação de chips',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    description: 'Relatórios e métricas',
  },
  {
    name: 'Logs',
    href: '/logs',
    icon: DocumentMagnifyingGlassIcon,
    description: 'Sistema de logs',
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'Configurações gerais',
  },
];

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-oracle-500 to-oracle-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">OracleWA</h1>
              <p className="text-xs text-gray-500">SaaS Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-oracle-50 text-oracle-700 border-r-2 border-oracle-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={isCollapsed ? item.name : ''}
            >
              <Icon
                className={cn(
                  'flex-shrink-0 w-5 h-5',
                  isActive ? 'text-oracle-600' : 'text-gray-500 group-hover:text-gray-700',
                  !isCollapsed && 'mr-3'
                )}
              />
              
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{item.name}</span>
                  <span className="text-xs text-gray-500 truncate">
                    {item.description}
                  </span>
                </div>
              )}

              {isActive && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-oracle-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            <div>
              <p className="text-xs font-medium text-gray-900">Sistema Online</p>
              <p className="text-xs text-gray-500">v3.0.0-frontend</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;