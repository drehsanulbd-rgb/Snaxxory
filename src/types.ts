/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'cashier';

export type OrderType = 'dine-in' | 'takeaway';

export type OrderStatus = 'cooking' | 'ready' | 'served' | 'voided';

export interface RecipeIngredient {
  ingredientId: string;
  amount: number; // in unit (kg, pcs, L)
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Kabab' | 'BBQ' | 'Sides & Dessert' | string;
  price: number;
  unconfirmedPrice?: boolean; // Pudding "?"
  recipe: RecipeIngredient[];
  imageEmoji?: string;
  imageUrl?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'kg' | 'pcs' | 'L';
  currentStock: number;
  minLevel: number;
  unitCost: number; // in ৳
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customPrice?: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  recipeCost: number;
}

export type PaymentStatus = 'paid' | 'unpaid' | 'due';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bangla_qr' | 'due';

export interface Order {
  id: string;
  token: string; // K1, K2...
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS AM/PM
  timestamp: number;
  type: OrderType;
  tableOrName: string;
  customerPhone?: string;
  items: OrderItem[];
  discount: number;
  subtotal: number;
  total: number;
  totalCost: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | string;
  paidAt?: string;
  voidedBy?: string; // 'admin' | 'cashier + admin PIN'
  voidedAt?: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: 'rent' | 'salary' | 'utilities' | 'fuel' | 'other';
  title: string;
  amount: number;
}

export interface Purchase {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  ingredientId: string;
  quantity: number;
  totalPrice: number;
  unitCost: number;
}

export interface WasteRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  ingredientId: string;
  quantity: number;
  reason: string;
  cost: number;
}

export interface SystemSettings {
  adminPin: string;
  cashierPin: string;
  hasChangedDefaultPins: boolean;
  theme: 'dark' | 'light';
}

export interface AppState {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  orders: Order[];
  expenses: Expense[];
  purchases: Purchase[];
  wastes: WasteRecord[];
  settings: SystemSettings;
}
