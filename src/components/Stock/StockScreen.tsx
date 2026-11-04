/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ingredient } from '../../types';
import { formatTaka, formatQty } from '../../utils/storage';
import {
  Boxes,
  ShoppingCart,
  Trash,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Edit2,
  Calendar,
  Check,
} from 'lucide-react';

export const StockScreen: React.FC = () => {
  const {
    ingredients,
    orders,
    purchases,
    wastes,
    menuItems,
    updateIngredientCostAndMin,
    addPurchase,
    recordWaste,
  } = useApp();

  const [activeStockTab, setActiveStockTab] = useState<'inventory' | 'daily_report'>('inventory');

  // Daily Stock Report date
  const todayStr = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState<string>(todayStr);

  // Modal states
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseIngredientId, setPurchaseIngredientId] = useState(ingredients[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseTotalPrice, setPurchaseTotalPrice] = useState('');

  const [isRecordingWaste, setIsRecordingWaste] = useState(false);
  const [wasteIngredientId, setWasteIngredientId] = useState(ingredients[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('পোড়া / নষ্ট');

  // Edit Unit Cost & Min Level modal
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editUnitCost, setEditUnitCost] = useState('');
  const [editMinLevel, setEditMinLevel] = useState('');

  // Handle Add Purchase
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(purchaseQty);
    const priceNum = parseFloat(purchaseTotalPrice);
    if (!purchaseIngredientId || isNaN(qtyNum) || isNaN(priceNum) || qtyNum <= 0 || priceNum <= 0) {
      return;
    }
    addPurchase(purchaseIngredientId, qtyNum, priceNum);
    setIsPurchasing(false);
    setPurchaseQty('');
    setPurchaseTotalPrice('');
  };

  // Handle Record Waste
  const handleSaveWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(wasteQty);
    if (!wasteIngredientId || isNaN(qtyNum) || qtyNum <= 0) return;

    recordWaste(wasteIngredientId, qtyNum, wasteReason.trim() || 'নষ্ট');
    setIsRecordingWaste(false);
    setWasteQty('');
  };

  // Handle Edit Ingredient
  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setEditUnitCost(String(ing.unitCost));
    setEditMinLevel(String(ing.minLevel));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;
    const costNum = parseFloat(editUnitCost);
    const minNum = parseFloat(editMinLevel);
    if (isNaN(costNum) || isNaN(minNum) || costNum < 0 || minNum < 0) return;

    updateIngredientCostAndMin(editingIngredient.id, costNum, minNum);
    setEditingIngredient(null);
  };

  // Calculate Daily Stock Report for `reportDate`
  // Opening, Bought, Used, Wasted, Closing, Cost Used
  const dailyReportData = useMemo(() => {
    const reportOrders = orders.filter(o => o.date === reportDate && o.status !== 'voided');
    const reportPurchases = purchases.filter(p => p.date === reportDate);
    const reportWastes = wastes.filter(w => w.date === reportDate);

    // Sum used by ingredients
    const usedMap: Record<string, number> = {};
    reportOrders.forEach(o => {
      o.items.forEach(item => {
        const m = menuItems.find(mi => mi.id === item.menuItemId);
        if (m) {
          m.recipe.forEach(r => {
            usedMap[r.ingredientId] =
              (usedMap[r.ingredientId] || 0) + (r.amount * item.quantity);
          });
        }
      });
    });

    // Sum bought by ingredients
    const boughtMap: Record<string, number> = {};
    reportPurchases.forEach(p => {
      boughtMap[p.ingredientId] = (boughtMap[p.ingredientId] || 0) + p.quantity;
    });

    // Sum wasted by ingredients
    const wastedMap: Record<string, number> = {};
    reportWastes.forEach(w => {
      wastedMap[w.ingredientId] = (wastedMap[w.ingredientId] || 0) + w.quantity;
    });

    return ingredients.map(ing => {
      const bought = boughtMap[ing.id] || 0;
      const used = usedMap[ing.id] || 0;
      const wasted = wastedMap[ing.id] || 0;

      // Closing stock for today is the current stock
      // Opening = closing - bought + used + wasted
      const closing = ing.currentStock;
      const opening = Math.round((closing - bought + used + wasted) * 1000) / 1000;
      const costUsed = Math.round(used * ing.unitCost * 100) / 100;

      return {
        ingredient: ing,
        opening,
        bought,
        used,
        wasted,
        closing,
        costUsed,
      };
    });
  }, [ingredients, orders, purchases, wastes, menuItems, reportDate]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 p-3 sm:p-4 pb-20 md:pb-4">
      {/* Top Controls: Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Segmented Control */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveStockTab('inventory')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStockTab === 'inventory'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            বর্তমান স্টক ও ইনভেন্টরি
          </button>
          <button
            type="button"
            onClick={() => setActiveStockTab('daily_report')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStockTab === 'daily_report'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            দৈনিক স্টক রিপোর্ট
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeStockTab === 'inventory' ? (
            <>
              <button
                type="button"
                onClick={() => setIsPurchasing(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>ক্রয় যোগ করুন (+ ক্রয়)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRecordingWaste(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash className="w-3.5 h-3.5 text-stone-400" />
                <span>অপচয় (- নষ্ট)</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-4 h-4 text-orange-400" />
              <input
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="bg-transparent text-stone-100 text-xs font-mono focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Stock Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {activeStockTab === 'inventory' ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-stone-100">উপকরণ স্টক তালিকা</h3>
              <span className="text-[11px] text-stone-400">
                কম বা নেগেটিভ স্টক{' '}
                <span className="text-red-400 font-bold">লাল রঙে</span> প্রদর্শিত হয়
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-medium">
                    <th className="pb-2.5">উপকরণের নাম</th>
                    <th className="pb-2.5 text-center">একক</th>
                    <th className="pb-2.5 text-right">বর্তমান স্টক</th>
                    <th className="pb-2.5 text-right">ন্যূনতম লেভেল</th>
                    <th className="pb-2.5 text-right">একক খরচ (৳)</th>
                    <th className="pb-2.5 text-right">মোট মান (৳)</th>
                    <th className="pb-2.5 text-center">স্ট্যাটাস / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {ingredients.map(ing => {
                    const isLow = ing.currentStock <= ing.minLevel;
                    const isNegative = ing.currentStock < 0;
                    const totalValue = Math.round(ing.currentStock * ing.unitCost);

                    return (
                      <tr
                        key={ing.id}
                        className={`hover:bg-stone-800/40 transition-colors ${
                          isLow || isNegative ? 'bg-red-950/20' : ''
                        }`}
                      >
                        <td className="py-3 font-sans font-semibold text-stone-200">
                          {ing.name}
                        </td>
                        <td className="py-3 text-center text-stone-400">{ing.unit}</td>
                        <td
                          className={`py-3 text-right font-bold text-sm tabular-nums ${
                            isNegative
                              ? 'text-red-500 font-black'
                              : isLow
                              ? 'text-red-400 font-black'
                              : 'text-stone-100'
                          }`}
                        >
                          {ing.currentStock} {ing.unit}
                        </td>
                        <td className="py-3 text-right text-stone-400">
                          {ing.minLevel} {ing.unit}
                        </td>
                        <td className="py-3 text-right text-stone-200">
                          {formatTaka(ing.unitCost)}
                        </td>
                        <td className="py-3 text-right text-stone-300">
                          {formatTaka(Math.max(0, totalValue))}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isLow && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-sans bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isNegative ? 'ঘাটতি' : 'কম স্টক'}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(ing)}
                              title="খরচ বা ন্যূনতম লেভেল পরিবর্তন করুন"
                              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Daily Stock Report Table */
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-sm text-stone-100 mb-3 flex items-center justify-between">
              <span>দৈনিক স্টক রিপোর্ট ({reportDate})</span>
              <span className="text-xs text-stone-400 font-normal">
                মোট ব্যবহৃত খরচ:{' '}
                <strong className="text-orange-400 font-mono">
                  {formatTaka(dailyReportData.reduce((sum, d) => sum + d.costUsed, 0))}
                </strong>
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-medium">
                    <th className="pb-2.5">উপাদান</th>
                    <th className="pb-2.5 text-center">একক</th>
                    <th className="pb-2.5 text-right">শুরুর স্টক</th>
                    <th className="pb-2.5 text-right text-emerald-400">কেনা (+)</th>
                    <th className="pb-2.5 text-right text-orange-400">ব্যবহৃত (-)</th>
                    <th className="pb-2.5 text-right text-red-400">অপচয় (-)</th>
                    <th className="pb-2.5 text-right font-bold text-stone-200">সমাপনী স্টক</th>
                    <th className="pb-2.5 text-right">ব্যবহৃত খরচ (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {dailyReportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-800/30">
                      <td className="py-2.5 font-sans font-semibold text-stone-200">
                        {row.ingredient.name}
                      </td>
                      <td className="py-2.5 text-center text-stone-400">{row.ingredient.unit}</td>
                      <td className="py-2.5 text-right text-stone-300">{row.opening}</td>
                      <td className="py-2.5 text-right text-emerald-400 font-semibold">
                        {row.bought > 0 ? `+${row.bought}` : '0'}
                      </td>
                      <td className="py-2.5 text-right text-orange-400 font-semibold">
                        {row.used > 0 ? `-${row.used}` : '0'}
                      </td>
                      <td className="py-2.5 text-right text-red-400 font-semibold">
                        {row.wasted > 0 ? `-${row.wasted}` : '0'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-stone-100">{row.closing}</td>
                      <td className="py-2.5 text-right font-semibold text-stone-200">
                        {formatTaka(row.costUsed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Purchase Modal */}
      {isPurchasing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSavePurchase}
            className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl space-y-3.5"
          >
            <h3 className="font-bold text-base text-stone-100">নতুন উপাদান ক্রয় যোগ করুন</h3>
            <p className="text-xs text-stone-400">
              পরিমাণ ও মোট ক্রয়মূল্য দিলে সিস্টেম স্বয়ংক্রিয়ভাবে প্রতি এককের খরচ (Unit Cost) হিসাব
              করে নিবে।
            </p>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                উপাদান নির্বাচন
              </label>
              <select
                value={purchaseIngredientId}
                onChange={e => setPurchaseIngredientId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-hidden focus:border-orange-500"
              >
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  ক্রয়ের পরিমাণ
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={purchaseQty}
                  onChange={e => setPurchaseQty(e.target.value)}
                  placeholder="পরিমাণ"
                  className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  মোট মূল্য (৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={purchaseTotalPrice}
                  onChange={e => setPurchaseTotalPrice(e.target.value)}
                  placeholder="৳ মোট"
                  className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {parseFloat(purchaseQty) > 0 && parseFloat(purchaseTotalPrice) > 0 && (
              <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300">
                হিসাবকৃত একক দর:{' '}
                <strong className="text-orange-400">
                  {formatTaka(parseFloat(purchaseTotalPrice) / parseFloat(purchaseQty))}
                </strong>{' '}
                প্রতি একক
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPurchasing(false)}
                className="h-10 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 shadow-sm"
              >
                ক্রয় নিশ্চিত করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Waste Modal */}
      {isRecordingWaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveWaste}
            className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl space-y-3.5"
          >
            <h3 className="font-bold text-base text-stone-100">অপচয় (Waste) নথিভুক্ত করুন</h3>
            <p className="text-xs text-stone-400">
              পোড়া, অতিরিক্ত রান্না বা নষ্ট উপাদান স্টক থেকে বাদ দিন।
            </p>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">উপাদান</label>
              <select
                value={wasteIngredientId}
                onChange={e => setWasteIngredientId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-hidden focus:border-orange-500"
              >
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                অপচয়ের পরিমাণ
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={wasteQty}
                onChange={e => setWasteQty(e.target.value)}
                placeholder="পরিমাণ"
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">কারণ</label>
              <input
                type="text"
                value={wasteReason}
                onChange={e => setWasteReason(e.target.value)}
                placeholder="যেমন: পোড়া বা নষ্ট"
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRecordingWaste(false)}
                className="h-10 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 shadow-sm"
              >
                অপচয় সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Ingredient Cost & Min Modal */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl space-y-3.5"
          >
            <h3 className="font-bold text-base text-stone-100">উপকরণের তথ্য সম্পাদনা</h3>
            <p className="text-xs text-orange-400 font-bold">{editingIngredient.name}</p>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                একক খরচ / Unit Cost (৳ প্রতি {editingIngredient.unit})
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={editUnitCost}
                onChange={e => setEditUnitCost(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                ন্যূনতম লেভেল / Minimum Level ({editingIngredient.unit})
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={editMinLevel}
                onChange={e => setEditMinLevel(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingIngredient(null)}
                className="h-10 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 shadow-sm"
              >
                আপডেট করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
