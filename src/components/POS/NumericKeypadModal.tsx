/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Delete, Check, RotateCcw, Percent, Sparkles, Plus } from 'lucide-react';
import { formatTaka } from '../../utils/storage';

export type KeypadMode = 'quantity' | 'price' | 'discount';

interface NumericKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue: number;
  title: string;
  subtitle?: string;
  mode: KeypadMode;
  minValue?: number;
  maxValue?: number;
  originalPrice?: number;
  subtotalForDiscount?: number;
}

export const NumericKeypadModal: React.FC<NumericKeypadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialValue,
  title,
  subtitle,
  mode,
  minValue = 0,
  maxValue = 999999,
  originalPrice,
  subtotalForDiscount = 0,
}) => {
  // Store the raw string representation for responsive editing
  const [valStr, setValStr] = useState<string>(() => initialValue > 0 ? String(initialValue) : '0');

  useEffect(() => {
    if (isOpen) {
      setValStr(initialValue > 0 ? String(initialValue) : '0');
    }
  }, [isOpen, initialValue]);

  const numVal = parseInt(valStr, 10) || 0;

  // Haptic feedback trigger for mobile touch
  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  }, []);

  const handleDigit = useCallback((digit: string) => {
    triggerHaptic();
    setValStr(prev => {
      if (prev === '0') {
        return digit;
      }
      const next = prev + digit;
      if (parseInt(next, 10) > maxValue) return prev;
      return next;
    });
  }, [maxValue, triggerHaptic]);

  const handleBackspace = useCallback(() => {
    triggerHaptic();
    setValStr(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, [triggerHaptic]);

  const handleClear = useCallback(() => {
    triggerHaptic();
    setValStr('0');
  }, [triggerHaptic]);

  const handleDirectSet = useCallback((val: number) => {
    triggerHaptic();
    const clamped = Math.max(minValue, Math.min(maxValue, val));
    setValStr(String(clamped));
  }, [minValue, maxValue, triggerHaptic]);

  const handleIncrement = useCallback((delta: number) => {
    triggerHaptic();
    setValStr(prev => {
      const current = parseInt(prev, 10) || 0;
      const next = Math.max(minValue, Math.min(maxValue, current + delta));
      return String(next);
    });
  }, [minValue, maxValue, triggerHaptic]);

  const handlePercentDiscount = useCallback((pct: number) => {
    triggerHaptic();
    if (subtotalForDiscount > 0) {
      const calculated = Math.round((subtotalForDiscount * pct) / 100);
      const clamped = Math.max(0, Math.min(subtotalForDiscount, calculated));
      setValStr(String(clamped));
    }
  }, [subtotalForDiscount, triggerHaptic]);

  const handleConfirm = useCallback(() => {
    triggerHaptic();
    const finalVal = Math.max(minValue, Math.min(maxValue, numVal));
    onConfirm(finalVal);
    onClose();
  }, [minValue, maxValue, numVal, onConfirm, onClose, triggerHaptic]);

  // Physical keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleBackspace, handleConfirm, handleClear, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150 select-none">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-stone-800/80 bg-stone-950/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Digit Display */}
        <div className="px-5 py-4 bg-stone-950 border-b border-stone-800/60 flex flex-col items-center justify-center">
          <div className="flex items-baseline justify-center gap-1.5 w-full">
            {(mode === 'price' || mode === 'discount') && (
              <span className="text-2xl font-bold text-stone-400">৳</span>
            )}
            <span className="text-4xl sm:text-5xl font-black font-mono text-orange-400 tracking-wider tabular-nums">
              {numVal.toLocaleString('en-US')}
            </span>
            {mode === 'quantity' && (
              <span className="text-sm font-semibold text-stone-400">টি (pcs)</span>
            )}
          </div>

          {/* Quick Context helper below display */}
          <div className="mt-1 text-xs text-stone-400 flex items-center gap-2 font-mono">
            {mode === 'quantity' && numVal === 0 && (
              <span className="text-red-400 font-semibold">⚠️ ০ দিলে কার্ট থেকে বাদ পড়বে</span>
            )}
            {mode === 'discount' && subtotalForDiscount > 0 && (
              <span>
                নেট প্রদেয়: <strong className="text-stone-200">{formatTaka(Math.max(0, subtotalForDiscount - numVal))}</strong>
              </span>
            )}
            {mode === 'price' && originalPrice !== undefined && originalPrice !== numVal && (
              <span className="text-amber-400">
                মেনু মূল্য: {formatTaka(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Quick Presets / Shortcuts */}
        <div className="px-3 pt-2.5 pb-1.5 bg-stone-900/90 border-b border-stone-800/60 overflow-x-auto scrollbar-none">
          {mode === 'quantity' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase text-stone-400 shrink-0">দ্রুত:</span>
              {[1, 2, 3, 4, 5, 8, 10, 15, 20].map(qty => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => handleDirectSet(qty)}
                  className={`min-h-[34px] px-2.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors ${
                    numVal === qty
                      ? 'bg-orange-600 text-white'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-750 active:bg-orange-600 active:text-white'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
          )}

          {mode === 'discount' && (
            <div className="space-y-1.5">
              {subtotalForDiscount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-400 shrink-0">শতাংশ:</span>
                  {[5, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentDiscount(pct)}
                      className="min-h-[32px] px-2.5 rounded-lg bg-stone-800 hover:bg-stone-750 active:bg-orange-600 text-stone-200 text-xs font-mono font-bold shrink-0 transition-colors flex items-center gap-1"
                    >
                      <Percent className="w-3 h-3 text-orange-400" />
                      {pct}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleDirectSet(subtotalForDiscount)}
                    className="min-h-[32px] px-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/50 text-[11px] font-bold shrink-0"
                  >
                    ১০০% ফ্রি
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-stone-400 shrink-0">টাকা:</span>
                {[10, 20, 50, 100, 200].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleDirectSet(amt)}
                    className={`min-h-[32px] px-2.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-colors ${
                      numVal === amt
                        ? 'bg-orange-600 text-white'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-750 active:bg-orange-600 active:text-white'
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'price' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-400 shrink-0">যোগ:</span>
              {[+10, +20, +50, +100].map(delta => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleIncrement(delta)}
                  className="min-h-[34px] px-2.5 rounded-lg bg-stone-800 hover:bg-stone-750 active:bg-orange-600 text-stone-200 text-xs font-mono font-bold shrink-0 transition-colors"
                >
                  +{delta}
                </button>
              ))}
              {originalPrice !== undefined && (
                <button
                  key="reset"
                  type="button"
                  onClick={() => handleDirectSet(originalPrice)}
                  className="min-h-[34px] px-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  মেনু মূল্য
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4x4 Tactile Keypad Matrix */}
        <div className="p-3 bg-stone-900 grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            type="button"
            onClick={() => handleDigit('1')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit('2')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit('3')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            3
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            title="মুছুন (Backspace)"
            className="h-14 rounded-2xl bg-amber-950/50 hover:bg-amber-900/60 active:scale-[0.96] text-amber-400 font-bold text-sm shadow-xs transition-transform flex items-center justify-center border border-amber-800/40"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleDigit('4')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit('5')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit('6')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            6
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="সম্পূর্ণ মুছুন (Clear)"
            className="h-14 rounded-2xl bg-red-950/50 hover:bg-red-900/60 active:scale-[0.96] text-red-400 font-black text-lg font-mono shadow-xs transition-transform flex items-center justify-center border border-red-800/40"
          >
            C
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleDigit('7')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit('8')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit('9')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(1)}
            title="+1 বৃদ্ধি"
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-orange-400 font-bold text-sm font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            +1
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-100 font-bold text-2xl font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => {
              if (numVal > 0) {
                handleDigit('0');
                handleDigit('0');
              }
            }}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-750 active:scale-[0.96] text-stone-300 font-bold text-lg font-mono shadow-xs transition-transform flex items-center justify-center border border-stone-700/40"
          >
            00
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="col-span-2 h-14 rounded-2xl bg-orange-600 hover:bg-orange-500 active:scale-[0.96] text-white font-extrabold text-base shadow-lg shadow-orange-600/30 transition-transform flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>ঠিক আছে (Done)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
