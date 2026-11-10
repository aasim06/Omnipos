import React from 'react';
import {
  Box24Regular,
  BowlChopsticks24Regular,
  Cookies24Regular,
  DrinkBeer24Regular,
  DrinkCoffee24Regular,
  DrinkToGo24Regular,
  Fire24Regular,
  Food24Regular,
  FoodApple24Regular,
  FoodCake24Regular,
  FoodCarrot24Regular,
  FoodChickenLeg24Regular,
  FoodEgg24Regular,
  FoodFish24Regular,
  FoodGrains24Regular,
  FoodPizza24Regular,
  FoodToast24Regular,
  Gift24Regular,
  Heart24Regular,
  LeafOne24Regular,
  Phone24Regular,
  Pill24Regular,
  ShoppingBag24Regular,
  Star24Regular,
  Tag24Regular,
} from '@fluentui/react-icons';
import type { Category } from '@shared/types';
import { CategoryIcon } from '@/features/pos/posIcons';

/* ─── Category tile colours ─────────────────────────────────────────
 * Shared by the POS tile board and the admin colour picker.
 * bg/ink: soft fill + text (item photo boxes); shine: the solid glossy fill of the category tile.
 */
export type TileTint = { bg: string; ink: string; shine: string };

export const CATEGORY_COLORS: { key: string; label: string; light: TileTint; dark: TileTint }[] = [
  { key: 'yellow', label: 'Yellow', light: { bg: '#FCE38A', ink: '#4D3D00', shine: '#FFD95A' }, dark: { bg: '#4F4314', ink: '#FBE7A1', shine: '#6B5A16' } },
  { key: 'green', label: 'Green', light: { bg: '#B9E4A9', ink: '#1C4612', shine: '#9EE07F' }, dark: { bg: '#2C4724', ink: '#C8EFBA', shine: '#3B6430' } },
  { key: 'pink', label: 'Pink', light: { bg: '#F8B9D1', ink: '#661634', shine: '#F9A6C6' }, dark: { bg: '#552839', ink: '#F9CCDD', shine: '#743550' } },
  { key: 'blue', label: 'Blue', light: { bg: '#AAD7F5', ink: '#0E3A5A', shine: '#8FCBF6' }, dark: { bg: '#213F57', ink: '#C4E3FA', shine: '#2E5878' } },
  { key: 'peach', label: 'Peach', light: { bg: '#F9CBA3', ink: '#62300D', shine: '#FBBB82' }, dark: { bg: '#553823', ink: '#FAD8BA', shine: '#744B2E' } },
  { key: 'mint', label: 'Mint', light: { bg: '#A9E6D8', ink: '#0D4639', shine: '#7FDCC6' }, dark: { bg: '#1E4840', ink: '#BEEFE3', shine: '#2A6457' } },
  { key: 'lavender', label: 'Lavender', light: { bg: '#D0C1F3', ink: '#352270', shine: '#BCA8F2' }, dark: { bg: '#382F5C', ink: '#DDD2F8', shine: '#4E4280' } },
  { key: 'coral', label: 'Coral', light: { bg: '#F6B0A8', ink: '#661A12', shine: '#F79C90' }, dark: { bg: '#562B26', ink: '#F9C6C0', shine: '#77392F' } },
  { key: 'red', label: 'Red', light: { bg: '#F4A3A3', ink: '#5E0F0F', shine: '#F17C7C' }, dark: { bg: '#5A2222', ink: '#F8C2C2', shine: '#7C2B2B' } },
  { key: 'teal', label: 'Teal', light: { bg: '#9ED9E3', ink: '#0B3D46', shine: '#6CC7D6' }, dark: { bg: '#1D4249', ink: '#BDE8EF', shine: '#275C66' } },
  { key: 'lime', label: 'Lime', light: { bg: '#D9EE9A', ink: '#3A4A06', shine: '#C6E66A' }, dark: { bg: '#3D4718', ink: '#E3F2B5', shine: '#55631F' } },
  { key: 'slate', label: 'Slate', light: { bg: '#C9D1DB', ink: '#1F2A37', shine: '#AEBACA' }, dark: { bg: '#323A45', ink: '#D5DCE5', shine: '#46505E' } },
];

/** Colours used automatically (by board position) when a category has none set. */
const AUTO_ORDER = ['yellow', 'green', 'pink', 'blue', 'peach', 'mint', 'lavender', 'coral'];

