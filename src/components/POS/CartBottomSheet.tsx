/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CartView } from './CartView';
import { X } from 'lucide-react';

interface CartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartBottomSheet: React.FC<CartBottomSheetProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Content */}
      <div className="w-full max-h-[85vh] h-[85vh] bg-stone-900 border-t border-stone-800 rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle & Close Bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 border-b border-stone-800/80 shrink-0">
          <div className="w-12 h-1.5 bg-stone-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
          <span className="text-xs font-bold text-stone-400">অর্ডার চেকআউট</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart View Inside Bottom Sheet */}
        <div className="flex-1 overflow-hidden p-3">
          <CartView onOrderConfirmed={onClose} />
        </div>
      </div>
    </div>
  );
};
