/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import { formatTaka } from '../../utils/storage';
import { PAYMENT_METHODS } from '../../utils/whatsapp';
import { DollarSign, Check, X, Printer, MessageCircle, Phone, ArrowRight } from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const {
    activePaymentOrder,
    closePaymentModal,
    markOrderAsPaid,
    printCustomerBill,
    openWhatsAppModal,
  } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (activePaymentOrder) {
      setSelectedMethod((activePaymentOrder.paymentMethod as PaymentMethod) || 'cash');
      setPhoneNumber(activePaymentOrder.customerPhone || '');
      setIsCompleted(false);
    }
  }, [activePaymentOrder]);

  if (!activePaymentOrder) return null;

  const order = activePaymentOrder;

  const handleConfirmPayment = () => {
    markOrderAsPaid(order.id, selectedMethod, phoneNumber);
    setIsCompleted(true);
  };

  const handlePrint = () => {
    printCustomerBill(order);
    closePaymentModal();
  };

  const handleWhatsApp = () => {
    closePaymentModal();
    openWhatsAppModal({ ...order, paymentStatus: 'paid', paymentMethod: selectedMethod, customerPhone: phoneNumber });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-600/15 text-orange-500 border border-orange-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">
                {isCompleted ? 'পেমেন্ট সম্পন্ন হয়েছে!' : 'টাকা পরিশোধ গ্রহণ'}
              </h3>
              <p className="text-xs text-orange-400 font-bold font-mono">
                টোকেন #{order.token} • {order.tableOrName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePaymentModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isCompleted ? (
          <div className="overflow-y-auto py-3 space-y-4">
            {/* Amount Banner */}
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 block">মোট প্রদেয় বিল</span>
                <span className="text-2xl font-black text-orange-500 font-mono tabular-nums">
                  {formatTaka(order.total)}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                বাকি / অপ্রদেয়
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                পেমেন্টের মাধ্যম নির্বাচন করুন:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`min-h-[46px] p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-orange-600/15 border-orange-500 text-orange-400 ring-1 ring-orange-500 font-bold'
                          : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Phone (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>গ্রাহকের ফোন নম্বর (WhatsApp বিলের জন্য):</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Confirm Payment Button */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              className="w-full min-h-[48px] rounded-xl bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-500 active:scale-[0.98] transition-all shadow-lg shadow-orange-950"
            >
              <Check className="w-4 h-4" />
              <span>টাকা পরিশোধ নিশ্চিত করুন ({formatTaka(order.total)})</span>
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="text-center p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 mb-2">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-stone-100">
                টাকা সফলভাবে গ্রহণ করা হয়েছে!
              </h4>
              <p className="text-xs text-stone-300">
                টোকেন #{order.token} এর বিল পরিশোধ সম্পন্ন। এখন বিল প্রিন্ট বা হোয়াটসঅ্যাপে পাঠাতে পারেন।
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full min-h-[46px] rounded-xl bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-500 active:scale-[0.98] transition-transform shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>🖨 কাস্টমার বিল প্রিন্ট (72mm)</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full min-h-[46px] rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 active:scale-[0.98] transition-transform shadow-md shadow-emerald-950"
              >
                <MessageCircle className="w-4 h-4" />
                <span>💬 হোয়াটসঅ্যাপে বিল পাঠান</span>
              </button>

              <button
                type="button"
                onClick={closePaymentModal}
                className="w-full min-h-[42px] rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs hover:bg-stone-700 transition-colors"
              >
                সম্পন্ন / বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
