/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MenuItem, RecipeIngredient } from '../../types';
import { formatTaka } from '../../utils/storage';
import { ConfirmDialog } from '../Modals/ConfirmDialog';
import {
  Calculator,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChefHat,
  AlertCircle,
} from 'lucide-react';

export const CostingScreen: React.FC = () => {
  const {
    menuItems,
    ingredients,
    calculateRecipeCost,
    updateMenuItemPrice,
    updateMenuItemRecipe,
    addMenuItem,
    deleteMenuItem,
  } = useApp();

  // Price editing state
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Recipe editor modal state
  const [editingRecipeItem, setEditingRecipeItem] = useState<MenuItem | null>(null);
  const [tempRecipe, setTempRecipe] = useState<RecipeIngredient[]>([]);

  // Add Item modal state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Kabab' | 'BBQ' | 'Sides & Dessert' | string>('Kabab');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemEmoji, setNewItemEmoji] = useState('🍢');
  const [newItemRecipe, setNewItemRecipe] = useState<RecipeIngredient[]>([
    { ingredientId: ingredients[0]?.id || '', amount: 0.1 },
  ]);

  // Delete item confirm
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Price Edit handlers
  const handleStartEditPrice = (item: MenuItem) => {
    setEditingPriceItemId(item.id);
    setTempPrice(String(item.price));
  };

  const handleSavePrice = (itemId: string) => {
    const num = parseFloat(tempPrice);
    if (!isNaN(num) && num >= 0) {
      updateMenuItemPrice(itemId, num);
    }
    setEditingPriceItemId(null);
  };

  // Recipe Editor handlers
  const handleOpenRecipeEditor = (item: MenuItem) => {
    setEditingRecipeItem(item);
    setTempRecipe([...item.recipe]);
  };

  const handleAddRecipeIngredient = () => {
    setTempRecipe(prev => [
      ...prev,
      { ingredientId: ingredients[0]?.id || '', amount: 0.01 },
    ]);
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setTempRecipe(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateRecipeRow = (
    index: number,
    field: 'ingredientId' | 'amount',
    val: string | number
  ) => {
    setTempRecipe(prev =>
      prev.map((r, idx) => (idx === index ? { ...r, [field]: val } : r))
    );
  };

  const handleSaveRecipe = () => {
    if (editingRecipeItem) {
      updateMenuItemRecipe(editingRecipeItem.id, tempRecipe);
      setEditingRecipeItem(null);
    }
  };

  // Add Item handlers
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    addMenuItem({
      name: newItemName.trim(),
      category: newItemCategory,
      price: priceNum,
      imageEmoji: newItemEmoji,
      recipe: newItemRecipe.filter(r => r.amount > 0),
    });

    setIsAddingItem(false);
    setNewItemName('');
    setNewItemPrice('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 p-3 sm:p-4 pb-20 md:pb-4">
      {/* Top Header & Add Item button */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-500" />
            <span>খাবারের কস্টিং ও রেসিপি বিশ্লেষণ (Food Costing)</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            প্রতিটি আইটেমের উপকরণ খরচ, লাভ এবং মার্জিন পার্সেন্টেজ বিশ্লেষণ ও রেসিপি সম্পাদনা
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingItem(true)}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন আইটেম যোগ করুন</span>
        </button>
      </div>

      {/* Costing Cards Grid */}
      <div className="flex-1 overflow-y-auto space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {menuItems.map(item => {
            const cost = calculateRecipeCost(item.recipe);
            const profit = item.price - cost;
            const margin = item.price > 0 ? (profit / item.price) * 100 : 0;
            const isEditingThisPrice = editingPriceItemId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 bg-stone-950 rounded-xl border border-stone-800">
                        {item.imageEmoji || '🍢'}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-stone-100 leading-tight">
                          {item.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-stone-400">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenRecipeEditor(item)}
                        title="রেসিপি সম্পাদনা করুন"
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                      >
                        <ChefHat className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        title="আইটেম মুছুন"
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-950/50 text-stone-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-center font-mono my-2.5">
                    {/* Selling Price */}
                    <div className="border-r border-stone-800 pr-1">
                      <span className="text-[10px] font-sans text-stone-400 block mb-0.5">
                        বিক্রয়মূল্য
                      </span>
                      {isEditingThisPrice ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={tempPrice}
                            onChange={e => setTempPrice(e.target.value)}
                            className="w-14 text-center text-xs font-bold bg-stone-900 border border-orange-500 rounded text-stone-100 p-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePrice(item.id)}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceItemId(null)}
                            className="text-stone-400 hover:text-stone-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartEditPrice(item)}
                          className="font-bold text-xs text-orange-400 hover:text-orange-300 flex items-center justify-center gap-1 mx-auto"
                        >
                          <span>{formatTaka(item.price)}</span>
                          {item.unconfirmedPrice && (
                            <span
                              title="মূল্য নিশ্চিত নয়"
                              className="text-[10px] text-amber-400 font-bold px-1 rounded bg-amber-500/20"
                            >
                              ?
                            </span>
                          )}
                          <Edit3 className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      )}
                    </div>

                    {/* Cost */}
                    <div className="border-r border-stone-800 pr-1">
                      <span className="text-[10px] font-sans text-stone-400 block mb-0.5">
                        উপকরণ খরচ
                      </span>
                      <span className="font-bold text-xs text-stone-300">
                        {formatTaka(cost)}
                      </span>
                    </div>

                    {/* Profit */}
                    <div>
                      <span className="text-[10px] font-sans text-stone-400 block mb-0.5">
                        মুনাফা / মার্জিন
                      </span>
                      <span
                        className={`font-bold text-xs ${
                          profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {formatTaka(profit)} ({margin.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  {/* Recipe Ingredients Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                      রেসিপির উপকরণ তালিকা:
                    </span>
                    <div className="space-y-1 text-xs">
                      {item.recipe.map((r, i) => {
                        const ing = ingredients.find(ingItem => ingItem.id === r.ingredientId);
                        const rowCost = ing ? ing.unitCost * r.amount : 0;
                        return (
                          <div
                            key={i}
                            className="flex justify-between text-[11px] text-stone-300 py-0.5 border-b border-stone-800/40"
                          >
                            <span className="truncate pr-2">
                              • {ing ? ing.name.split(' (')[0] : r.ingredientId}
                            </span>
                            <span className="font-mono text-stone-400 shrink-0">
                              {r.amount} {ing?.unit} ({formatTaka(rowCost)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Edit Recipe Action */}
                <button
                  type="button"
                  onClick={() => handleOpenRecipeEditor(item)}
                  className="w-full min-h-[36px] py-1.5 rounded-xl border border-stone-800 bg-stone-950/60 hover:bg-stone-800 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                  <span>রেসিপি সম্পাদনা ও পরিমাণ পরিবর্তন</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recipe Editor Modal */}
      {editingRecipeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-bold text-base text-stone-100">
                  রেসিপি এডিটর: {editingRecipeItem.name}
                </h3>
                <p className="text-xs text-stone-400">
                  উপকরণ ও পরিমাণের মান পরিবর্তন করলে স্বয়ংক্রিয়ভাবে খরচ সমন্বয় হবে
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecipeItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {tempRecipe.map((row, idx) => {
                const selectedIng = ingredients.find(i => i.id === row.ingredientId);
                const rowCost = selectedIng ? selectedIng.unitCost * row.amount : 0;

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs"
                  >
                    {/* Ingredient dropdown */}
                    <div className="flex-1">
                      <select
                        value={row.ingredientId}
                        onChange={e =>
                          handleUpdateRecipeRow(idx, 'ingredientId', e.target.value)
                        }
                        className="w-full h-9 px-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs focus:outline-hidden"
                      >
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount input */}
                    <div className="w-24">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.amount}
                        onChange={e =>
                          handleUpdateRecipeRow(
                            idx,
                            'amount',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full h-9 px-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-100 font-mono text-xs focus:outline-hidden"
                        placeholder="পরিমাণ"
                      />
                    </div>

                    <span className="text-[11px] text-stone-400 w-8">
                      {selectedIng?.unit}
                    </span>

                    {/* Calculated Cost */}
                    <div className="w-16 text-right font-mono text-orange-400 font-bold">
                      {formatTaka(rowCost)}
                    </div>

                    {/* Remove row */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipeIngredient(idx)}
                      className="w-7 h-7 rounded-lg text-stone-500 hover:text-red-400 flex items-center justify-center hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddRecipeIngredient}
                className="w-full min-h-[38px] py-2 rounded-xl border border-dashed border-stone-700 hover:border-orange-500 text-stone-300 hover:text-orange-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>আরেকটি উপকরণ যোগ করুন</span>
              </button>
            </div>

            {/* Modal Footer with Calculated Cost & Save */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <div className="text-xs font-mono">
                নতুন মোট খরচ:{' '}
                <strong className="text-orange-400 text-sm">
                  {formatTaka(calculateRecipeCost(tempRecipe))}
                </strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecipeItem(null)}
                  className="px-4 py-2 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 shadow-sm"
                >
                  রেসিপি সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Menu Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveNewItem}
            className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-5 text-stone-100 shadow-2xl space-y-3.5"
          >
            <h3 className="font-bold text-base text-stone-100">নতুন মেনু আইটেম যোগ করুন</h3>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                আইটেমের নাম (English)
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="যেমন: Garlic Butter Naan"
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  ক্যাটাগরি
                </label>
                <select
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Kabab">Kabab</option>
                  <option value="BBQ">BBQ</option>
                  <option value="Sides & Dessert">Sides &amp; Dessert</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">
                  বিক্রয়মূল্য (৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(e.target.value)}
                  placeholder="৳ 100"
                  className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1">
                ইমোজি আইকন
              </label>
              <div className="flex gap-2">
                {['🍢', '🍗', '🍖', '🔥', '🫓', '🍮', '🥗', '🥤'].map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewItemEmoji(em)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${
                      newItemEmoji === em
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-stone-800 bg-stone-950 hover:bg-stone-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="h-10 rounded-xl border border-stone-700 bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 shadow-sm"
              >
                যুক্ত করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Item Confirm Dialog */}
      <ConfirmDialog
        isOpen={itemToDelete !== null}
        title="আইটেমটি কি মুছে ফেলবেন?"
        message={`'${itemToDelete?.name}' মেনু থেকে মুছে ফেললে এটি আর POS স্ক্রিনে পাওয়া যাবে না।`}
        confirmLabel="হ্যাঁ, মুছুন"
        isDestructive={true}
        onConfirm={() => {
          if (itemToDelete) deleteMenuItem(itemToDelete.id);
          setItemToDelete(null);
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
