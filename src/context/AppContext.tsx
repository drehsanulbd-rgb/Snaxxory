/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Role,
  MenuItem,
  Ingredient,
  Order,
  CartItem,
  Expense,
  Purchase,
  WasteRecord,
  SystemSettings,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
} from '../types';
import { safeStorage } from '../utils/storage';
import { INITIAL_INGREDIENTS, INITIAL_MENU_ITEMS, INITIAL_EXPENSES, INITIAL_ORDERS } from '../data/initialData';
import { MENU_IMAGES } from '../data/menuImages';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  uploadToGoogleDrive,
  downloadFromGoogleDrive,
  SYNC_FILE_NAME,
} from '../services/googleDriveService';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

interface AppContextType {
  // Auth state
  currentRole: Role | null;
  adminPin: string;
  cashierPin: string;
  hasChangedDefaultPins: boolean;
  showDefaultPinWarning: boolean;
  dismissPinWarning: () => void;
  login: (role: Role, pin: string) => { success: boolean; message?: string; locked?: boolean; remainingSeconds?: number };
  logout: () => void;
  updatePins: (newAdminPin: string, newCashierPin: string) => { success: boolean; message: string };
  verifyAdminPin: (pin: string) => { success: boolean; message?: string; locked?: boolean; remainingSeconds?: number };
  pinLockoutRemaining: number;

  // Active view
  activeTab: 'pos' | 'orders' | 'reports' | 'stock' | 'costing' | 'settings';
  setActiveTab: (tab: 'pos' | 'orders' | 'reports' | 'stock' | 'costing' | 'settings') => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Data
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  orders: Order[];
  expenses: Expense[];
  purchases: Purchase[];
  wastes: WasteRecord[];

  // Recipe Cost Calculations
  calculateRecipeCost: (recipe: MenuItem['recipe']) => number;

  // POS Cart
  cart: CartItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  orderDate: string;
  setOrderDate: (date: string) => void;
  tableOrName: string;
  setTableOrName: (val: string) => void;
  discount: number;
  setDiscount: (val: number) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  updateCartItemPrice: (itemId: string, price: number) => void;
  clearCart: () => void;
  confirmOrder: (
    customDate?: string,
    deductStock?: boolean,
    paymentStatus?: PaymentStatus,
    paymentMethod?: PaymentMethod,
    customerPhone?: string
  ) => Order | null;

  // Order actions & Payments
  cycleOrderStatus: (orderId: string) => void;
  voidOrder: (orderId: string, voidedBy: 'admin' | 'cashier + admin PIN') => boolean;
  updateOrderDate: (orderId: string, newDate: string) => void;
  markOrderAsPaid: (orderId: string, paymentMethod: PaymentMethod, customerPhone?: string) => void;

  // Modals & Printing
  activeReceiptOrder: Order | null;
  openReceiptModal: (order: Order) => void;
  closeReceiptModal: () => void;

  activeKitchenOrder: Order | null;
  openKitchenModal: (order: Order) => void;
  closeKitchenModal: () => void;

  activePaymentOrder: Order | null;
  openPaymentModal: (order: Order) => void;
  closePaymentModal: () => void;

  activeWhatsAppOrder: Order | null;
  openWhatsAppModal: (order: Order) => void;
  closeWhatsAppModal: () => void;

  orderSuccessOrder: Order | null;
  closeOrderSuccessModal: () => void;

  printKitchenTicket: (order: Order) => void;
  printCustomerBill: (order: Order) => void;

  // Stock actions
  updateIngredientCostAndMin: (id: string, unitCost: number, minLevel: number) => void;
  addPurchase: (ingredientId: string, quantity: number, totalPrice: number) => void;
  recordWaste: (ingredientId: string, quantity: number, reason: string) => void;

  // Costing & Menu Item actions
  updateMenuItemPrice: (id: string, price: number) => void;
  updateMenuItemRecipe: (id: string, recipe: MenuItem['recipe']) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  deleteMenuItem: (id: string) => void;

  // Expenses actions
  addExpense: (category: Expense['category'], title: string, amount: number, date?: string) => void;
  deleteExpense: (id: string) => void;

