/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  ClipboardList,
  BarChart3,
  Boxes,
  Calculator,
  Settings,
  LogOut,
  Flame,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { currentRole, activeTab, setActiveTab, logout } = useApp();

  if (!currentRole) return null;

  const isAdmin = currentRole === 'admin';

  // Available tabs depending on role
  const navItems = [
    { id: 'pos' as const, label: 'POS বিক্রি', icon: Store, mobileLabel: 'POS' },
    { id: 'orders' as const, label: 'অর্ডারসমূহ', icon: ClipboardList, mobileLabel: 'অর্ডার' },
    ...(isAdmin
      ? [
          { id: 'reports' as const, label: 'রিপোর্ট', icon: BarChart3, mobileLabel: 'রিপোর্ট' },
          { id: 'stock' as const, label: 'স্টক', icon: Boxes, mobileLabel: 'স্টক' },
          { id: 'costing' as const, label: 'কস্টিং', icon: Calculator, mobileLabel: 'কস্টিং' },
          { id: 'settings' as const, label: 'সেটিংস', icon: Settings, mobileLabel: 'সেটিংস' },
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-stone-900 border-r border-stone-800 p-4 shrink-0 justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-extrabold text-sm text-stone-100 tracking-wide uppercase">
                {currentRole === 'admin' ? 'অ্যাডমিন প্যানেল' : 'ক্যাশিয়ার কাউন্টার'}
              </span>
            </div>
            <p className="text-xs text-stone-400">মিরপুর শাখা, ঢাকা</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-stone-800">
          <button
            type="button"
            onClick={logout}
            className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-400" />
            <span>লগআউট</span>
          </button>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-800 shadow-lg pb-safe">
        <div
          className={`grid items-center h-16 ${
            isAdmin ? 'grid-cols-6' : 'grid-cols-2'
          }`}
        >
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] px-1 transition-colors relative ${
                  isActive ? 'text-orange-500 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-orange-500 scale-110' : 'text-stone-400'} transition-transform`} />
                <span className="text-[10px] tracking-tight truncate max-w-[56px]">
                  {item.mobileLabel}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
