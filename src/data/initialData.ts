/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ingredient, MenuItem, Expense, Order } from '../types';
import { MENU_IMAGES } from './menuImages';

export const INITIAL_ORDERS: Order[] = [
  // 01/11/2026: Mughlai Reshmi Kabab (1 pcs), Smoky BBQ Full Leg (2 pcs) -> Subtotal: ৳440
  {
    id: 'ord_20261101_k1',
    token: 'K1',
    date: '2026-11-01',
    time: '08:30 PM',
    timestamp: 1793547000000,
    type: 'dine-in',
    tableOrName: 'Table 2',
    items: [
      {
        menuItemId: 'item_reshmi_kabab',
        name: 'Mughlai Reshmi Kabab',
        price: 100,
        quantity: 1,
        recipeCost: 46.75,
      },
      {
        menuItemId: 'item_bbq_full_leg',
        name: 'Smoky BBQ Full Leg',
        price: 170,
        quantity: 2,
        recipeCost: 101.70,
      },
    ],
    discount: 0,
    subtotal: 440,
    total: 440,
    totalCost: 250.15,
    status: 'served',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
  },

  // 02/11/2026 - Order 1: Mughlai Reshmi Kabab (2 pcs), Hariyali Chicken Kabab (1 pcs), Naan (2 pcs)
  {
    id: 'ord_20261102_k1',
    token: 'K1',
    date: '2026-11-02',
    time: '07:15 PM',
    timestamp: 1793632500000,
    type: 'dine-in',
    tableOrName: 'Table 1',
    items: [
      {
        menuItemId: 'item_reshmi_kabab',
        name: 'Mughlai Reshmi Kabab',
        price: 100,
        quantity: 2,
        recipeCost: 46.75,
      },
      {
        menuItemId: 'item_hariyali_kabab',
        name: 'Hariyali Chicken Kabab',
        price: 100,
        quantity: 1,
        recipeCost: 46.75,
      },
      {
        menuItemId: 'item_naan',
        name: 'Naan (1 pcs)',
        price: 20,
        quantity: 2,
        recipeCost: 8,
      },
    ],
    discount: 0,
    subtotal: 340,
    total: 340,
    totalCost: 156.25,
    status: 'served',
    paymentStatus: 'paid',
    paymentMethod: 'bkash',
  },

  // 02/11/2026 - Order 2: Mughlai Reshmi Kabab (1 pcs), Smoky BBQ Full Leg (1 pcs), Hariyali Chicken Kabab (1 pcs), Naan (2 pcs)
  {
    id: 'ord_20261102_k2',
    token: 'K2',
    date: '2026-11-02',
    time: '09:05 PM',
    timestamp: 1793639100000,
    type: 'takeaway',
    tableOrName: 'Parcel #4',
    items: [
      {
        menuItemId: 'item_reshmi_kabab',
        name: 'Mughlai Reshmi Kabab',
        price: 100,
        quantity: 1,
        recipeCost: 46.75,
      },
      {
        menuItemId: 'item_bbq_full_leg',
        name: 'Smoky BBQ Full Leg',
        price: 170,
        quantity: 1,
        recipeCost: 101.70,
      },
      {
        menuItemId: 'item_hariyali_kabab',
        name: 'Hariyali Chicken Kabab',
        price: 100,
        quantity: 1,
        recipeCost: 46.75,
      },
      {
        menuItemId: 'item_naan',
        name: 'Naan (1 pcs)',
        price: 20,
        quantity: 2,
        recipeCost: 8,
      },
    ],
    discount: 0,
    subtotal: 410,
    total: 410,
    totalCost: 211.20,
    status: 'served',
    paymentStatus: 'paid',
    paymentMethod: 'nagad',
  },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing_chicken_boneless',
    name: 'চিকেন বোনলেস (Chicken boneless)',
    unit: 'kg',
    currentStock: 12.0,
    minLevel: 2.5,
    unitCost: 300,
  },
  {
    id: 'ing_chicken_leg',
    name: 'চিকেন লেগ পিস (Chicken leg piece)',
    unit: 'pcs',
    currentStock: 45,
    minLevel: 10,
    unitCost: 45,
  },
  {
    id: 'ing_chicken_thigh',
    name: 'চিকেন থাই পিস (Chicken thigh piece)',
    unit: 'pcs',
    currentStock: 40,
    minLevel: 10,
    unitCost: 40,
  },
  {
    id: 'ing_kabab_marinade',
    name: 'কাবাব ম্যারিনেড ও মশলা (Kabab marinade & spices)',
    unit: 'kg',
    currentStock: 6.5,
    minLevel: 1.5,
    unitCost: 250,
  },
  {
    id: 'ing_cooking_oil',
    name: 'রান্নার তেল (Cooking oil)',
    unit: 'L',
    currentStock: 15.0,
    minLevel: 3.0,
    unitCost: 190,
  },
  {
    id: 'ing_skewer_stick',
    name: 'শিক কাঠি (Skewer stick)',
    unit: 'pcs',
    currentStock: 150,
    minLevel: 30,
    unitCost: 1,
  },
  {
    id: 'ing_naan',
    name: 'নান (Naan bread)',
    unit: 'pcs',
    currentStock: 60,
    minLevel: 15,
    unitCost: 8,
  },
  {
    id: 'ing_pudding_cup',
    name: 'পুডিং কাপ (Pudding cup)',
    unit: 'pcs',
    currentStock: 35,
    minLevel: 8,
    unitCost: 45,
  },
  {
    id: 'ing_packaging_sauce',
    name: 'বক্স, সস ও ফয়েল (Packaging & sauce)',
    unit: 'pcs',
    currentStock: 250,
    minLevel: 50,
    unitCost: 6,
  },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // 1. Kabab
  {
    id: 'item_smoky_boti',
    name: 'Smoky Chicken Boti Kabab',
    category: 'Kabab',
    price: 100,
    imageEmoji: '🍢',
    imageUrl: MENU_IMAGES.item_smoky_boti || '/images/smoky_boti_kabab_1793724025525.jpg',
    recipe: [
      { ingredientId: 'ing_chicken_boneless', amount: 0.12 },
      { ingredientId: 'ing_kabab_marinade', amount: 0.015 },
      { ingredientId: 'ing_skewer_stick', amount: 1 },
      { ingredientId: 'ing_packaging_sauce', amount: 1 },
    ],
  },
  {
    id: 'item_hariyali_kabab',
    name: 'Hariyali Chicken Kabab',
    category: 'Kabab',
    price: 100,
    imageEmoji: '🌿',
    imageUrl: MENU_IMAGES.item_hariyali_kabab || '/images/hariyali_kabab_1793724026042.jpg',
    recipe: [
      { ingredientId: 'ing_chicken_boneless', amount: 0.12 },
      { ingredientId: 'ing_kabab_marinade', amount: 0.015 },
      { ingredientId: 'ing_skewer_stick', amount: 1 },
      { ingredientId: 'ing_packaging_sauce', amount: 1 },
    ],
  },
  {
    id: 'item_reshmi_kabab',
    name: 'Mughlai Reshmi Kabab',
    category: 'Kabab',
    price: 100,
    imageEmoji: '✨',
    imageUrl: MENU_IMAGES.item_reshmi_kabab || '/images/reshmi_kabab_1793724026071.jpg',
    recipe: [
      { ingredientId: 'ing_chicken_boneless', amount: 0.12 },
      { ingredientId: 'ing_kabab_marinade', amount: 0.015 },
      { ingredientId: 'ing_skewer_stick', amount: 1 },
      { ingredientId: 'ing_packaging_sauce', amount: 1 },
    ],
  },

  // 2. BBQ
  {
    id: 'item_bbq_leg',
    name: 'BBQ Chicken Leg (1 pcs)',
    category: 'BBQ',
    price: 90,
    imageEmoji: '🍗',
    imageUrl: MENU_IMAGES.item_bbq_leg || '/images/bbq_chicken_leg_1793724027735.jpg',
    recipe: [
      { ingredientId: 'ing_chicken_leg', amount: 1 },
      { ingredientId: 'ing_kabab_marinade', amount: 0.01 },
      { ingredientId: 'ing_cooking_oil', amount: 0.02 },
      { ingredientId: 'ing_packaging_sauce', amount: 1 },
    ],
  },
  {
    id: 'item_bbq_thai',
    name: 'BBQ Chicken Thai Piece (1 pcs)',
    category: 'BBQ',
    price: 90,
    imageEmoji: '🍖',
    imageUrl: MENU_IMAGES.item_bbq_thai || '/images/bbq_thai_piece_1793724027407.jpg',
    recipe: [
      { ingredientId: 'ing_chicken_thigh', amount: 1 },
      { ingredientId: 'ing_kabab_marinade', amount: 0.01 },
      { ingredientId: 'ing_cooking_oil', amount: 0.02 },
      { ingredientId: 'ing_packaging_sauce', amount: 1 },
    ],
  },
  {
    id: 'item_bbq_full_leg',
    name: 'Smoky BBQ Full Leg',
    category: 'BBQ',
    price: 170,
    imageEmoji: '🔥',
    imageUrl: MENU_IMAGES.item_bbq_full_leg || '/images/smoky_full_leg_1793724029480.jpg',
    recipe: [
      { ingredientId: 'ing_chicken_leg', amount: 1 },
      { ingredientId: 'ing_chicken_thigh', amount: 1 },
      { ingredientId: 'ing_kabab_marinade', amount: 0.02 },
      { ingredientId: 'ing_cooking_oil', amount: 0.03 },
      { ingredientId: 'ing_packaging_sauce', amount: 1 },
    ],
  },

  // 3. Sides & Dessert
  {
    id: 'item_naan',
    name: 'Naan (1 pcs)',
    category: 'Sides & Dessert',
    price: 20,
    imageEmoji: '🫓',
    imageUrl: MENU_IMAGES.item_naan || '/images/naan_bread_1793724028883.jpg',
    recipe: [
      { ingredientId: 'ing_naan', amount: 1 },
    ],
  },
  {
    id: 'item_pudding',
    name: 'Pudding',
    category: 'Sides & Dessert',
    price: 100,
    unconfirmedPrice: true, // Mark with "?" in Costing as required!
    imageEmoji: '🍮',
    imageUrl: MENU_IMAGES.item_pudding || '/images/caramel_pudding_1793724029321.jpg',
    recipe: [
      { ingredientId: 'ing_pudding_cup', amount: 1 },
    ],
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    date: new Date().toISOString().split('T')[0],
    category: 'utilities',
    title: 'বিদ্যুৎ বিল ও সিলিন্ডার গ্যাস',
    amount: 1500,
  },
  {
    id: 'exp_2',
    date: new Date().toISOString().split('T')[0],
    category: 'fuel',
    title: 'BBQ কয়লা ও কেরোসিন',
    amount: 800,
  },
];
