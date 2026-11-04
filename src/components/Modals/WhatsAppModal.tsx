/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatTaka } from '../../utils/storage';
import { sendWhatsAppBill, formatWhatsAppMessage } from '../../utils/whatsapp';
import { MessageCircle, Copy, Send, X, Phone, Check } from 'lucide-react';

export const WhatsAppModal: React.FC = () => {
  const { activeWhatsAppOrder, closeWhatsAppModal, showToast } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeWhatsAppOrder) {
      setPhoneNumber(activeWhatsAppOrder.customerPhone || '');
      setCopied(false);
    }
  }, [activeWhatsAppOrder]);

  if (!activeWhatsAppOrder) return null;

  const order = activeWhatsAppOrder;
  const messagePreview = formatWhatsAppMessage(order);

  const handleSend = () => {
    const success = sendWhatsAppBill(order, phoneNumber);
    if (success) {
      showToast('হোয়াটসঅ্যাপে বিল পাঠানোর জন্য রিডাইরেক্ট করা হচ্ছে...', 'success');
      closeWhatsAppModal();
    } else {
      showToast('হোয়াটসঅ্যাপ লিঙ্ক খুলতে সমস্যা হয়েছে। অনুগ্রহ করে মেসেজটি কপি করুন।', 'warning');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messagePreview);
      setCopied(true);
      showToast('বিলের মেসেজ কপি করা হয়েছে!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('কপি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">হোয়াটসঅ্যাপে বিল পাঠান</h3>
              <p className="text-xs text-orange-400 font-bold font-mono">টোকেন #{order.token} • {formatTaka(order.total)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeWhatsAppModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-3 space-y-3">
          {/* Phone Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>গ্রাহকের মোবাইল নম্বর (ঐচ্ছিক):</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="017XXXXXXXX বা খালি রাখুন"
              className="w-full h-11 px-3.5 rounded-xl bg-stone-950 border border-stone-800 text-sm font-mono text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              * খালি রাখলে সরাসরি হোয়াটসঅ্যাপ ওপেন হবে এবং যেকোনো চ্যাটে পাঠানো যাবে।
            </p>
          </div>

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-stone-400">মেসেজ প্রিভিউ:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed scrollbar-thin">
              {messagePreview}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-800">
          <button
            type="button"
            onClick={handleSend}
            className="min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 active:scale-[0.98] transition-transform shadow-md shadow-emerald-950"
          >
            <Send className="w-4 h-4" />
            <span>পাঠান (WhatsApp)</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[46px] flex items-center justify-center gap-1.5 rounded-xl bg-stone-800 text-stone-200 border border-stone-700 font-semibold text-sm hover:bg-stone-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'কপি হয়েছে' : 'মেসেজ কপি'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
