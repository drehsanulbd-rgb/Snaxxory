/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Direct imports ensure Vite bundles, hashes, and guarantees resolution in both dev and production builds
import smokyBoti from '../assets/images/smoky_boti_kabab_1793724025525.jpg';
import hariyali from '../assets/images/hariyali_kabab_1793724026042.jpg';
import reshmi from '../assets/images/reshmi_kabab_1793724026071.jpg';
import bbqLeg from '../assets/images/bbq_chicken_leg_1793724027735.jpg';
import bbqThai from '../assets/images/bbq_thai_piece_1793724027407.jpg';
import smokyFullLeg from '../assets/images/smoky_full_leg_1793724029480.jpg';
import naan from '../assets/images/naan_bread_1793724028883.jpg';
import pudding from '../assets/images/caramel_pudding_1793724029321.jpg';

export const MENU_IMAGES: Record<string, string> = {
  item_smoky_boti: smokyBoti,
  item_hariyali_kabab: hariyali,
  item_reshmi_kabab: reshmi,
  item_bbq_leg: bbqLeg,
  item_bbq_thai: bbqThai,
  item_bbq_full_leg: smokyFullLeg,
  item_naan: naan,
  item_pudding: pudding,
};

/**
 * Resolves a bulletproof image URL for any menu item.
 * Prioritizes the Vite-bundled asset, then the item's imageUrl, then public fallback.
 */
export function getMenuItemImageUrl(itemId: string, customUrl?: string): string | undefined {
  if (MENU_IMAGES[itemId]) {
    return MENU_IMAGES[itemId];
  }
  if (!customUrl) return undefined;
  let url = customUrl.trim();
  if (url.startsWith('/src/assets/images/')) {
    return url.replace('/src/assets/images/', '/images/');
  }
  if (url.startsWith('/src/')) {
    return url.replace('/src/', '/');
  }
  return url;
}
