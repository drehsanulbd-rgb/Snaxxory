/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, ChefHat, CheckSquare } from 'lucide-react';

export const KitchenTicketModal: React.FC = () => {
  const { activeKitchenOrder, closeKitchenModal, printKitchenTicket } = useApp();

  if (!activeKitchenOrder) return null;

  const order = activeKitchenOrder;

  return (
    <>
      {/* Visual Modal on Screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/20">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-100">কিচেন অর্ডার টিকিট (KOT)</h3>
                <p className="text-xs text-orange-400 font-bold font-mono">টোকেন #{order.token}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeKitchenModal}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Kitchen Slip Preview (Paper look) */}
          <div className="overflow-y-auto py-3 my-1">
            <div className="bg-amber-50 text-stone-950 p-4 rounded-xl font-mono text-xs leading-relaxed shadow-inner border border-amber-200">
              <div className="text-center font-black text-sm uppercase tracking-wider text-stone-900 border-b-2 border-dashed border-stone-400 pb-2 mb-2">
                🍳 KITCHEN TICKET (কিচেন কপি)
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-2xl font-black text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-lg border border-orange-300">
                  #{order.token}
                </span>
                <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-stone-800 text-white">
                  {order.type === 'dine-in' ? 'ডাইন-ইন' : 'পার্সেল'}
                </span>
              </div>

              <div className="text-xs font-bold text-stone-800 mt-2">
                টেবিল / নাম: <span className="text-orange-700 font-black">{order.tableOrName}</span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-600 mt-0.5 border-b border-dashed border-stone-300 pb-2">
                <span>তারিখ: {order.date}</span>
                <span>সময়: {order.time}</span>
              </div>

              {/* Items for chef with big checkboxes */}
              <div className="py-2.5 space-y-2">
                <div className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                  প্রস্তুত করার আইটেম তালিকা:
                </div>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2 rounded-lg bg-white border border-stone-200 shadow-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-stone-400 font-mono text-sm">[  ]</span>
                      <span className="font-bold text-sm text-stone-900 leading-tight">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-black text-base text-orange-600 font-mono px-2 py-0.5 bg-orange-50 rounded border border-orange-200 shrink-0">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-stone-400 pt-2 text-center text-[10px] text-stone-600 font-sans">
                Snaxxory Kabab & BBQ - Mirpur, Dhaka
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={() => printKitchenTicket(order)}
              className="min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-500 active:scale-[0.98] transition-transform shadow-md"
            >
              <Printer className="w-4 h-4" />
              🖨 কিচেন প্রিন্ট
            </button>
            <button
              type="button"
              onClick={closeKitchenModal}
              className="min-h-[46px] flex items-center justify-center rounded-xl bg-stone-800 text-stone-300 border border-stone-700 font-semibold text-sm hover:bg-stone-700 transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Pure Kitchen Printable Ticket for window.print() */}
      <div id="kitchen-receipt-container">
        <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '16px', letterSpacing: '1px' }}>
          *** KITCHEN ORDER TICKET ***
        </div>
        <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '2px' }}>
          SNAXXORY - কিচেন টোকেন
        </div>
        <div style={{ borderBottom: '2px dashed #000', margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '26px', fontWeight: '900' }}>#{order.token}</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            [{order.type === 'dine-in' ? 'ডাইন-ইন' : 'পার্সেল'}]
          </span>
        </div>

        <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>
          টেবিল/নাম: {order.tableOrName}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
          <span>{order.date}</span>
          <span>{order.time}</span>
        </div>

        <div style={{ borderBottom: '2px dashed #000', margin: '6px 0' }} />

        <div style={{ fontSize: '14px' }}>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: '1px dotted #888',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>[ ] {item.name}</div>
              <div style={{ fontWeight: '900', fontSize: '16px' }}>x{item.quantity}</div>
            </div>
          ))}
        </div>

        <div style={{ borderBottom: '2px dashed #000', margin: '6px 0' }} />
        <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
          রান্না শেষে সার্ভ করুন
        </div>
      </div>
    </>
  );
};
