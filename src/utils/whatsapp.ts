/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, PaymentMethod } from '../types';
import { formatTaka } from './storage';

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; color: string }[] = [
  { id: 'cash', label: 'নগদ (Cash)', icon: '💵', color: 'emerald' },
  { id: 'bkash', label: 'বিকাশ (bKash)', icon: '🌸', color: 'pink' },
  { id: 'nagad', label: 'নগদ অ্যাপ (Nagad)', icon: '🟠', color: 'orange' },
  { id: 'rocket', label: 'রকেট (Rocket)', icon: '🟣', color: 'purple' },
  { id: 'bangla_qr', label: 'বাংলা QR (Bangla QR)', icon: '📱', color: 'blue' },
];

export function getPaymentMethodLabel(method?: string): string {
  if (!method) return 'নগদ';
  const found = PAYMENT_METHODS.find(m => m.id === method);
  return found ? found.label : method;
}

export function formatWhatsAppMessage(order: Order): string {
  const isDineIn = order.type === 'dine-in';
  const itemsText = order.items
    .map(i => `▪ ${i.name} x${i.quantity} = ${formatTaka(i.price * i.quantity)}`)
    .join('\n');

  const paymentText =
    order.paymentStatus === 'paid'
      ? `✅ পরিশোধিত [${getPaymentMethodLabel(order.paymentMethod)}]`
      : '⏳ বাকি / খাওয়ার পর প্রদেয় (Due)';

  const discountText = order.discount > 0 ? `\nছাড় (Discount): -${formatTaka(order.discount)}` : '';

  return `🔥 *SNAXXORY Kabab & BBQ* 🔥
📍 প্লট ৩৭, রোড ২/১, ব্লক জে, রূপনগর, মিরপুর, ঢাকা
🌐 facebook.com/snaxxory

━━━━━━━━━━━━━━━━━━━━━
🧾 *টোকেন নম্বর:* #${order.token}
🍽 *অর্ডার ধরন:* ${isDineIn ? 'ডাইন-ইন (Dine-in)' : 'পার্সেল (Takeaway)'}
🏷 *টেবিল / নাম:* ${order.tableOrName}
📅 *তারিখ:* ${order.date} | ⏰ *সময়:* ${order.time}
━━━━━━━━━━━━━━━━━━━━━
*অর্ডারকৃত আইটেম:*
${itemsText}
━━━━━━━━━━━━━━━━━━━━━
সাবটোটাল: ${formatTaka(order.subtotal)}${discountText}
💰 *সর্বমোট বিল: ${formatTaka(order.total)}*
💳 *পেমেন্ট স্ট্যাটাস:* ${paymentText}
━━━━━━━━━━━━━━━━━━━━━
_ধন্যবাদ! আপনার আগমন আমাদের আনন্দিত করে। আবার আসবেন!_`;
}

export function cleanBDPhoneNumber(phone: string): string {
  // Remove non-digit characters
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If starts with 01, prepend 88
  if (digits.startsWith('01') && digits.length === 11) {
    digits = `88${digits}`;
  } else if (digits.startsWith('8801') && digits.length === 13) {
    // already good
  } else if (digits.length === 10 && digits.startsWith('1')) {
    digits = `880${digits}`;
  }
  return digits;
}

export function sendWhatsAppBill(order: Order, phoneOverride?: string): boolean {
  const phone = phoneOverride || order.customerPhone || '';
  const cleanPhone = cleanBDPhoneNumber(phone);
  const message = formatWhatsAppMessage(order);
  const encodedMsg = encodeURIComponent(message);

  let url = '';
  if (cleanPhone) {
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedMsg}`;
  }

  // Open in new tab or trigger WhatsApp intent
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = url;
    }
    return true;
  } catch {
    return false;
  }
}
