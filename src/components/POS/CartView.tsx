/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentStatus, PaymentMethod, CartItem } from '../../types';
import { formatTaka } from '../../utils/storage';
import { ConfirmDialog } from '../Modals/ConfirmDialog';
import { NumericKeypadModal, KeypadMode } from './NumericKeypadModal';
import {
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Check,
  Calendar,
  Clock,
  CreditCard,
  Phone,
  Calculator,
  Pencil,
} from 'lucide-react';

interface CartViewProps {
  onOrderConfirmed?: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onOrderConfirmed }) => {
  const {
    cart,
    orderType,
    setOrderType,
    orderDate,
    setOrderDate,
    tableOrName,
    setTableOrName,
    discount,
    setDiscount,
    updateCartQuantity,
    updateCartItemPrice,
    clearCart,
    confirmOrder,
  } = useApp();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [deductStock, setDeductStock] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerPhone, setCustomerPhone] = useState('');

  // Keypad Modal State
  const [keypadConfig, setKeypadConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    mode: KeypadMode;
    initialValue: number;
    minValue?: number;
    maxValue?: number;
    originalPrice?: number;
    subtotalForDiscount?: number;
    onConfirm: (val: number) => void;
  }>({
    isOpen: false,
    title: '',
    mode: 'quantity',
    initialValue: 0,
    onConfirm: () => {},
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const isBackdated = orderDate !== todayStr;

  const subtotal = cart.reduce((sum, ci) => {
    const itemPrice = ci.customPrice !== undefined ? ci.customPrice : ci.menuItem.price;
    return sum + itemPrice * ci.quantity;
  }, 0);
  const validDiscount = Math.max(0, Math.min(subtotal, discount));
  const total = subtotal - validDiscount;
  const totalItemsCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const openKeypadForQuantity = (ci: CartItem) => {
    setKeypadConfig({
      isOpen: true,
      title: 'পরিমাণ নির্ধারণ (Quantity)',
      subtitle: ci.menuItem.name,
      mode: 'quantity',
      initialValue: ci.quantity,
      minValue: 0,
      maxValue: 999,
      onConfirm: (newQty: number) => {
        updateCartQuantity(ci.menuItem.id, newQty);
      },
    });
  };

  const openKeypadForPrice = (ci: CartItem) => {
    const currentPrice = ci.customPrice !== undefined ? ci.customPrice : ci.menuItem.price;
    setKeypadConfig({
      isOpen: true,
      title: 'মূল্য নির্ধারণ (Unit Price)',
      subtitle: `${ci.menuItem.name} - কাস্টম মূল্য সেট করুন`,
      mode: 'price',
      initialValue: currentPrice,
      minValue: 0,
      maxValue: 10000,
      originalPrice: ci.menuItem.price,
      onConfirm: (newPrice: number) => {
        updateCartItemPrice(ci.menuItem.id, newPrice);
      },
    });
  };

  const openKeypadForDiscount = () => {
    setKeypadConfig({
      isOpen: true,
      title: 'ছাড় নির্ধারণ (Discount)',
      subtitle: `মোট অর্ডার মূল্য: ${formatTaka(subtotal)}`,
      mode: 'discount',
      initialValue: discount,
      minValue: 0,
      maxValue: subtotal,
      subtotalForDiscount: subtotal,
      onConfirm: (newDiscount: number) => {
        setDiscount(newDiscount);
      },
    });
  };

  const handleConfirmOrder = () => {
    const order = confirmOrder(orderDate, deductStock, paymentStatus, paymentMethod, customerPhone);
    if (order) {
      setShowOrderConfirm(false);
      setCustomerPhone('');
      if (onOrderConfirmed) onOrderConfirmed();
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 dark:bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
      {/* Cart Header */}
      <div className="p-3.5 border-b border-stone-800 bg-stone-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-stone-100">কার্ট (অর্ডার স্লিপ)</h2>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold font-mono">
              {totalItemsCount} আইটেম
            </span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>খালি করুন</span>
            </button>
          )}
        </div>

        {/* Order Type Toggle: Dine-in / Takeaway */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-950 rounded-xl mb-2.5">
          <button
            type="button"
            onClick={() => setOrderType('dine-in')}
            className={`min-h-[40px] flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
              orderType === 'dine-in'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>ডাইন-ইন (Dine-in)</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType('takeaway')}
            className={`min-h-[40px] flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
              orderType === 'takeaway'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>পার্সেল (Takeaway)</span>
          </button>
        </div>

        {/* Table / Customer Name input */}
        <div className="relative mb-2">
          <input
            type="text"
            value={tableOrName}
            onChange={e => setTableOrName(e.target.value)}
            placeholder={
              orderType === 'dine-in' ? 'টেবিল নম্বর (যেমন: T-1, T-2)' : 'গ্রাহকের নাম বা ফোন নম্বর'
            }
            className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Order Date / Missing Order Adjustment */}
        <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="font-semibold text-[11px]">অর্ডারের তারিখ:</span>
              <span className={`font-mono text-xs font-bold ${isBackdated ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isBackdated ? orderDate : 'আজ (Today)'}
              </span>
            </div>
            
            <input
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              className="h-7 px-2 rounded-lg bg-stone-900 border border-stone-800 text-[11px] font-mono text-stone-200 focus:border-orange-500 focus:outline-hidden cursor-pointer"
              title="বাদ পড়া অর্ডারের তারিখ নির্বাচন করুন"
            />
          </div>

          {isBackdated && (
            <div className="pt-1.5 border-t border-stone-800/80 flex flex-col gap-1 text-[11px] text-amber-300/90 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span>📌 বাদ পড়া মিসিং অর্ডার ({orderDate})</span>
                <button
                  type="button"
                  onClick={() => setOrderDate(todayStr)}
                  className="text-[10px] text-stone-400 hover:text-white underline cursor-pointer"
                >
                  আজকের তারিখে রিসেট
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] text-stone-300 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={deductStock}
                  onChange={e => setDeductStock(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>ইনভেন্টরি স্টক থেকে উপাদান কর্তন করুন</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
        {cart.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center text-stone-500">
            <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-stone-600" />
            <p className="text-sm font-medium text-stone-400">কার্ট খালি</p>
            <p className="text-xs text-stone-500 mt-0.5">মেনু থেকে আইটেম ট্যাপ করুন</p>
          </div>
        ) : (
          cart.map(ci => {
            const effectivePrice = ci.customPrice !== undefined ? ci.customPrice : ci.menuItem.price;
            const itemTotal = effectivePrice * ci.quantity;
            const isCustomPrice = ci.customPrice !== undefined && ci.customPrice !== ci.menuItem.price;

            return (
              <div
                key={ci.menuItem.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80 gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-stone-100 truncate">
                    {ci.menuItem.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono mt-0.5">
                    {/* Tappable unit price to open keypad */}
                    <button
                      type="button"
                      onClick={() => openKeypadForPrice(ci)}
                      title="মূল্য পরিবর্তন করতে ট্যাপ করুন"
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                        isCustomPrice
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <span>{formatTaka(effectivePrice)}</span>
                      <Pencil className="w-2.5 h-2.5 opacity-70" />
                    </button>
                    <span>x</span>
                    {/* Tappable quantity to open keypad */}
                    <button
                      type="button"
                      onClick={() => openKeypadForQuantity(ci)}
                      title="পরিমাণ পরিবর্তন করতে ট্যাপ করুন"
                      className="px-1.5 py-0.5 rounded bg-stone-850 hover:bg-stone-800 text-orange-400 font-bold border border-stone-800 hover:border-stone-700"
                    >
                      {ci.quantity}
                    </button>
                    <span>=</span>
                    <span className="text-orange-400 font-bold">{formatTaka(itemTotal)}</span>
                  </div>
                </div>

                {/* + / - Controls with Big Touch Hitbox & Keypad Center */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(ci.menuItem.id, ci.quantity - 1)}
                    className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-orange-600 active:text-white text-stone-200 flex items-center justify-center transition-colors border border-stone-700/60"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openKeypadForQuantity(ci)}
                    title="কিপ্যাড দিয়ে সংখ্যা বসাতে ট্যাপ করুন"
                    className="min-w-8 h-9 px-1.5 rounded-lg bg-stone-850 hover:bg-stone-750 active:scale-95 border border-stone-700/60 flex items-center justify-center font-bold text-xs font-mono text-stone-100 hover:text-orange-400 transition-all cursor-pointer"
                  >
                    {ci.quantity}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(ci.menuItem.id, ci.quantity + 1)}
                    className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 active:bg-orange-600 active:text-white text-stone-200 flex items-center justify-center transition-colors border border-stone-700/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Actions */}
      <div className="p-3.5 border-t border-stone-800 bg-stone-950/80 space-y-2.5">
        {/* Custom Keypad-Driven Discount Input (Replaces standard HTML number input) */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-stone-400 font-medium">
            <Calculator className="w-3.5 h-3.5 text-orange-400" />
            <span>ছাড় / Discount:</span>
          </div>
          <button
            type="button"
            onClick={openKeypadForDiscount}
            className="h-9 px-3 rounded-xl bg-stone-900 hover:bg-stone-850 active:scale-95 border border-stone-750 hover:border-orange-500/60 text-xs font-mono font-bold flex items-center gap-2 text-stone-100 transition-all cursor-pointer shadow-xs"
            title="কিপ্যাড দিয়ে ছাড় নির্ধারণ করতে ক্লিক করুন"
          >
            <span className="text-stone-400 text-[11px]">৳</span>
            <span className={`text-sm ${discount > 0 ? 'text-orange-400 font-black' : 'text-stone-400 font-semibold'}`}>
              {discount}
            </span>
            <span className="text-[10px] text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded font-sans">
              {discount > 0 ? 'পরিবর্তন' : 'যোগ করুন'}
            </span>
          </button>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>মোট (Subtotal):</span>
          <span className="font-mono text-stone-300 font-semibold">{formatTaka(subtotal)}</span>
        </div>

        {/* Discount display if > 0 */}
        {validDiscount > 0 && (
          <div className="flex items-center justify-between text-xs text-red-400">
            <span>ছাড় (Discount):</span>
            <span className="font-mono font-semibold">-{formatTaka(validDiscount)}</span>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-800">
          <span className="font-extrabold text-sm text-stone-100">সর্বমোট (Total):</span>
          <span className="font-black text-xl text-orange-500 font-mono tabular-nums">
            {formatTaka(total)}
          </span>
        </div>

        {/* Payment Timing & Method Selection */}
        <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[11px] text-stone-300">পেমেন্ট:</span>
            <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-lg border border-stone-800">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  paymentStatus === 'paid'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                এখনই পরিশোধ
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('due')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  paymentStatus === 'due'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                খাওয়ার পর / বাকি
              </button>
            </div>
          </div>

          {paymentStatus === 'paid' && (
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              {[
                { id: 'cash', label: '💵 নগদ' },
                { id: 'bkash', label: '🌸 বিকাশ' },
                { id: 'nagad', label: '🟠 নগদ' },
                { id: 'rocket', label: '🟣 রকেট' },
                { id: 'bangla_qr', label: '📱 বাংলা QR' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold border truncate transition-all text-center ${
                    paymentMethod === m.id
                      ? 'bg-orange-600/20 text-orange-400 border-orange-500'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="pt-0.5">
            <input
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="মোবাইল নম্বর (WhatsApp বিলের জন্য - ঐচ্ছিক)"
              className="w-full h-8 px-2.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] text-stone-100 placeholder:text-stone-600 font-mono focus:outline-hidden focus:border-orange-500"
            />
          </div>
        </div>

        {/* Order Confirm CTA Button */}
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => setShowOrderConfirm(true)}
          className="w-full min-h-[50px] rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-35 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-orange-600/25"
        >
          <Check className="w-5 h-5" />
          <span>অর্ডার নিশ্চিত করুন</span>
        </button>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="কার্ট খালি করবেন?"
        message="কার্টের সকল আইটেম মুছে ফেলতে চান?"
        confirmLabel="হ্যাঁ, খালি করুন"
        isDestructive={true}
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showOrderConfirm}
        title={isBackdated ? 'বাদ পড়া অর্ডার নিশ্চিত করবেন?' : 'অর্ডার নিশ্চিত করবেন?'}
        message={`মোট ${totalItemsCount} টি আইটেম, সর্বমোট ${formatTaka(total)}। (${
          paymentStatus === 'paid' ? 'পেমেন্ট: পরিশোধিত' : 'পেমেন্ট: খাওয়ার পর প্রদেয় / বাকি'
        })`}
        confirmLabel="হ্যাঁ, নিশ্চিত করুন"
        cancelLabel="ফিরে যান"
        onConfirm={handleConfirmOrder}
        onCancel={() => setShowOrderConfirm(false)}
      />

      {/* Custom Tactile Numeric Keypad Modal */}
      <NumericKeypadModal
        isOpen={keypadConfig.isOpen}
        onClose={() => setKeypadConfig(prev => ({ ...prev, isOpen: false }))}
        title={keypadConfig.title}
        subtitle={keypadConfig.subtitle}
        mode={keypadConfig.mode}
        initialValue={keypadConfig.initialValue}
        minValue={keypadConfig.minValue}
        maxValue={keypadConfig.maxValue}
        originalPrice={keypadConfig.originalPrice}
        subtotalForDiscount={keypadConfig.subtotalForDiscount}
        onConfirm={keypadConfig.onConfirm}
      />
    </div>
  );
};
