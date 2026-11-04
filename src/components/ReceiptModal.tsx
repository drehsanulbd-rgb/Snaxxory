/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { formatTaka } from '../utils/storage';
import { getPaymentMethodLabel } from '../utils/whatsapp';
import { Printer, Share2, Copy, X, MessageCircle } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { activeReceiptOrder, closeReceiptModal, openWhatsAppModal, showToast } = useApp();

  if (!activeReceiptOrder) return null;

  const order = activeReceiptOrder;

  const handlePrint = () => {
    document.body.classList.remove('printing-kitchen');
    window.print();
  };

  const generateReceiptPlainText = () => {
    const lines = [
      '================================',
      '      SNAXXORY KABAB & BBQ      ',
      '  প্লট ৩৭, রোড ২/১, ব্লক জে,   ',
      '  ইস্টার্ন হাউজিং, রূপনগর,      ',
      '        মিরপুর, ঢাকা            ',
      '   facebook.com/snaxxory        ',
      '================================',
      `টোকেন নং: ${order.token} (${order.type === 'dine-in' ? 'ডাইন-ইন' : 'পার্সেল'})`,
      `টেবিল/নাম: ${order.tableOrName}`,
      `তারিখ: ${order.date} | সময়: ${order.time}`,
      '--------------------------------',
      'আইটেম          পরিমাণ     মোট   ',
      '--------------------------------',
      ...order.items.map(
        i =>
          `${i.name.slice(0, 15).padEnd(16)} x${i.quantity}  ${formatTaka(i.price * i.quantity, false).padStart(7)}`
      ),
      '--------------------------------',
      `সাবটোটাল:          ${formatTaka(order.subtotal)}`,
      order.discount > 0 ? `ছাড়:               -${formatTaka(order.discount)}` : null,
      `সর্বমোট:           ${formatTaka(order.total)}`,
      `পেমেন্ট: ${order.paymentStatus === 'paid' ? 'পরিশোধিত (' + getPaymentMethodLabel(order.paymentMethod) + ')' : 'বাকি (Due)'}`,
      '================================',
      '     Thank you! Visit again     ',
      '================================',
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleShare = async () => {
    const receiptText = generateReceiptPlainText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Snaxxory Bill #${order.token}`,
          text: receiptText,
        });
        showToast('বিল শেয়ার করা হয়েছে।', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(receiptText);
      showToast('রসিদের টেক্সট ক্লিপবোর্ডে কপি হয়েছে!', 'success');
    } catch {
      showToast('কপি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleWhatsApp = () => {
    closeReceiptModal();
    openWhatsAppModal(order);
  };

  return (
    <>
      {/* Visual Preview Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <h3 className="font-bold text-base text-stone-100">রসিদ / বিল (72 mm)</h3>
              <p className="text-xs text-orange-400 font-semibold font-mono">টোকেন #{order.token}</p>
            </div>
            <button
              type="button"
              onClick={closeReceiptModal}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Paper receipt preview container */}
          <div className="overflow-y-auto py-3 my-1">
            <div className="bg-white text-black p-4 rounded-lg font-mono text-[12px] leading-relaxed shadow-inner">
              <div className="text-center font-bold text-base tracking-wider uppercase">
                SNAXXORY
              </div>
              <div className="text-center text-[10px] text-stone-600 mt-0.5">
                Kabab & BBQ
              </div>
              <div className="text-center text-[10px] text-stone-700 leading-tight mt-1">
                প্লট ৩৭, রোড নম্বর ২/১, ব্লক জে,
                <br />
                ইস্টার্ন হাউজিং, রূপনগর, মিরপুর, ঢাকা
              </div>
              <div className="text-center text-[10px] text-stone-800 mt-1 font-sans">
                facebook.com/snaxxory
              </div>

              <div className="border-b border-dashed border-stone-400 my-2" />

              <div className="flex justify-between text-[11px] font-bold">
                <span>টোকেন: {order.token}</span>
                <span>{order.type === 'dine-in' ? 'ডাইন-ইন' : 'পার্সেল'}</span>
              </div>
              <div className="flex justify-between text-[10px] text-stone-600 mt-0.5">
                <span>টেবিল/নাম: {order.tableOrName}</span>
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
                <span>{order.date}</span>
                <span>{order.time}</span>
              </div>

              <div className="border-b border-dashed border-stone-400 my-2" />

              <div className="space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="pr-1">
                      <div className="font-semibold text-black">{item.name}</div>
                      <div className="text-[10px] text-stone-600">
                        {item.quantity} x {formatTaka(item.price)}
                      </div>
                    </div>
                    <div className="font-semibold tabular-nums text-right">
                      {formatTaka(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-stone-400 my-2" />

              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>সাবটোটাল</span>
                  <span className="tabular-nums">{formatTaka(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-stone-700">
                    <span>ছাড়</span>
                    <span className="tabular-nums">-{formatTaka(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-black pt-1 border-t border-stone-300 mt-1">
                  <span>সর্বমোট</span>
                  <span className="tabular-nums text-base">{formatTaka(order.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-800 pt-1 font-sans">
                  <span>পেমেন্ট:</span>
                  <span className="font-bold">
                    {order.paymentStatus === 'paid'
                      ? `পরিশোধিত (${getPaymentMethodLabel(order.paymentMethod)})`
                      : 'বাকি (Due)'}
                  </span>
                </div>
              </div>

              {order.status === 'voided' && (
                <div className="mt-2 text-center text-red-600 font-bold border border-red-500 py-0.5 rounded text-[11px]">
                  [অর্ডার বাতিলকৃত - {order.voidedBy}]
                </div>
              )}

              <div className="border-b border-dashed border-stone-400 my-2" />

              <div className="text-center font-bold text-[11px] text-stone-800">
                Thank you! Visit again
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 text-white font-semibold text-xs hover:bg-orange-500 active:scale-[0.98] transition-transform shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>🖨 প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-600 active:scale-[0.98] transition-transform shadow-md shadow-emerald-950"
            >
              <MessageCircle className="w-4 h-4" />
              <span>💬 WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-stone-800 text-stone-200 border border-stone-700 font-medium text-xs hover:bg-stone-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>📤 কপি</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Pure Printable Receipt for window.print() */}
      <div id="thermal-receipt-container">
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>
          SNAXXORY
        </div>
        <div style={{ textAlign: 'center', fontSize: '10px' }}>Kabab & BBQ</div>
        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '2px' }}>
          প্লট ৩৭, রোড নম্বর ২/১, ব্লক জে,
          <br />
          ইস্টার্ন হাউজিং, রূপনগর, মিরপুর, ঢাকা
        </div>
        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '2px' }}>
          facebook.com/snaxxory
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
          <span>টোকেন: {order.token}</span>
          <span>{order.type === 'dine-in' ? 'ডাইন-ইন' : 'পার্সেল'}</span>
        </div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>টেবিল/নাম: {order.tableOrName}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '2px' }}>
          <span>{order.date}</span>
          <span>{order.time}</span>
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

        <div>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                marginBottom: '4px',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '9px' }}>
                  {item.quantity} x {formatTaka(item.price)}
                </div>
              </div>
              <div style={{ fontWeight: 'bold' }}>{formatTaka(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>সাবটোটাল</span>
            <span>{formatTaka(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ছাড়</span>
              <span>-{formatTaka(order.discount)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '13px',
              marginTop: '4px',
              borderTop: '1px solid #000',
              paddingTop: '2px',
            }}
          >
            <span>সর্বমোট</span>
            <span>{formatTaka(order.total)}</span>
          </div>
        </div>

        {order.status === 'voided' && (
          <div
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              border: '1px solid #000',
              padding: '2px',
              margin: '6px 0',
            }}
          >
            [অর্ডার বাতিলকৃত - {order.voidedBy}]
          </div>
        )}

        <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
          Thank you! Visit again
        </div>
      </div>
    </>
  );
};
