/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Flame, ShieldCheck, User, Delete, Lock, AlertCircle, Info } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, pinLockoutRemaining, adminPin, cashierPin } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role>('cashier');
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isLocked = pinLockoutRemaining > 0;

  const handleDigit = (digit: string) => {
    if (isLocked) return;
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setErrorMessage('');
    }
  };

  const handleDelete = () => {
    if (isLocked) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMessage('PIN নম্বর দিন');
      return;
    }

    const res = login(selectedRole, pin);
    if (!res.success) {
      setErrorMessage(res.message || 'ভুল PIN');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white shadow-xl shadow-orange-600/30 mb-3 animate-in zoom-in duration-300">
            <Flame className="w-9 h-9 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-stone-100 tracking-tight uppercase">
            SNAXXORY
          </h1>
          <p className="text-sm font-semibold text-orange-400">
            Kabab &amp; BBQ • Mirpur, Dhaka
          </p>
          <p className="text-xs text-stone-400 mt-1">পয়েন্ট অব সেল (POS) সিস্টেম</p>
        </div>

        {/* Role Toggle Switch */}
        <div className="bg-stone-900 border border-stone-800 p-1 rounded-2xl grid grid-cols-2 gap-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('cashier');
              setPin('');
              setErrorMessage('');
            }}
            className={`min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
              selectedRole === 'cashier'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ক্যাশিয়ার</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setPin('');
              setErrorMessage('');
            }}
            className={`min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
              selectedRole === 'admin'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>অ্যাডমিন</span>
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
          {/* PIN Display */}
          <div className="flex flex-col items-center justify-center h-16 bg-stone-950 border border-stone-800 rounded-2xl mb-3 px-4">
            <span className="text-[11px] font-medium text-stone-500 mb-1">
              {selectedRole === 'admin' ? 'অ্যাডমিন PIN দিন' : 'ক্যাশিয়ার PIN দিন'}
            </span>
            <div className="flex items-center gap-2.5 h-6">
              {pin.length === 0 ? (
                <span className="text-xs text-stone-600">৪ থেকে ৮ ডিজিট</span>
              ) : (
                Array.from({ length: pin.length }).map((_, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full bg-orange-500 inline-block animate-in zoom-in-75 duration-100"
                  />
                ))
              )}
            </div>
          </div>

          {/* Lockout / Error Banner */}
          {isLocked ? (
            <div className="p-3 mb-3 rounded-xl bg-red-950/80 border border-red-700/80 text-center animate-in shake duration-300">
              <div className="flex items-center justify-center gap-1.5 text-red-300 font-bold text-xs mb-1">
                <Lock className="w-4 h-4" />
                <span>ভুল PIN: ৫ বার ভুলের কারণে লক!</span>
              </div>
              <p className="text-lg font-black text-red-400 font-mono">
                অপেক্ষা করুন: {pinLockoutRemaining}s
              </p>
            </div>
          ) : errorMessage ? (
            <div className="p-2 mb-3 rounded-xl bg-red-900/30 border border-red-800/50 flex items-center justify-center gap-1.5 text-red-400 text-xs font-semibold text-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {/* Big Touch Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                disabled={isLocked}
                onClick={() => handleDigit(num)}
                className="h-14 rounded-2xl bg-stone-800/90 active:bg-orange-600 active:text-white hover:bg-stone-700 text-stone-100 font-bold text-xl border border-stone-700/40 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              disabled={isLocked}
              onClick={handleClear}
              className="h-14 rounded-2xl bg-stone-800/50 hover:bg-stone-800 text-stone-400 text-xs font-bold border border-stone-800 flex items-center justify-center disabled:opacity-30"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleDigit('0')}
              className="h-14 rounded-2xl bg-stone-800/90 active:bg-orange-600 active:text-white hover:bg-stone-700 text-stone-100 font-bold text-xl border border-stone-700/40 flex items-center justify-center transition-all disabled:opacity-30 active:scale-95 shadow-sm"
            >
              0
            </button>

            <button
              type="button"
              disabled={isLocked}
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-stone-800/50 hover:bg-stone-800 text-stone-400 flex items-center justify-center border border-stone-800 disabled:opacity-30 active:scale-95"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={isLocked || pin.length < 4}
            onClick={() => handleSubmit()}
            className="w-full min-h-[52px] rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-35 disabled:pointer-events-none shadow-lg shadow-orange-600/30"
          >
            <span>লগইন করুন</span>
          </button>

          {/* Quick Default PIN indicator for ease of testing */}
          <div className="mt-4 pt-3 border-t border-stone-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-400">
              <Info className="w-3.5 h-3.5 text-orange-400" />
              <span>
                ডিফল্ট PIN: {selectedRole === 'admin' ? `Admin: ${adminPin}` : `Cashier: ${cashierPin}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
