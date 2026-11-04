/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatTaka } from '../../utils/storage';
import { getPaymentMethodLabel } from '../../utils/whatsapp';
import { ChefHat, Printer, MessageCircle, DollarSign, Plus, CheckCircle2, X } from 'lucide-react';

export const OrderSuccessModal: React.FC = () => {
  const {
    orderSuccessOrder,
    closeOrderSuccessModal,
    openKitchenModal,
    printCustomerBill,
    openPaymentModal,
    openWhatsAppModal,
  } = useApp();

  if (!orderSuccessOrder) return null;

  const order = orderSuccessOrder;
  const isPaid = order.paymentStatus === 'paid';

  const handleKitchenPrint = () => {
    openKitchenModal(order);
  };

  const handleCustomerPrint = () => {
    printCustomerBill(order);
  };

  const handlePay = () => {
    closeOrderSuccessModal();
    openPaymentModal(order);
  };

  const handleWhatsApp = () => {
    closeOrderSuccessModal();
    openWhatsAppModal(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-100">অর্ডার নিশ্চিত হয়েছে!</h3>
              <p className="text-xs text-stone-400">
                {order.type === 'dine-in' ? 'ডাইন-ইন' : 'পার্সেল'} • {order.tableOrName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeOrderSuccessModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Info Card */}
        <div className="py-3.5 space-y-3">
          <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/90 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-400 block font-medium">টোকেন নম্বর</span>
              <span className="text-2xl font-black text-orange-500 font-mono tracking-wide">
                #{order.token}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-400 block font-medium">সর্বমোট বিল</span>
              <span className="text-xl font-black text-stone-100 font-mono tabular-nums">
                {formatTaka(order.total)}
              </span>
            </div>
          </div>

          {/* Payment Status Notice */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              isPaid
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/50 text-amber-300'
            }`}
          >
            <span>পেমেন্ট স্ট্যাটাস:</span>
            <span>
              {isPaid
                ? `পরিশোধিত (${getPaymentMethodLabel(order.paymentMethod)})`
                : 'বাকি / খাওয়ার পর প্রদেয় (Due)'}
            </span>
          </div>

          {/* Actions List */}
          <div className="space-y-2 pt-1">
            {/* 1. Kitchen KOT Print */}
            <button
              type="button"
              onClick={handleKitchenPrint}
              className="w-full min-h-[46px] rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ChefHat className="w-4 h-4 text-orange-400" />
              <span>🍳 কিচেন KOT প্রিন্ট / দেখুন</span>
            </button>

            {/* 2. Customer Bill Print (if paid) OR Pay now (if unpaid) */}
            {isPaid ? (
              <button
                type="button"
                onClick={handleCustomerPrint}
                className="w-full min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-orange-950"
              >
                <Printer className="w-4 h-4" />
                <span>🖨 কাস্টমার বিল প্রিন্ট (72mm)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                className="w-full min-h-[46px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-orange-950"
              >
                <DollarSign className="w-4 h-4" />
                <span>💵 এখনই টাকা গ্রহণ / পেইড করুন</span>
              </button>
            )}

            {/* 3. Send via WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full min-h-[46px] rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-emerald-950"
            >
              <MessageCircle className="w-4 h-4" />
              <span>💬 হোয়াটসঅ্যাপে বিল পাঠান (Send via WhatsApp)</span>
            </button>
          </div>
        </div>

        {/* Footer: Done / Next Order */}
        <div className="pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={closeOrderSuccessModal}
            className="w-full min-h-[42px] rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন অর্ডার নিন (Done)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
