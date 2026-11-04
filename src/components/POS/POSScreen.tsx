/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MenuItem } from '../../types';
import { formatTaka } from '../../utils/storage';
import { CartView } from './CartView';
import { CartBottomSheet } from './CartBottomSheet';
import { NumericKeypadModal, KeypadMode } from './NumericKeypadModal';
import { Search, ShoppingCart, Plus, Flame, Calculator } from 'lucide-react';
import { getMenuItemImageUrl } from '../../data/menuImages';

// Resilient Thumbnail for Menu Items with fallback and automatic URL normalization
const MenuItemThumbnail: React.FC<{ item: MenuItem }> = ({ item }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const finalUrl = useMemo(() => {
    return getMenuItemImageUrl(item.id, item.imageUrl);
  }, [item.id, item.imageUrl]);

  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-950 flex items-center justify-center border border-stone-800 shrink-0 group-hover:scale-105 transition-transform shadow-xs relative">
      {finalUrl && !hasError ? (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900 text-stone-500 animate-pulse">
              <span className="text-xl select-none">{item.imageEmoji || '🍗'}</span>
            </div>
          )}
          <img
            src={finalUrl}
            alt={item.name}
            className={`w-full h-full object-cover select-none transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900 text-stone-200">
          <span className="text-2xl select-none leading-none">{item.imageEmoji || '🍗'}</span>
        </div>
      )}
    </div>
  );
};

export const POSScreen: React.FC = () => {
  const { menuItems, cart, addToCart, updateCartQuantity } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সব');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Custom Keypad Modal for rapid quantity input directly from menu grid
  const [keypadConfig, setKeypadConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    mode: KeypadMode;
    initialValue: number;
    minValue?: number;
    maxValue?: number;
    onConfirm: (val: number) => void;
  }>({
    isOpen: false,
    title: '',
    mode: 'quantity',
    initialValue: 0,
    onConfirm: () => {},
  });

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach(item => set.add(item.category));
    return ['সব', ...Array.from(set)];
  }, [menuItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'সব' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Group items by category if "সব" is selected, else single group
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Cart stats for mobile floating bar
  const totalItemsCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartSubtotal = cart.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);

  // Map item id to quantity in cart for badges
  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach(ci => {
      map[ci.menuItem.id] = ci.quantity;
    });
    return map;
  }, [cart]);

  const openKeypadForItem = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentQty = cartQuantities[item.id] || 0;
    setKeypadConfig({
      isOpen: true,
      title: 'পরিমাণ নির্ধারণ (Quantity)',
      subtitle: item.name,
      mode: 'quantity',
      initialValue: currentQty > 0 ? currentQty : 1,
      minValue: 0,
      maxValue: 999,
      onConfirm: (qty: number) => {
        if (currentQty === 0 && qty > 0) {
          addToCart(item);
          if (qty > 1) {
            setTimeout(() => {
              updateCartQuantity(item.id, qty);
            }, 50);
          }
        } else {
          updateCartQuantity(item.id, qty);
        }
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-stone-950">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Controls: Search & Category Chips */}
        <div className="p-3 border-b border-stone-800 bg-stone-900/50 backdrop-blur-xs space-y-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="খাবার খুঁজুন (আইটেমের নাম)..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-hidden focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips: Interactive segmented control buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid: Scrollable */}
        <div className="flex-1 overflow-y-auto p-3.5 pb-24 md:pb-4 space-y-5">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-stone-500">
              <Flame className="w-10 h-10 mb-2 stroke-1 text-stone-600" />
              <p className="text-sm font-semibold text-stone-400">কোনো খাবার পাওয়া যায়নি</p>
              <p className="text-xs text-stone-500 mt-1">অনুসন্ধান বা ক্যাটাগরি পরিবর্তন করুন</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([categoryName, items]) => (
              <div key={categoryName} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-stone-200 uppercase tracking-wider">
                    {categoryName}
                  </h3>
                  <div className="flex-1 h-px bg-stone-800" />
                  <span className="text-[11px] font-semibold text-stone-500">
                    {items.length} আইটেম
                  </span>
                </div>

                {/* Items Grid: Big Touch Targets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {items.map(item => {
                    const inCartCount = cartQuantities[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => addToCart(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            addToCart(item);
                          }
                        }}
                        className={`group relative text-left p-3.5 rounded-2xl border transition-all active:scale-[0.98] flex items-center justify-between gap-3 shadow-sm select-none cursor-pointer ${
                          inCartCount > 0
                            ? 'bg-stone-900 border-orange-500/70 shadow-orange-500/10'
                            : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-850'
                        }`}
                      >
                        {/* Left: Food Photo Thumbnail */}
                        <MenuItemThumbnail item={item} />

                        {/* Middle: Name & Price */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-stone-100 group-hover:text-orange-400 transition-colors leading-snug truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-extrabold text-orange-500 font-mono text-sm">
                              {formatTaka(item.price)}
                            </span>
                            {item.unconfirmedPrice && (
                              <span
                                title="মূল্য নিশ্চিত নয়"
                                className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold"
                              >
                                ?
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Keypad quick input & Quantity Badge / + button */}
                        <div className="shrink-0 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {/* Tactile Keypad trigger button */}
                          <button
                            type="button"
                            onClick={(e) => openKeypadForItem(item, e)}
                            title="কিপ্যাড দিয়ে সরাসরি পরিমাণ বসান"
                            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 hover:text-orange-400 flex items-center justify-center transition-all border border-stone-700/60 shadow-xs cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>

                          {/* +1 Quick add or quantity indicator */}
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            title="+1 যোগ করুন"
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                              inCartCount > 0
                                ? 'bg-orange-600 text-white shadow-orange-600/30'
                                : 'bg-stone-800 hover:bg-orange-600 text-stone-300 hover:text-white'
                            }`}
                          >
                            {inCartCount > 0 ? inCartCount : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop Cart Column (340px) */}
      <div className="hidden md:block w-80 lg:w-96 p-3 h-full border-l border-stone-800 shrink-0">
        <CartView />
      </div>

      {/* Mobile Sticky Floating Bottom Checkout Bar */}
      {totalItemsCount > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 p-2.5 bg-gradient-to-t from-stone-950 via-stone-950 to-transparent">
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full min-h-[50px] px-4 py-2 rounded-2xl bg-orange-600 text-white font-bold text-sm flex items-center justify-between shadow-xl shadow-orange-600/30 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-black/25 flex items-center justify-center font-mono text-xs">
                  {totalItemsCount}
                </div>
                <span>কার্ট দেখুন</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-xs text-orange-200">মোট:</span>
                <span className="text-base font-extrabold">{formatTaka(cartSubtotal)}</span>
                <span className="ml-1 px-2.5 py-1 bg-white/20 rounded-lg text-xs font-bold">
                  চেকআউট →
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet */}
      <CartBottomSheet
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
      />

      {/* Tactile Keypad Modal for Rapid Quantity Selection */}
      <NumericKeypadModal
        isOpen={keypadConfig.isOpen}
        onClose={() => setKeypadConfig(prev => ({ ...prev, isOpen: false }))}
        title={keypadConfig.title}
        subtitle={keypadConfig.subtitle}
        mode={keypadConfig.mode}
        initialValue={keypadConfig.initialValue}
        minValue={keypadConfig.minValue}
        maxValue={keypadConfig.maxValue}
        onConfirm={keypadConfig.onConfirm}
      />
    </div>
  );
};