function hashIndex(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function tintByKey(key: string, isDark: boolean): TileTint | null {
  const c = CATEGORY_COLORS.find((x) => x.key === key);
  return c ? (isDark ? c.dark : c.light) : null;
}

/** Colour for a category: its saved colour, otherwise automatic from its position (or name). */
export function categoryTint(colorKey: string | null | undefined, fallbackIndex: number, isDark: boolean): TileTint {
  const saved = colorKey ? tintByKey(colorKey, isDark) : null;
  if (saved) return saved;
  const auto = AUTO_ORDER[((fallbackIndex % AUTO_ORDER.length) + AUTO_ORDER.length) % AUTO_ORDER.length];
  return tintByKey(auto, isDark)!;
}

export function autoTintIndex(name: string): number {
  return hashIndex(name);
}

/* ─── Category icons ──────────────────────────────────────────────── */
type IconComp = React.ComponentType<{ style?: React.CSSProperties }>;

export const CATEGORY_ICONS: { key: string; label: string; Icon: IconComp }[] = [
  { key: 'food', label: 'Food', Icon: Food24Regular },
  { key: 'pizza', label: 'Pizza', Icon: FoodPizza24Regular },
  { key: 'chicken', label: 'Chicken', Icon: FoodChickenLeg24Regular },
  { key: 'sandwich', label: 'Bread / sandwich', Icon: FoodToast24Regular },
  { key: 'bowl', label: 'Rice / noodles', Icon: BowlChopsticks24Regular },
  { key: 'fish', label: 'Fish', Icon: FoodFish24Regular },
  { key: 'egg', label: 'Breakfast', Icon: FoodEgg24Regular },
  { key: 'fire', label: 'Spicy / BBQ', Icon: Fire24Regular },
  { key: 'cake', label: 'Cake / dessert', Icon: FoodCake24Regular },
  { key: 'cookies', label: 'Snacks', Icon: Cookies24Regular },
  { key: 'drink', label: 'Cold drink', Icon: DrinkToGo24Regular },
  { key: 'coffee', label: 'Tea / coffee', Icon: DrinkCoffee24Regular },
  { key: 'shake', label: 'Shake / juice', Icon: DrinkBeer24Regular },
  { key: 'fruit', label: 'Fruit', Icon: FoodApple24Regular },
  { key: 'veg', label: 'Vegetables', Icon: FoodCarrot24Regular },
  { key: 'grains', label: 'Grocery', Icon: FoodGrains24Regular },
  { key: 'leaf', label: 'Healthy', Icon: LeafOne24Regular },
  { key: 'star', label: 'Special', Icon: Star24Regular },
  { key: 'deal', label: 'Deals', Icon: Tag24Regular },
  { key: 'gift', label: 'Gift', Icon: Gift24Regular },
  { key: 'heart', label: 'Favourite', Icon: Heart24Regular },
  { key: 'bag', label: 'Shopping', Icon: ShoppingBag24Regular },
  { key: 'box', label: 'General', Icon: Box24Regular },
  { key: 'pill', label: 'Pharmacy', Icon: Pill24Regular },
  { key: 'phone', label: 'Electronics', Icon: Phone24Regular },
];

/** Icon for a category: its saved icon, otherwise one picked from the name. */
export function CategoryTileIcon({ name, iconKey, size }: { name: string; iconKey?: string | null; size: number }) {
  const saved = iconKey ? CATEGORY_ICONS.find((x) => x.key === iconKey) : undefined;
  if (saved) return <saved.Icon style={{ width: size, height: size }} />;
  return <CategoryIcon cat={name} size={size} />;
}

/** Board order: saved displayOrder first (lower first), then the incoming order. */
export function sortCategoryNames(names: string[], meta: Map<string, Category>): string[] {
  return names
    .map((n, i) => ({ n, i, o: meta.get(n)?.displayOrder }))
    .sort((a, b) => {
      const ao = a.o ?? Number.MAX_SAFE_INTEGER;
      const bo = b.o ?? Number.MAX_SAFE_INTEGER;
      // displayOrder 0 is the database default, so treat it as "not set".
      const aa = ao === 0 ? Number.MAX_SAFE_INTEGER : ao;
      const bb = bo === 0 ? Number.MAX_SAFE_INTEGER : bo;
      return aa - bb || a.i - b.i;
    })
    .map((x) => x.n);
}
