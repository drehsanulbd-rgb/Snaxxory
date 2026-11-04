/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { formatTaka } from '../../utils/storage';
import { AdminPinDialog } from '../Modals/AdminPinDialog';
import { ConfirmDialog } from '../Modals/ConfirmDialog';
import { getPaymentMethodLabel } from '../../utils/whatsapp';
import {
  Printer,
  Share2,
  Ban,
  Clock,
  CheckCircle2,
  ChefHat,
  Search,
  Calendar,
  Utensils,
  ShoppingBag,
  Plus,
  CalendarDays,
  Edit2,
  X,
  DollarSign,
  MessageCircle,
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const {
    currentRole,
    orders,
    cycleOrderStatus,
    voidOrder,
    updateOrderDate,
    setOrderDate,
    setActiveTab,
    openReceiptModal,
    openKitchenModal,
    openPaymentModal,
    openWhatsAppModal,
    showToast,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [dateFilter, setDateFilter] = useState<'today' | 'custom' | 'all'>('today');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'due'>('all');
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Order date adjustment modal state
  const [orderToEditDate, setOrderToEditDate] = useState<Order | null>(null);
  const [newDateInput, setNewDateInput] = useState<string>(todayStr);

  // Voiding state
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [adminTapConfirmOrderId, setAdminTapConfirmOrderId] = useState<string | null>(null);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [showAdminConfirmModal, setShowAdminConfirmModal] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesDate =
        dateFilter === 'today'
          ? order.date === todayStr
          : dateFilter === 'custom'
          ? order.date === customDate
          : true;
      const matchesSearch =
        order.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tableOrName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const matchesPayment =
        paymentFilter === 'all'
          ? true
          : paymentFilter === 'paid'
          ? order.paymentStatus === 'paid'
          : order.paymentStatus !== 'paid';
      return matchesDate && matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, dateFilter, todayStr, customDate, searchQuery, selectedStatus, paymentFilter]);

  // Handle Void request
  const handleInitiateVoid = (order: Order) => {
    if (order.status === 'voided') return;
    setOrderToVoid(order);

    if (currentRole === 'admin') {
      // Admin taps twice to confirm
      if (adminTapConfirmOrderId === order.id) {
        // Second tap -> perform void
        voidOrder(order.id, 'admin');
        setAdminTapConfirmOrderId(null);
        setOrderToVoid(null);
      } else {
        // First tap -> prompt confirmation state
        setAdminTapConfirmOrderId(order.id);
        setShowAdminConfirmModal(true);
      }
    } else {
      // Cashier -> must ask for Admin PIN
      setShowAdminPinModal(true);
    }
  };

  const handleAdminPinSuccess = () => {
    if (orderToVoid) {
      voidOrder(orderToVoid.id, 'cashier + admin PIN');
      setShowAdminPinModal(false);
      setOrderToVoid(null);
    }
  };

  const handleQuickShare = async (order: Order) => {
    const text = `SNAXXORY বিল #${order.token} | মোট: ${formatTaka(order.total)} | আইটেম: ${order.items
      .map(i => `${i.name} x${i.quantity}`)
      .join(', ')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Snaxxory Bill #${order.token}`,
          text,
        });
        showToast('বিল শেয়ার করা হয়েছে।', 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('বিলের বিবরণ ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    } catch {
      showToast('কপি করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'cooking':
        return {
          label: 'রান্না হচ্ছে',
          icon: <ChefHat className="w-3.5 h-3.5 animate-pulse text-amber-400" />,
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'ready':
        return {
          label: 'তৈরি (Ready)',
          icon: <Clock className="w-3.5 h-3.5 text-sky-400" />,
          classes: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        };
      case 'served':
        return {
          label: 'পরিবেশিত (Served)',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'voided':
        return {
          label: 'বাতিল (Voided)',
          icon: <Ban className="w-3.5 h-3.5 text-red-400" />,
          classes: 'bg-red-500/15 text-red-400 border-red-500/30 line-through',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 p-3 sm:p-4 pb-20 md:pb-4">
      {/* Top Filter Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 mb-3 space-y-2.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Date Filter Segment */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-stone-950 rounded-xl">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateFilter === 'today'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                আজ ({orders.filter(o => o.date === todayStr).length})
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('custom')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  dateFilter === 'custom'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>তারিখ অনুযায়ী</span>
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dateFilter === 'all'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                সকল ({orders.length})
              </button>
            </div>

            {/* Custom Date Input when 'custom' is active */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800 text-xs animate-in fade-in">
                <span className="text-stone-400 text-[11px]">তারিখ:</span>
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="bg-transparent text-stone-100 font-mono text-xs focus:outline-hidden cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Right Side: Search Box + Missing Order Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="টোকেন বা টেবিল খুঁজুন..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setOrderDate(dateFilter === 'custom' ? customDate : todayStr);
                setActiveTab('pos');
                showToast(
                  `POS কার্ট খোলা হয়েছে (${dateFilter === 'custom' ? customDate : 'আজকের'} তারিখের বাদ পড়া অর্ডার)`,
                  'info'
                );
              }}
              title="পূর্বের বা বাদ পড়া তারিখের মিসিং অর্ডার দিন"
              className="min-h-[36px] px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ বাদ পড়া অর্ডার</span>
            </button>
          </div>
        </div>

        {/* Filter Row: Payment Filter & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-stone-800/80">
          {/* Payment status filter */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
            <span className="text-[11px] text-stone-500 font-semibold mr-1">পেমেন্ট:</span>
            {[
              { id: 'all', label: 'সব' },
              { id: 'paid', label: 'পরিশোধিত' },
              { id: 'due', label: 'বাকি (Due)' },
            ].map(pf => (
              <button
                key={pf.id}
                type="button"
                onClick={() => setPaymentFilter(pf.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  paymentFilter === pf.id
                    ? pf.id === 'due'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : pf.id === 'paid'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-700 text-white'
                    : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] text-stone-500 font-semibold mr-1">অর্ডার স্ট্যাটাস:</span>
            {[
              { id: 'all', label: 'সব' },
              { id: 'cooking', label: 'রান্না হচ্ছে' },
              { id: 'ready', label: 'তৈরি' },
              { id: 'served', label: 'পরিবেশিত' },
              { id: 'voided', label: 'বাতিল' },
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                  selectedStatus === st.id
                    ? 'bg-stone-800 text-orange-400 border border-orange-500/40'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 border border-dashed border-stone-800 rounded-2xl">
            <Calendar className="w-10 h-10 mb-2 stroke-1 text-stone-600" />
            <p className="text-sm font-semibold text-stone-300">কোনো অর্ডার নেই</p>
            <p className="text-xs text-stone-500 mt-1">
              {dateFilter === 'today' ? 'আজকে এখনো কোনো অর্ডার নিশ্চিত করা হয়নি' : 'কোনো অর্ডার রেকর্ড নেই'}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const statusInfo = getStatusBadge(order.status);
            const isVoided = order.status === 'voided';
            const isPaid = order.paymentStatus === 'paid';

            return (
              <div
                key={order.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isVoided
                    ? 'bg-stone-950/60 border-stone-900 opacity-60'
                    : 'bg-stone-900/90 border-stone-800 shadow-sm'
                }`}
              >
                {/* Order Top Strip */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black font-mono text-orange-500 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      #{order.token}
                    </span>
                    <span className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                      {order.type === 'dine-in' ? (
                        <>
                          <Utensils className="w-3.5 h-3.5 text-stone-400" />
                          <span>ডাইন-ইন</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                          <span>পার্সেল</span>
                        </>
                      )}
                    </span>
                    <span className="text-xs text-stone-300 font-bold">
                      • {order.tableOrName}
                    </span>

                    {/* Payment Status Badge */}
                    {isPaid ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span>✅ পরিশোধিত</span>
                        <span className="font-normal text-stone-400 text-[10px]">
                          ({getPaymentMethodLabel(order.paymentMethod)})
                        </span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          ⏳ বাকি (Due)
                        </span>
                        {!isVoided && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(order)}
                            className="min-h-[28px] px-2 py-0.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-transform"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>টাকা গ্রহণ</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Toggle Button: Cycles রান্না হচ্ছে → তৈরি → পরিবেশিত */}
                  {!isVoided ? (
                    <button
                      type="button"
                      onClick={() => cycleOrderStatus(order.id)}
                      title="স্ট্যাটাস পরিবর্তন করতে চাপুন"
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${statusInfo.classes}`}
                    >
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </button>
                  ) : (
                    <span
                      className={`min-h-[30px] px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${statusInfo.classes}`}
                    >
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                  )}
                </div>

                {/* Voided Details Notice if applicable */}
                {isVoided && (
                  <div className="mb-2 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg p-2">
                    অর্ডারটি বাতিল করেছেন: {order.voidedBy} ({order.voidedAt || ''})
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-1 my-2.5 py-2 border-y border-stone-800/80">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-stone-200">
                        <strong className="text-stone-100">{item.quantity}x</strong> {item.name}
                      </span>
                      <span className="font-mono text-stone-300 font-semibold tabular-nums">
                        {formatTaka(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer: Time, Discount, Total & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-stone-400">
                    <span className="font-mono">{order.time}</span>
                    <span className="mx-1.5">•</span>
                    <span>{order.date}</span>
                    {order.discount > 0 && (
                      <span className="ml-2 text-stone-400">
                        (ছাড়: {formatTaka(order.discount)})
                      </span>
                    )}
                    <span className="ml-3 font-mono font-black text-sm text-stone-100">
                      মোট: <span className="text-orange-400">{formatTaka(order.total)}</span>
                    </span>
                  </div>

                  {/* Action Buttons: 🍳 কিচেন KOT, 🖨 বিল, 💬 WhatsApp, 📤 শেয়ার, বাতিল */}
                  <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                    {/* Kitchen KOT Button */}
                    <button
                      type="button"
                      onClick={() => openKitchenModal(order)}
                      title="কিচেন অর্ডার টিকিট প্রিন্ট বা ভিউ করুন"
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                      <span>🍳 কিচেন KOT</span>
                    </button>

                    {/* Print Bill */}
                    <button
                      type="button"
                      onClick={() => openReceiptModal(order)}
                      title="৭২মিমি কাস্টমার ক্যাশ মেমো"
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-300" />
                      <span>🖨 বিল</span>
                    </button>

                    {/* Send via WhatsApp */}
                    <button
                      type="button"
                      onClick={() => openWhatsAppModal(order)}
                      title="হোয়াটসঅ্যাপে গ্রাহককে বিল পাঠান"
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>💬 WhatsApp</span>
                    </button>

                    {/* Share / Copy */}
                    <button
                      type="button"
                      onClick={() => handleQuickShare(order)}
                      className="min-h-[38px] px-2 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center transition-colors"
                      title="ক্লিপবোর্ডে কপি করুন"
                    >
                      <Share2 className="w-3.5 h-3.5 text-stone-400" />
                    </button>

                    {/* Date Adjust Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderToEditDate(order);
                        setNewDateInput(order.date);
                      }}
                      title="অর্ডারের তারিখ পরিবর্তন বা অ্যাডজাস্ট করুন"
                      className="min-h-[38px] px-2 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    </button>

                    {/* Void Button (বাতিল) */}
                    {!isVoided && (
                      <button
                        type="button"
                        onClick={() => handleInitiateVoid(order)}
                        className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${
                          adminTapConfirmOrderId === order.id
                            ? 'bg-red-600 text-white border-red-500 animate-pulse'
                            : 'bg-red-950/40 hover:bg-red-900/60 text-red-400 border-red-800/60'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>
                          {adminTapConfirmOrderId === order.id ? 'নিশ্চিত করতে আবার চাপুন!' : 'বাতিল'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Confirm Dialog (2nd tap confirmation) */}
      <ConfirmDialog
        isOpen={showAdminConfirmModal}
        title="অর্ডারটি কি বাতিল করবেন?"
        message={`টোকেন #${orderToVoid?.token} বাতিল করলে খাদ্য উপকরণ ইনভেন্টরি স্টকে ফেরত চলে যাবে।`}
        confirmLabel="হ্যাঁ, বাতিল করুন"
        isDestructive={true}
        onConfirm={() => {
          if (orderToVoid) {
            voidOrder(orderToVoid.id, 'admin');
          }
          setShowAdminConfirmModal(false);
          setAdminTapConfirmOrderId(null);
          setOrderToVoid(null);
        }}
        onCancel={() => {
          setShowAdminConfirmModal(false);
          setAdminTapConfirmOrderId(null);
          setOrderToVoid(null);
        }}
      />

      {/* Cashier Admin PIN Dialog */}
      <AdminPinDialog
        isOpen={showAdminPinModal}
        title="অর্ডার বাতিলের অনুমোদন"
        description={`ক্যাশিয়ার টোকেন #${orderToVoid?.token} বাতিল করতে অ্যাডমিনের অনুমোদন বা PIN দিন:`}
        onSuccess={handleAdminPinSuccess}
        onCancel={() => {
          setShowAdminPinModal(false);
          setOrderToVoid(null);
        }}
      />

      {/* Date Adjustment Modal */}
      {orderToEditDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-base text-stone-100">
                  অর্ডারের তারিখ পরিবর্তন / অ্যাডজাস্ট
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderToEditDate(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              টোকেন <strong>#{orderToEditDate.token}</strong> এর বর্তমান তারিখ:{' '}
              <span className="font-mono text-orange-400 font-bold">{orderToEditDate.date}</span>
              । নতুন তারিখ নির্ধারণ করলে উক্ত দিনের বিক্রয় ও লাভ-ক্ষতির রিপোর্টে এটি অন্তর্ভুক্ত হবে।
            </p>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                নতুন তারিখ নির্বাচন করুন:
              </label>
              <input
                type="date"
                required
                value={newDateInput}
                onChange={e => setNewDateInput(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-stone-950 border border-stone-800 text-sm font-mono text-stone-100 focus:outline-hidden focus:border-orange-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToEditDate(null)}
                className="h-10 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (orderToEditDate && newDateInput) {
                    updateOrderDate(orderToEditDate.id, newDateInput);
                    setOrderToEditDate(null);
                  }
                }}
                className="h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm"
              >
                তারিখ সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
