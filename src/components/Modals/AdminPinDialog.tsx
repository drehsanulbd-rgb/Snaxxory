/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Delete, X } from 'lucide-react';

interface AdminPinDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminPinDialog: React.FC<AdminPinDialogProps> = ({
  isOpen,
  title = 'অ্যাডমিন অনুমোদন প্রয়োজন',
  description = 'অর্ডার বাতিল করতে অ্যাডমিন PIN প্রবেশ করান',
  onSuccess,
  onCancel,
}) => {
  const { verifyAdminPin, pinLockoutRemaining } = useApp();
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pinLockoutRemaining > 0) return;
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setErrorMessage('');
    }
  };

  const handleDelete = () => {
    if (pinLockoutRemaining > 0) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const handleVerify = () => {
    if (!pin) {
      setErrorMessage('PIN দিন');
      return;
    }

    const res = verifyAdminPin(pin);
    if (res.success) {
      setPin('');
      setErrorMessage('');
      onSuccess();
    } else {
      setErrorMessage(res.message || 'ভুল PIN');
      setPin('');
    }
  };

  const isLocked = pinLockoutRemaining > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xs rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-stone-100">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-400 mb-4">{description}</p>

        {/* PIN Display */}
        <div className="flex justify-center items-center h-12 bg-stone-950 border border-stone-800 rounded-xl mb-3 px-3">
          <div className="flex items-center gap-2">
            {pin.length === 0 ? (
              <span className="text-xs text-stone-500">PIN টাইপ করুন (৪-৮ ডিজিট)</span>
            ) : (
              Array.from({ length: pin.length }).map((_, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full bg-orange-500 inline-block animate-in zoom-in-50 duration-100"
                />
              ))
            )}
          </div>
        </div>

        {/* Error / Lock Message */}
        {isLocked ? (
          <div className="p-2 mb-3 rounded-lg bg-red-950/60 border border-red-800/80 text-center">
            <p className="text-xs font-semibold text-red-300">
              ৫ বার ভুল চেষ্টার কারণে লক করা হয়েছে!
            </p>
            <p className="text-sm font-bold text-red-400 font-mono mt-0.5">
              অপেক্ষা করুন: {pinLockoutRemaining} সেকেন্ড
            </p>
          </div>
        ) : errorMessage ? (
          <p className="text-xs font-medium text-red-400 text-center mb-3">
            {errorMessage}
          </p>
        ) : null}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={isLocked}
              onClick={() => handleDigit(num)}
              className="h-12 rounded-xl bg-stone-800/90 active:bg-orange-600 active:text-white hover:bg-stone-700/80 text-stone-100 font-semibold text-lg border border-stone-700/50 flex items-center justify-center transition-colors disabled:opacity-40"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={isLocked}
            onClick={handleClear}
            className="h-12 rounded-xl bg-stone-800/50 hover:bg-stone-800 text-stone-400 text-xs font-semibold border border-stone-800 flex items-center justify-center disabled:opacity-40"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={isLocked}
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-stone-800/90 active:bg-orange-600 active:text-white hover:bg-stone-700/80 text-stone-100 font-semibold text-lg border border-stone-700/50 flex items-center justify-center transition-colors disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            disabled={isLocked}
            onClick={handleDelete}
            className="h-12 rounded-xl bg-stone-800/50 hover:bg-stone-800 text-stone-400 flex items-center justify-center border border-stone-800 disabled:opacity-40"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-stone-700 bg-stone-800/70 text-stone-300 text-sm font-medium hover:bg-stone-700"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={isLocked || pin.length < 4}
            onClick={handleVerify}
            className="h-11 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-500 disabled:opacity-40 shadow-sm"
          >
            যাচাই করুন
          </button>
        </div>
      </div>
    </div>
  );
};
