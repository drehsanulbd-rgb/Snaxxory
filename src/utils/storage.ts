/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In-memory fallback map if localStorage is restricted or disabled in browser
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // In-memory fallback
    }
    return memoryStorage[key] ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Fallback
    }
    memoryStorage[key] = value;
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fallback
    }
    delete memoryStorage[key];
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Fallback
    }
    for (const key in memoryStorage) {
      delete memoryStorage[key];
    }
  }
};

/**
 * Escapes user text to prevent XSS injection
 */
export function escapeText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats a number in Bangladeshi Taka (৳) format
 */
export function formatTaka(amount: number, showSign = true): string {
  const num = Number.isFinite(amount) ? amount : 0;
  const formatted = num.toLocaleString('en-BD', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return showSign ? `৳${formatted}` : formatted;
}

/**
 * Format quantity with proper unit
 */
export function formatQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 1000) / 1000;
  return `${rounded} ${unit}`;
}
