'use client';

import React from 'react';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import RealTimeStatus from '@/components/common/RealTimeStatus';
import { useApp } from '@/contexts/AppContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isCollapsed }) => {
  const { clients, instances } = useApp();

  return (
    <header className="bg-white border-b border-gray-200 shadow-soft">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Toggle and Breadcrumb */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-2"
          >
            <Bars3Icon className="w-5 h-5" />
          </Button>

          {/* Breadcrumb placeholder */}
          <nav className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Visão Geral</span>
          </nav>
        </div>

        {/* Right side - Actions and User */}
        <div className="flex items-center space-x-4">
          {/* Real-time Status */}
          <div className="hidden lg:block">
            <RealTimeStatus />
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Clientes:</span>
              <Badge variant="info" size="sm">{clients.length}</Badge>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Instâncias:</span>
              <Badge 
                variant={instances.filter(i => i.status === 'connected').length > 0 ? 'success' : 'warning'} 
                size="sm"
              >
                {instances.filter(i => i.status === 'connected').length}/{instances.length}
              </Badge>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <BellIcon className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">2</span>
            </span>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">Admin OracleWA</p>
              <p className="text-xs text-gray-500">admin@oraclewa.com</p>
            </div>
            <button className="p-1 rounded-lg hover:bg-gray-50 transition-colors">
              <UserCircleIcon className="w-8 h-8 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;