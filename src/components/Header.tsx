/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Flame, LogOut, Moon, Sun, ShieldAlert, TestTube, Cloud, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenTestModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTestModal }) => {
  const {
    currentRole,
    logout,
    theme,
    toggleTheme,
    showDefaultPinWarning,
    dismissPinWarning,
    setActiveTab,
    isGoogleDriveConnected,
    isSyncingDrive,
    syncToGoogleDrive,
    lastDriveSyncTime,
  } = useApp();

  return (
    <>
      <header className="sticky top-0 z-30 bg-stone-900/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-800 px-3.5 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Zone */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-stone-100 uppercase">
                SNAXXORY
              </span>
              <span className="text-[10px] block font-semibold text-orange-400 -mt-1 tracking-wider">
                KABAB &amp; BBQ
              </span>
            </div>
          </div>

          {/* Action Zone: Role badge, Theme, Tests, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Role indicator */}
            {currentRole && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 border border-stone-700/60 hidden sm:inline-block">
                {currentRole === 'admin' ? 'অ্যাডমিন (Admin)' : 'ক্যাশিয়ার (Cashier)'}
              </span>
            )}

            {/* Acceptance tests button */}
            <button
              type="button"
              onClick={onOpenTestModal}
              title="স্বয়ংক্রিয় টেস্ট চালান"
              className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <TestTube className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">টেস্ট</span>
            </button>

            {/* Google Drive Live Cloud Sync Indicator */}
            {isGoogleDriveConnected ? (
              <button
                type="button"
                onClick={() => syncToGoogleDrive(false)}
                disabled={isSyncingDrive}
                title={`গুগল ড্রাইভ সিঙ্ক (সর্বশেষ: ${lastDriveSyncTime || 'এখনও হয়নি'}) - ক্লিক করে এখনই সিঙ্ক করুন`}
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSyncingDrive ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 fill-emerald-400/20" />
                )}
                <span className="hidden md:inline">ড্রাইভ সিঙ্ক</span>
              </button>
            ) : (
              currentRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  title="গুগল ড্রাইভের সাথে লাইভ সিঙ্ক চালু করুন"
                  className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden lg:inline">ড্রাইভ কানেক্ট</span>
                </button>
              )
            )}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'লাইট থিমে পরিবর্তন করুন' : 'ডার্ক থিমে পরিবর্তন করুন'}
              className="min-h-[40px] min-w-[40px] rounded-lg border border-stone-800 bg-stone-800/80 hover:bg-stone-700 text-stone-300 flex items-center justify-center active:scale-95 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Logout button: Visible on phones and desktop */}
            {currentRole && (
              <button
                type="button"
                onClick={logout}
                title="লগআউট"
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Warning Banner: After admin login with default PINs show a warning to change them */}
      {showDefaultPinWarning && currentRole === 'admin' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-3.5 py-2.5 text-amber-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>সতর্কতা:</strong> আপনি ডিফল্ট PIN (1234 / 1111) দিয়ে লগইন করেছেন। সুরক্ষার জন্য সেটিংস থেকে নতুন PIN নির্ধারণ করুন।
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                dismissPinWarning();
              }}
              className="underline font-bold text-amber-300 hover:text-white"
            >
              সেটিংস
            </button>
            <button
              type="button"
              onClick={dismissPinWarning}
              className="text-stone-400 hover:text-stone-200 px-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