  // Backup & Restore
  getBackupJSON: () => string;
  restoreFromJSON: (jsonString: string) => { success: boolean; message: string };
  resetToSampleData: () => void;

  // Google Drive Live Sync
  googleUser: User | null;
  isGoogleDriveConnected: boolean;
  isSyncingDrive: boolean;
  lastDriveSyncTime: string | null;
  autoDriveSync: boolean;
  setAutoDriveSync: (enabled: boolean) => void;
  connectGoogleDrive: () => Promise<boolean>;
  disconnectGoogleDrive: () => Promise<void>;
  syncToGoogleDrive: (silent?: boolean) => Promise<{ success: boolean; message: string }>;
  syncFromGoogleDrive: () => Promise<{ success: boolean; message: string }>;

  // Toast
  toasts: ToastMessage[];
  showToast: (text: string, type?: ToastMessage['type']) => void;
}

const STORAGE_KEYS = {
  MENU_ITEMS: 'snaxxory_menu_items_v1',
  INGREDIENTS: 'snaxxory_ingredients_v1',
  ORDERS: 'snaxxory_orders_v1',
  EXPENSES: 'snaxxory_expenses_v1',
  PURCHASES: 'snaxxory_purchases_v1',
  WASTES: 'snaxxory_wastes_v1',
  SETTINGS: 'snaxxory_settings_v1',
  SESSION_ROLE: 'snaxxory_session_role_v1',
  DRIVE_LAST_SYNC: 'snaxxory_drive_last_sync_v1',
  DRIVE_AUTO_SYNC: 'snaxxory_drive_auto_sync_v1',
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = safeStorage.getItem('snaxxory_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeStorage.setItem('snaxxory_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Auth & PIN Settings
  const [adminPin, setAdminPin] = useState<string>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.adminPin || '1234';
      } catch {}
    }
    return '1234';
  });

  const [cashierPin, setCashierPin] = useState<string>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.cashierPin || '1111';
      } catch {}
    }
    return '1111';
  });

  const [hasChangedDefaultPins, setHasChangedDefaultPins] = useState<boolean>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return !!parsed.hasChangedDefaultPins;
      } catch {}
    }
    return false;
  });

  const [currentRole, setCurrentRole] = useState<Role | null>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.SESSION_ROLE);
    return (saved as Role) || null;
  });

  const [showDefaultPinWarning, setShowDefaultPinWarning] = useState<boolean>(false);

  // Failed PIN attempts & lockout (5 wrong tries = 30 second lock)
  const [failedPinAttempts, setFailedPinAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [pinLockoutRemaining, setPinLockoutRemaining] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    let interval: any;
    if (lockoutUntil > Date.now()) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        setPinLockoutRemaining(remaining);
        if (remaining <= 0) {
          setLockoutUntil(0);
          setFailedPinAttempts(0);
          clearInterval(interval);
        }
      }, 500);
    } else {
      setPinLockoutRemaining(0);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'reports' | 'stock' | 'costing' | 'settings'>('pos');

  // Enforce role-based tab restriction: cashier can only view POS and Orders
  useEffect(() => {
    if (currentRole === 'cashier' && (activeTab === 'reports' || activeTab === 'stock' || activeTab === 'costing' || activeTab === 'settings')) {
      setActiveTab('pos');
    }
  }, [currentRole, activeTab]);

  // Main data collections
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (saved) {
      try {
        const parsed: MenuItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Normalize imageUrl: bundled MENU_IMAGES takes precedence for authentic dishes, repairing broken /src/ paths
          return parsed.map(item => {
            const bundledImg = MENU_IMAGES[item.id];
            const init = INITIAL_MENU_ITEMS.find(m => m.id === item.id);
            let img = bundledImg || item.imageUrl || init?.imageUrl;
            if (img && img.startsWith('/src/assets/images/')) {
              img = img.replace('/src/assets/images/', '/images/');
            } else if (img && img.startsWith('/src/')) {
              img = img.replace('/src/', '/');
            }
            return {
              ...item,
              imageUrl: bundledImg || img || init?.imageUrl,
            };
          });
        }
      } catch {}
    }
    return INITIAL_MENU_ITEMS;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.INGREDIENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_INGREDIENTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try {
        const parsed: Order[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Merge INITIAL_ORDERS if user hasn't already got them
          const missing = INITIAL_ORDERS.filter(io => !parsed.some(p => p.id === io.id));
          if (missing.length > 0) {
            return [...parsed, ...missing];
          }
          return parsed;
        }
      } catch {}
    }
    return INITIAL_ORDERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_EXPENSES;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [wastes, setWastes] = useState<WasteRecord[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.WASTES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Save changes to safeStorage
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.WASTES, JSON.stringify(wastes));
  }, [wastes]);

  useEffect(() => {
    safeStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ adminPin, cashierPin, hasChangedDefaultPins, theme })
    );
  }, [adminPin, cashierPin, hasChangedDefaultPins, theme]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [orderDate, setOrderDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [tableOrName, setTableOrName] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);

  // Active receipt for printing/sharing
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [activeKitchenOrder, setActiveKitchenOrder] = useState<Order | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeWhatsAppOrder, setActiveWhatsAppOrder] = useState<Order | null>(null);
  const [orderSuccessOrder, setOrderSuccessOrder] = useState<Order | null>(null);

  const openReceiptModal = useCallback((order: Order) => setActiveReceiptOrder(order), []);
  const closeReceiptModal = useCallback(() => setActiveReceiptOrder(null), []);

  const openKitchenModal = useCallback((order: Order) => setActiveKitchenOrder(order), []);
  const closeKitchenModal = useCallback(() => setActiveKitchenOrder(null), []);

  const openPaymentModal = useCallback((order: Order) => setActivePaymentOrder(order), []);
  const closePaymentModal = useCallback(() => setActivePaymentOrder(null), []);

  const openWhatsAppModal = useCallback((order: Order) => setActiveWhatsAppOrder(order), []);
  const closeWhatsAppModal = useCallback(() => setActiveWhatsAppOrder(null), []);

  const closeOrderSuccessModal = useCallback(() => setOrderSuccessOrder(null), []);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  // Calculate recipe cost helper
  const calculateRecipeCost = useCallback((recipe: MenuItem['recipe']): number => {
    return recipe.reduce((total, r) => {
      const ing = ingredients.find(i => i.id === r.ingredientId);
      if (!ing) return total;
      return total + ing.unitCost * r.amount;
    }, 0);
  }, [ingredients]);

  // Handle wrong PIN attempt
  const registerFailedPinAttempt = (): { locked: boolean; remainingSeconds: number } => {
    const nextAttempts = failedPinAttempts + 1;
    setFailedPinAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      const lockTime = Date.now() + 30000; // 30 seconds lockout
      setLockoutUntil(lockTime);
      setPinLockoutRemaining(30);
      return { locked: true, remainingSeconds: 30 };
    }
    return { locked: false, remainingSeconds: 0 };
  };

  // Login handler
  const login = (role: Role, pin: string) => {
    if (lockoutUntil > Date.now()) {
      const remaining = Math.max(1, Math.ceil((lockoutUntil - Date.now()) / 1000));
      return {
        success: false,
        message: `ভুল PIN চেষ্টার কারণে সাময়িকভাবে লক করা হয়েছে। অপেক্ষা করুন: ${remaining} সেকেন্ড`,
        locked: true,
        remainingSeconds: remaining,
      };
    }

    const expectedPin = role === 'admin' ? adminPin : cashierPin;
    if (pin !== expectedPin) {
      const lockRes = registerFailedPinAttempt();
      if (lockRes.locked) {
        return {
          success: false,
          message: 'ভুল PIN (৫ বার ভুল হয়েছে! ৩০ সেকেন্ডের জন্য লক করা হলো)',
          locked: true,
          remainingSeconds: lockRes.remainingSeconds,
        };
      }
      return {
        success: false,
        message: `ভুল PIN (${5 - failedPinAttempts - 1} বার বাকি)`,
      };
    }

    // Success login
    setFailedPinAttempts(0);
    setLockoutUntil(0);
    setCurrentRole(role);
    safeStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);

    // If admin logged in with default PINs, show warning
    if (role === 'admin' && (adminPin === '1234' || cashierPin === '1111') && !hasChangedDefaultPins) {
      setShowDefaultPinWarning(true);
    }

    showToast(`স্বাগতম! ${role === 'admin' ? 'অ্যাডমিন' : 'ক্যাশিয়ার'} হিসেবে লগইন হয়েছে।`, 'success');
    return { success: true };
  };

  // Verify Admin PIN (for Cashier voiding orders)
  const verifyAdminPin = (pin: string) => {
    if (lockoutUntil > Date.now()) {
      const remaining = Math.max(1, Math.ceil((lockoutUntil - Date.now()) / 1000));
      return {
        success: false,
        message: `লক রয়েছে। অপেক্ষা করুন: ${remaining} সেকেন্ড`,
        locked: true,
        remainingSeconds: remaining,
      };
    }

    if (pin !== adminPin) {
      const lockRes = registerFailedPinAttempt();
      if (lockRes.locked) {
        return {
          success: false,
          message: 'ভুল Admin PIN! ৫ বার ভুলের কারণে ৩০ সেকেন্ড লক করা হয়েছে।',
          locked: true,
          remainingSeconds: lockRes.remainingSeconds,
        };
      }
      return {
        success: false,
        message: `ভুল Admin PIN (${5 - failedPinAttempts - 1} বার বাকি)`,
      };
    }

    // Success admin PIN verification
    setFailedPinAttempts(0);
    setLockoutUntil(0);
    return { success: true };
  };

  const logout = () => {
    setCurrentRole(null);
    safeStorage.removeItem(STORAGE_KEYS.SESSION_ROLE);
    setActiveTab('pos');
    setShowDefaultPinWarning(false);
    showToast('লগআউট সফল হয়েছে।', 'info');
  };

  const dismissPinWarning = () => {
    setShowDefaultPinWarning(false);
  };

  const updatePins = (newAdminPin: string, newCashierPin: string) => {
    if (!/^\d{4,8}$/.test(newAdminPin)) {
      return { success: false, message: 'অ্যাডমিন PIN অবশ্যই ৪ থেকে ৮ ডিজিটের সংখ্যা হতে হবে।' };
    }
    if (!/^\d{4,8}$/.test(newCashierPin)) {
      return { success: false, message: 'ক্যাশিয়ার PIN অবশ্যই ৪ থেকে ৮ ডিজিটের সংখ্যা হতে হবে।' };
    }
    if (newAdminPin === newCashierPin) {
      return { success: false, message: 'অ্যাডমিন PIN এবং ক্যাশিয়ার PIN ভিন্ন হতে হবে।' };
    }

    setAdminPin(newAdminPin);
    setCashierPin(newCashierPin);
    setHasChangedDefaultPins(true);
    setShowDefaultPinWarning(false);
    showToast('PIN সফলভাবে পরিবর্তন করা হয়েছে!', 'success');
    return { success: true, message: 'PIN সফলভাবে পরিবর্তিত হয়েছে।' };
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.menuItem.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(ci => (ci.menuItem.id === itemId ? { ...ci, quantity } : ci))
    );
  };

  const updateCartItemPrice = (itemId: string, price: number) => {
    if (price < 0) return;
    setCart(prev =>
      prev.map(ci => (ci.menuItem.id === itemId ? { ...ci, customPrice: Math.round(price) } : ci))
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setTableOrName('');
    setOrderDate(new Date().toISOString().split('T')[0]);
  };

  // Confirm order (supports customDate for missing/backdated orders and payment selection)
  const confirmOrder = (
    customDate?: string,
    deductStock: boolean = true,
    paymentStatus: PaymentStatus = 'paid',
    paymentMethod: PaymentMethod = 'cash',
    customerPhone?: string
  ): Order | null => {
    if (cart.length === 0) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = customDate || orderDate || todayStr;

    // Daily token restart (K1, K2...) for the specific target date
    const targetDateOrders = orders.filter(o => o.date === targetDate);
    let maxTokenNum = 0;
    targetDateOrders.forEach(o => {
      const match = o.token.match(/^K(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxTokenNum) maxTokenNum = num;
      }
    });
    const nextToken = `K${maxTokenNum + 1}`;

    const subtotal = cart.reduce((sum, ci) => {
      const unitPrice = ci.customPrice !== undefined ? ci.customPrice : ci.menuItem.price;
      return sum + unitPrice * ci.quantity;
    }, 0);
    const validDiscount = Math.max(0, Math.min(subtotal, discount));
    const total = subtotal - validDiscount;

    let totalOrderCost = 0;
    const orderItems = cart.map(ci => {
      const unitPrice = ci.customPrice !== undefined ? ci.customPrice : ci.menuItem.price;
      const recipeCost = calculateRecipeCost(ci.menuItem.recipe);
      totalOrderCost += recipeCost * ci.quantity;
      return {
        menuItemId: ci.menuItem.id,
        name: ci.menuItem.name,
        price: unitPrice,
        quantity: ci.quantity,
        recipeCost,
      };
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      token: nextToken,
      date: targetDate,
      time: timeStr,
      timestamp: Date.now(),
      type: orderType,
      tableOrName: tableOrName.trim() || (orderType === 'dine-in' ? 'Table 1' : 'Takeaway'),
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      items: orderItems,
      discount: validDiscount,
      subtotal,
      total,
      totalCost: totalOrderCost,
      status: 'cooking',
      paymentStatus,
      paymentMethod: paymentStatus === 'paid' ? paymentMethod : 'due',
      paidAt: paymentStatus === 'paid' ? timeStr : undefined,
    };

    // Deduct ingredient stock by recipe if deductStock is enabled
    if (deductStock) {
      const ingredientDeductions: Record<string, number> = {};
      cart.forEach(ci => {
        ci.menuItem.recipe.forEach(r => {
          ingredientDeductions[r.ingredientId] = (ingredientDeductions[r.ingredientId] || 0) + (r.amount * ci.quantity);
        });
      });

      setIngredients(prev =>
        prev.map(ing => {
          const deduct = ingredientDeductions[ing.id] || 0;
          return deduct > 0
            ? { ...ing, currentStock: Math.round((ing.currentStock - deduct) * 1000) / 1000 }
            : ing;
        })
      );
    }

    setOrders(prev => [newOrder, ...prev]);

    // Reset Cart
    clearCart();

    // Show order action confirmation modal (no automatic jar of window.print)
    setOrderSuccessOrder(newOrder);

    const isToday = targetDate === todayStr;
    showToast(
      `অর্ডার সফল! টোকেন: ${nextToken} (${isToday ? 'আজ' : 'তারিখ: ' + targetDate})`,
      'success'
    );

    return newOrder;
  };

  // Mark order as paid (when customer settles later or pays due)
  const markOrderAsPaid = useCallback((orderId: string, paymentMethod: PaymentMethod, customerPhone?: string) => {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            paymentStatus: 'paid',
            paymentMethod,
            paidAt: nowTime,
            customerPhone: customerPhone !== undefined && customerPhone !== '' ? customerPhone : o.customerPhone,
          };
        }
        return o;
      })
    );
    showToast('পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে!', 'success');
  }, [showToast]);

  // Kitchen ticket printing (prints without financial prices)
  const printKitchenTicket = useCallback((order: Order) => {
    setActiveKitchenOrder(order);
    document.body.classList.add('printing-kitchen');
    setTimeout(() => {
      try {
        window.print();
      } catch {}
      setTimeout(() => {
        document.body.classList.remove('printing-kitchen');
      }, 500);
    }, 150);
  }, []);

  // Customer bill printing (prints full 72mm bill)
  const printCustomerBill = useCallback((order: Order) => {
    setActiveReceiptOrder(order);
    document.body.classList.remove('printing-kitchen');
    setTimeout(() => {
      try {
        window.print();
      } catch {}
    }, 150);
  }, []);

  // Adjust/update order date for missing or mistaken order date
  const updateOrderDate = (orderId: string, newDate: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, date: newDate } : o))
    );
    showToast(`অর্ডারের তারিখ পরিবর্তিত হয়েছে: ${newDate}`, 'success');
  };

  // Orders Screen actions
  const cycleOrderStatus = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId || o.status === 'voided') return o;
        const nextStatus: OrderStatus =
          o.status === 'cooking' ? 'ready' : o.status === 'ready' ? 'served' : 'cooking';
        return { ...o, status: nextStatus };
      })
    );
  };

  // Void order: returns ingredient stock and marks voided
  const voidOrder = (orderId: string, voidedBy: 'admin' | 'cashier + admin PIN'): boolean => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'voided') return false;

    // Return ingredient stock according to recipe
    const ingredientReturns: Record<string, number> = {};
    targetOrder.items.forEach(item => {
      const mItem = menuItems.find(m => m.id === item.menuItemId);
      if (mItem) {
        mItem.recipe.forEach(r => {
          ingredientReturns[r.ingredientId] =
            (ingredientReturns[r.ingredientId] || 0) + (r.amount * item.quantity);
        });
      }
    });

    setIngredients(prev =>
      prev.map(ing => {
        const toReturn = ingredientReturns[ing.id] || 0;
        return toReturn > 0
          ? { ...ing, currentStock: Math.round((ing.currentStock + toReturn) * 1000) / 1000 }
          : ing;
      })
    );

    const voidTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'voided' as OrderStatus,
              voidedBy,
              voidedAt: voidTime,
            }
          : o
      )
    );

    showToast(`অর্ডার ${targetOrder.token} বাতিল করা হয়েছে ও স্টক ফেরত এসেছে।`, 'info');
    return true;
  };


  // Stock actions
  const updateIngredientCostAndMin = (id: string, unitCost: number, minLevel: number) => {
    setIngredients(prev =>
      prev.map(ing => (ing.id === id ? { ...ing, unitCost, minLevel } : ing))
    );
    showToast('স্টক তথ্য আপডেট করা হয়েছে।', 'success');
  };

  const addPurchase = (ingredientId: string, quantity: number, totalPrice: number) => {
    if (quantity <= 0 || totalPrice <= 0) return;
    const unitCost = Math.round((totalPrice / quantity) * 100) / 100;
    const todayStr = new Date().toISOString().split('T')[0];

    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      date: todayStr,
      timestamp: Date.now(),
      ingredientId,
      quantity,
      totalPrice,
      unitCost,
    };

    setPurchases(prev => [newPurchase, ...prev]);

    setIngredients(prev =>
      prev.map(ing =>
        ing.id === ingredientId
          ? {
              ...ing,
              currentStock: Math.round((ing.currentStock + quantity) * 1000) / 1000,
              unitCost, // updates unit cost with new purchase
            }
          : ing
      )
    );

    showToast('ক্রয় যুক্ত হয়েছে ও স্টক বৃদ্ধি পেয়েছে।', 'success');
  };

  const recordWaste = (ingredientId: string, quantity: number, reason: string) => {
    if (quantity <= 0) return;
    const ing = ingredients.find(i => i.id === ingredientId);
    if (!ing) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const cost = Math.round(quantity * ing.unitCost * 100) / 100;

    const newWaste: WasteRecord = {
      id: `waste_${Date.now()}`,
      date: todayStr,
      timestamp: Date.now(),
      ingredientId,
      quantity,
      reason,
      cost,
    };

    setWastes(prev => [newWaste, ...prev]);

    setIngredients(prev =>
      prev.map(i =>
        i.id === ingredientId
          ? {
              ...i,
              currentStock: Math.round((i.currentStock - quantity) * 1000) / 1000,
            }
          : i
      )
    );

    showToast('অপচয় নথিভুক্ত হয়েছে ও স্টক সমন্বয় করা হয়েছে।', 'info');
  };

  // Costing & Menu Item actions
  const updateMenuItemPrice = (id: string, price: number) => {
    setMenuItems(prev =>
      prev.map(item => (item.id === id ? { ...item, price, unconfirmedPrice: false } : item))
    );
    showToast('মূল্য আপডেট হয়েছে।', 'success');
  };

  const updateMenuItemRecipe = (id: string, recipe: MenuItem['recipe']) => {
    setMenuItems(prev =>
      prev.map(item => (item.id === id ? { ...item, recipe } : item))
    );
    showToast('রেসিপি আপডেট হয়েছে।', 'success');
  };

  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `item_${Date.now()}`,
    };
    setMenuItems(prev => [...prev, newItem]);
    showToast('নতুন আইটেম যোগ করা হয়েছে।', 'success');
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
    showToast('আইটেম মুছে ফেলা হয়েছে।', 'info');
  };

  // Expense actions
  const addExpense = (
    category: Expense['category'],
    title: string,
    amount: number,
    date?: string
  ) => {
    const todayStr = date || new Date().toISOString().split('T')[0];
    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      date: todayStr,
      category,
      title,
      amount,
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast('খরচ সংরক্ষণ করা হয়েছে।', 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('খরচ মুছে ফেলা হয়েছে।', 'info');
  };

  // Backup & Restore: PINs are explicitly excluded from backup as required!
  const getBackupJSON = () => {
    const backupData = {
      version: '1.0',
      timestamp: Date.now(),
      appName: 'Snaxxory Kabab & BBQ POS',
      data: {
        menuItems,
        ingredients,
        orders,
        expenses,
        purchases,
        wastes,
      },
      // Note: adminPin & cashierPin are NOT included in the backup!
    };
    return JSON.stringify(backupData, null, 2);
  };

  const restoreFromJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      if (!data.menuItems || !data.ingredients || !data.orders) {
        return { success: false, message: 'অবৈধ ব্যাকআপ ফাইল ফরম্যাট।' };
      }

      setMenuItems(data.menuItems);
      setIngredients(data.ingredients);
      setOrders(data.orders);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (Array.isArray(data.wastes)) setWastes(data.wastes);

      showToast('সব তথ্য সফলভাবে রিস্টোর হয়েছে!', 'success');
      return { success: true, message: 'ব্যাকআপ সফলভাবে রিস্টোর করা হয়েছে।' };
    } catch {
      return { success: false, message: 'JSON পার্স করতে ব্যর্থ হয়েছে। সঠিক টেক্সট পেস্ট করুন।' };
    }
  };

  const resetToSampleData = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
    setIngredients(INITIAL_INGREDIENTS);
    setExpenses(INITIAL_EXPENSES);
    setOrders(INITIAL_ORDERS);
    setPurchases([]);
    setWastes([]);
    setCart([]);
    showToast('ডিফল্ট ডেটায় রিসেট সম্পন্ন হয়েছে।', 'info');
  };

  // Google Drive Live Sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [lastDriveSyncTime, setLastDriveSyncTime] = useState<string | null>(() => {
    return safeStorage.getItem(STORAGE_KEYS.DRIVE_LAST_SYNC);
  });
  const [autoDriveSync, setAutoDriveSyncState] = useState<boolean>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.DRIVE_AUTO_SYNC);
    return saved !== null ? saved === 'true' : true;
  });

  const setAutoDriveSync = useCallback((enabled: boolean) => {
    setAutoDriveSyncState(enabled);
    safeStorage.setItem(STORAGE_KEYS.DRIVE_AUTO_SYNC, enabled ? 'true' : 'false');
  }, []);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Connect Google Drive
  const connectGoogleDrive = useCallback(async (): Promise<boolean> => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        showToast(`গুগল ড্রাইভে কানেক্ট হয়েছে (${res.user.email || 'সফল'})!`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('connectGoogleDrive error:', err);
      showToast(err.message || 'গুগল ড্রাইভ সাইন ইন ব্যর্থ হয়েছে।', 'error');
      return false;
    }
  }, [showToast]);

  // Disconnect Google Drive
  const disconnectGoogleDrive = useCallback(async (): Promise<void> => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      showToast('গুগল ড্রাইভ সংযোগ বিচ্ছিন্ন করা হয়েছে।', 'info');
    } catch (err: any) {
      console.error('disconnectGoogleDrive error:', err);
      showToast('সাইন আউট করতে সমস্যা হয়েছে।', 'error');
    }
  }, [showToast]);

  // Sync to Google Drive
  const syncToGoogleDrive = useCallback(async (silent = false): Promise<{ success: boolean; message: string }> => {
    const token = await getAccessToken();
    if (!token) {
      if (!silent) showToast('প্রথমে গুগল ড্রাইভ দিয়ে সাইন ইন করুন।', 'warning');
      return { success: false, message: 'Google Drive access token missing' };
    }

    setIsSyncingDrive(true);
    try {
      const backupString = getBackupJSON();
      const res = await uploadToGoogleDrive(token, backupString);
      if (res.success) {
        const timeNow = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('bn-BD');
        setLastDriveSyncTime(timeNow);
        safeStorage.setItem(STORAGE_KEYS.DRIVE_LAST_SYNC, timeNow);
        if (!silent) {
          showToast(`গুগল ড্রাইভে ডাটা সিঙ্ক সম্পন্ন হয়েছে (${SYNC_FILE_NAME})!`, 'success');
        }
        return { success: true, message: res.message };
      } else {
        if (!silent) showToast(res.message, 'error');
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err.message || 'গুগল ড্রাইভ সিঙ্ক ব্যর্থ হয়েছে';
      if (!silent) showToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsSyncingDrive(false);
    }
  }, [getBackupJSON, showToast]);

  // Sync / Download from Google Drive
  const syncFromGoogleDrive = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const token = await getAccessToken();
    if (!token) {
      showToast('প্রথমে গুগল ড্রাইভ দিয়ে সাইন ইন করুন।', 'warning');
      return { success: false, message: 'Google Drive token missing' };
    }

    setIsSyncingDrive(true);
    try {
      const res = await downloadFromGoogleDrive(token);
      if (res.success && res.data) {
        const restoreRes = restoreFromJSON(JSON.stringify(res.data));
        if (restoreRes.success) {
          const timeNow = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('bn-BD');
          setLastDriveSyncTime(timeNow);
          safeStorage.setItem(STORAGE_KEYS.DRIVE_LAST_SYNC, timeNow);
          showToast('গুগল ড্রাইভ থেকে সমস্ত লাইভ ডাটা লোড সম্পন্ন হয়েছে!', 'success');
          return { success: true, message: 'ডাটা সফলভাবে রিস্টোর হয়েছে।' };
        } else {
          showToast(restoreRes.message, 'error');
          return restoreRes;
        }
      } else {
        showToast(res.message, 'warning');
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err.message || 'ড্রাইভ থেকে ডাটা লোড ব্যর্থ';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsSyncingDrive(false);
    }
  }, [restoreFromJSON, showToast]);

  // Auto-Sync Debounce: after data changes, sync to drive if autoDriveSync is active
  useEffect(() => {
    if (!autoDriveSync || !googleUser) return;
    const timer = setTimeout(() => {
      syncToGoogleDrive(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [orders, menuItems, ingredients, expenses, purchases, wastes, autoDriveSync, googleUser, syncToGoogleDrive]);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        adminPin,
        cashierPin,
        hasChangedDefaultPins,
        showDefaultPinWarning,
        dismissPinWarning,
        login,
        logout,
        updatePins,
        verifyAdminPin,
        pinLockoutRemaining,

        activeTab,
        setActiveTab,

        theme,
        toggleTheme,

        menuItems,
        ingredients,
        orders,
        expenses,
        purchases,
        wastes,

        calculateRecipeCost,

        cart,
        orderType,
        setOrderType,
        orderDate,
        setOrderDate,
        tableOrName,
        setTableOrName,
        discount,
        setDiscount,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartItemPrice,
        clearCart,
        confirmOrder,

        cycleOrderStatus,
        voidOrder,
        updateOrderDate,
        markOrderAsPaid,

        activeReceiptOrder,
        openReceiptModal,
        closeReceiptModal,

        activeKitchenOrder,
        openKitchenModal,
        closeKitchenModal,

        activePaymentOrder,
        openPaymentModal,
        closePaymentModal,

        activeWhatsAppOrder,
        openWhatsAppModal,
        closeWhatsAppModal,

        orderSuccessOrder,
        closeOrderSuccessModal,

        printKitchenTicket,
        printCustomerBill,

        updateIngredientCostAndMin,
        addPurchase,
        recordWaste,

        updateMenuItemPrice,
        updateMenuItemRecipe,
        addMenuItem,
        deleteMenuItem,

        addExpense,
        deleteExpense,

        getBackupJSON,
        restoreFromJSON,
        resetToSampleData,

        // Google Drive Live Sync
        googleUser,
        isGoogleDriveConnected: !!googleUser,
        isSyncingDrive,
        lastDriveSyncTime,
        autoDriveSync,
        setAutoDriveSync,
        connectGoogleDrive,
        disconnectGoogleDrive,
        syncToGoogleDrive,
        syncFromGoogleDrive,

        toasts,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
