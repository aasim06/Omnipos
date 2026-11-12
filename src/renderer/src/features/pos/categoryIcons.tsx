/**
 * Category icons for every kind of business (pharmacy, electronics, hardware, apparel, food…).
 *
 * A category tile uses its saved icon when one was picked in POS board settings; otherwise the
 * icon is chosen from the category name with the keyword rules below. Words match whole words
 * (with plural endings), so "men" no longer matches "supplements". When nothing matches, food
 * businesses get the food icon and every other business a neutral shopping-bag icon.
 */
import React from 'react';
import {
  AnimalPawPrint24Regular,
  BatteryCharge24Regular,
  Beaker24Regular,
  Bed24Regular,
  Book24Regular,
  BowlChopsticks24Regular,
  Box24Regular,
  BriefcaseMedical24Regular,
  Camera24Regular,
  ClothesHanger24Regular,
  Cookies24Regular,
  Couch24Regular,
  Cut24Regular,
  Diamond24Regular,
  DrinkBeer24Regular,
  DrinkCoffee24Regular,
  DrinkToGo24Regular,
  Drop24Regular,
  Dumbbell24Regular,
  Eyedropper24Regular,
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
  Games24Regular,
  GasPump24Regular,
  Gift24Regular,
  Glasses24Regular,
  Headphones24Regular,
  Heart24Regular,
  HeartPulse24Regular,
  Keyboard24Regular,
  Laptop24Regular,
  LeafOne24Regular,
  Lightbulb24Regular,
  Notebook24Regular,
  PaintBrush24Regular,
  Pen24Regular,
  Phone24Regular,
  Pill24Regular,
  PlantGrass24Regular,
  PlugConnected24Regular,
  Print24Regular,
  ShoppingBag24Regular,
  Sparkle24Regular,
  Sport24Regular,
  Star24Regular,
  Stethoscope24Regular,
  Syringe24Regular,
  Tag24Regular,
  Teddy24Regular,
  Toolbox24Regular,
  Tv24Regular,
  UsbStick24Regular,
  VehicleCar24Regular,
  Water24Regular,
  WrenchScrewdriver24Regular,
} from '@fluentui/react-icons';

type IconComp = React.ComponentType<{ style?: React.CSSProperties }>;

/** Icons offered in POS board settings (key is what is saved on the category). */
export const CATEGORY_ICONS: { key: string; label: string; group: string; Icon: IconComp }[] = [
  // Food & drinks
  { key: 'food', label: 'Food', group: 'Food', Icon: Food24Regular },
  { key: 'pizza', label: 'Pizza', group: 'Food', Icon: FoodPizza24Regular },
  { key: 'chicken', label: 'Chicken', group: 'Food', Icon: FoodChickenLeg24Regular },
  { key: 'sandwich', label: 'Bread / burger', group: 'Food', Icon: FoodToast24Regular },
  { key: 'bowl', label: 'Rice / noodles', group: 'Food', Icon: BowlChopsticks24Regular },
  { key: 'fish', label: 'Fish', group: 'Food', Icon: FoodFish24Regular },
  { key: 'egg', label: 'Breakfast', group: 'Food', Icon: FoodEgg24Regular },
  { key: 'fire', label: 'Spicy / BBQ', group: 'Food', Icon: Fire24Regular },
  { key: 'cake', label: 'Cake / dessert', group: 'Food', Icon: FoodCake24Regular },
  { key: 'cookies', label: 'Snacks', group: 'Food', Icon: Cookies24Regular },
  { key: 'drink', label: 'Cold drink', group: 'Food', Icon: DrinkToGo24Regular },
  { key: 'coffee', label: 'Tea / coffee', group: 'Food', Icon: DrinkCoffee24Regular },
  { key: 'shake', label: 'Shake / juice', group: 'Food', Icon: DrinkBeer24Regular },
  { key: 'fruit', label: 'Fruit', group: 'Food', Icon: FoodApple24Regular },
  { key: 'veg', label: 'Vegetables', group: 'Food', Icon: FoodCarrot24Regular },
  { key: 'grains', label: 'Grocery', group: 'Food', Icon: FoodGrains24Regular },
  // Pharmacy & health
  { key: 'pill', label: 'Tablets / capsules', group: 'Pharmacy', Icon: Pill24Regular },
  { key: 'syrup', label: 'Syrup / suspension', group: 'Pharmacy', Icon: Beaker24Regular },
  { key: 'drops', label: 'Drops', group: 'Pharmacy', Icon: Eyedropper24Regular },
  { key: 'syringe', label: 'Injections', group: 'Pharmacy', Icon: Syringe24Regular },
  { key: 'cream', label: 'Cream / ointment', group: 'Pharmacy', Icon: Drop24Regular },
  { key: 'vitamins', label: 'Vitamins / supplements', group: 'Pharmacy', Icon: HeartPulse24Regular },
  { key: 'firstaid', label: 'First aid / surgical', group: 'Pharmacy', Icon: BriefcaseMedical24Regular },
  { key: 'device', label: 'Medical devices', group: 'Pharmacy', Icon: Stethoscope24Regular },
  { key: 'baby', label: 'Baby care', group: 'Pharmacy', Icon: Teddy24Regular },
  { key: 'hygiene', label: 'Personal care', group: 'Pharmacy', Icon: Water24Regular },
  { key: 'beauty', label: 'Beauty / cosmetics', group: 'Pharmacy', Icon: Sparkle24Regular },
  { key: 'optical', label: 'Optical', group: 'Pharmacy', Icon: Glasses24Regular },
  // Electronics
  { key: 'phone', label: 'Mobiles', group: 'Electronics', Icon: Phone24Regular },
  { key: 'laptop', label: 'Computers', group: 'Electronics', Icon: Laptop24Regular },
  { key: 'accessories', label: 'Computer accessories', group: 'Electronics', Icon: Keyboard24Regular },
  { key: 'audio', label: 'Audio', group: 'Electronics', Icon: Headphones24Regular },
  { key: 'tv', label: 'TV / display', group: 'Electronics', Icon: Tv24Regular },
  { key: 'camera', label: 'Camera', group: 'Electronics', Icon: Camera24Regular },
  { key: 'printer', label: 'Printing', group: 'Electronics', Icon: Print24Regular },
  { key: 'battery', label: 'Battery / power', group: 'Electronics', Icon: BatteryCharge24Regular },
  { key: 'storage', label: 'USB / storage', group: 'Electronics', Icon: UsbStick24Regular },
  { key: 'electrical', label: 'Electrical', group: 'Electronics', Icon: PlugConnected24Regular },
  { key: 'lighting', label: 'Lighting', group: 'Electronics', Icon: Lightbulb24Regular },
  // Hardware & home
  { key: 'tools', label: 'Tools', group: 'Hardware', Icon: WrenchScrewdriver24Regular },
  { key: 'hardware', label: 'Hardware', group: 'Hardware', Icon: Toolbox24Regular },
  { key: 'paint', label: 'Paint', group: 'Hardware', Icon: PaintBrush24Regular },
  { key: 'plumbing', label: 'Sanitary / plumbing', group: 'Hardware', Icon: Water24Regular },
  { key: 'furniture', label: 'Furniture', group: 'Hardware', Icon: Couch24Regular },
  { key: 'bedding', label: 'Bedding', group: 'Hardware', Icon: Bed24Regular },
  { key: 'garden', label: 'Garden / plants', group: 'Hardware', Icon: PlantGrass24Regular },
  { key: 'auto', label: 'Auto parts', group: 'Hardware', Icon: VehicleCar24Regular },
  { key: 'fuel', label: 'Fuel / gas', group: 'Hardware', Icon: GasPump24Regular },
  // Retail
  { key: 'clothes', label: 'Clothing', group: 'Retail', Icon: ClothesHanger24Regular },
  { key: 'shoes', label: 'Footwear', group: 'Retail', Icon: Tag24Regular },
  { key: 'jewellery', label: 'Jewellery', group: 'Retail', Icon: Diamond24Regular },
  { key: 'books', label: 'Books', group: 'Retail', Icon: Book24Regular },
  { key: 'stationery', label: 'Stationery', group: 'Retail', Icon: Notebook24Regular },
  { key: 'pen', label: 'Pens', group: 'Retail', Icon: Pen24Regular },
  { key: 'toys', label: 'Toys / games', group: 'Retail', Icon: Games24Regular },
  { key: 'sport', label: 'Sports', group: 'Retail', Icon: Sport24Regular },
  { key: 'fitness', label: 'Fitness', group: 'Retail', Icon: Dumbbell24Regular },
  { key: 'pets', label: 'Pets', group: 'Retail', Icon: AnimalPawPrint24Regular },
  { key: 'salon', label: 'Salon', group: 'Retail', Icon: Cut24Regular },
  // General
  { key: 'leaf', label: 'Healthy / organic', group: 'General', Icon: LeafOne24Regular },
  { key: 'star', label: 'Special', group: 'General', Icon: Star24Regular },
  { key: 'deal', label: 'Deals', group: 'General', Icon: Tag24Regular },
  { key: 'gift', label: 'Gift', group: 'General', Icon: Gift24Regular },
  { key: 'heart', label: 'Favourite', group: 'General', Icon: Heart24Regular },
  { key: 'bag', label: 'Shopping', group: 'General', Icon: ShoppingBag24Regular },
  { key: 'box', label: 'General', group: 'General', Icon: Box24Regular },
];

const ICON_BY_KEY = new Map(CATEGORY_ICONS.map((x) => [x.key, x.Icon]));

/**
 * Name keywords → icon. Checked top to bottom; the first rule with a matching word wins, so the
 * more specific rules (e.g. "eye drops") sit above broader ones.
 */
const RULES: { key: string; words: string[] }[] = [
  // Pharmacy & health
  { key: 'syringe', words: ['injection', 'injectable', 'syringe', 'vaccine', 'insulin', 'ampoule', 'ampule', 'vial', 'iv'] },
  { key: 'drops', words: ['drop', 'eye drop', 'ear drop', 'nasal', 'dropper'] },
  { key: 'syrup', words: ['syrup', 'suspension', 'elixir', 'linctus', 'liquid', 'solution', 'oral liquid', 'cough'] },
  { key: 'cream', words: ['cream', 'ointment', 'gel', 'lotion', 'derma', 'dermatology', 'topical'] },
  { key: 'vitamins', words: ['vitamin', 'supplement', 'multivitamin', 'nutrition', 'nutraceutical', 'protein', 'herbal'] },
  { key: 'firstaid', words: ['first aid', 'bandage', 'dressing', 'gauze', 'plaster', 'antiseptic', 'surgical', 'cotton'] },
  { key: 'device', words: ['device', 'equipment', 'glucometer', 'thermometer', 'nebulizer', 'nebuliser', 'bp', 'bp monitor', 'sugar monitor', 'stethoscope', 'test strip'] },
  { key: 'pill', words: ['tablet', 'tab', 'capsule', 'pill', 'medicine', 'medication', 'drug', 'antibiotic', 'painkiller', 'analgesic', 'pharma', 'pharmacy', 'otc', 'generic'] },
  { key: 'baby', words: ['baby', 'infant', 'diaper', 'nappy', 'nappies', 'feeder'] },
  { key: 'optical', words: ['optical', 'eyewear', 'spectacle', 'glasses', 'sunglasses', 'lens'] },
  { key: 'beauty', words: ['cosmetic', 'beauty', 'makeup', 'make up', 'perfume', 'fragrance', 'nail polish', 'lipstick'] },
  { key: 'hygiene', words: ['hygiene', 'personal care', 'soap', 'shampoo', 'toothpaste', 'oral care', 'sanitary pad', 'deodorant', 'shaving', 'sanitizer'] },
  // Electronics
  { key: 'phone', words: ['mobile', 'phone', 'smartphone', 'cellphone', 'charger'] },
  { key: 'laptop', words: ['laptop', 'computer', 'pc', 'notebook pc', 'desktop'] },
  { key: 'accessories', words: ['keyboard', 'mouse', 'accessory', 'peripheral'] },
  { key: 'audio', words: ['audio', 'headphone', 'earphone', 'earbud', 'speaker', 'handsfree'] },
  { key: 'tv', words: ['tv', 'television', 'led tv', 'lcd', 'display', 'screen'] },
  { key: 'camera', words: ['camera', 'cctv', 'dslr'] },
  { key: 'printer', words: ['printer', 'ink', 'toner', 'cartridge', 'printing'] },
  { key: 'battery', words: ['battery', 'power bank', 'ups', 'inverter', 'solar'] },
  { key: 'storage', words: ['usb', 'storage', 'memory', 'sd card', 'flash'] },
  { key: 'lighting', words: ['light', 'lighting', 'bulb', 'lamp', 'tube light', 'led light'] },
  { key: 'electrical', words: ['electrical', 'electric', 'wire', 'wiring', 'cable', 'switch', 'socket', 'breaker'] },
  // Hardware & home
  { key: 'paint', words: ['paint', 'primer', 'emulsion', 'enamel', 'distemper', 'color', 'colour'] },
  { key: 'plumbing', words: ['sanitary', 'plumbing', 'pipe', 'tap', 'tooti', 'mixer', 'fitting', 'valve'] },
  { key: 'tools', words: ['tool', 'drill', 'spanner', 'screwdriver', 'hand tool', 'power tool'] },
  { key: 'hardware', words: ['hardware', 'nail', 'bolt', 'screw', 'hinge', 'lock', 'iron', 'steel'] },
  { key: 'furniture', words: ['furniture', 'sofa', 'chair', 'table'] },
  { key: 'bedding', words: ['bed', 'bedding', 'mattress', 'pillow', 'bedsheet'] },
  { key: 'garden', words: ['garden', 'plant', 'seed', 'fertilizer', 'fertiliser', 'pot'] },
  { key: 'auto', words: ['auto', 'automobile', 'car', 'motor', 'bike', 'tyre', 'tire', 'spare part'] },
  { key: 'fuel', words: ['fuel', 'petrol', 'diesel', 'lpg', 'cylinder'] },
  // Retail
  { key: 'shoes', words: ['shoe', 'footwear', 'sandal', 'slipper', 'sneaker', 'chappal', 'boot'] },
  { key: 'clothes', words: ['garment', 'cloth', 'clothing', 'apparel', 'fashion', 'shirt', 'kurta', 'dress', 'jeans', 'trouser', 'suit', 'shalwar', 'unstitched', 'lawn'] },
  { key: 'jewellery', words: ['jewellery', 'jewelry', 'jewel', 'gold', 'silver', 'ring', 'bangle', 'necklace'] },
  { key: 'books', words: ['book', 'novel', 'textbook'] },
  { key: 'stationery', words: ['stationery', 'stationary', 'notebook', 'copy', 'register', 'paper', 'file'] },
  { key: 'pen', words: ['pen', 'pencil', 'marker', 'highlighter'] },
  { key: 'toys', words: ['toy', 'game', 'puzzle', 'doll'] },
  { key: 'sport', words: ['sport', 'cricket', 'football', 'hockey', 'badminton'] },
  { key: 'fitness', words: ['fitness', 'gym', 'dumbbell', 'exercise'] },
  { key: 'pets', words: ['pet', 'animal', 'cat', 'dog', 'bird'] },
  { key: 'salon', words: ['salon', 'barber', 'hair', 'parlour', 'parlor'] },
  // Food & drinks
  { key: 'pizza', words: ['pizza'] },
  { key: 'chicken', words: ['chicken', 'wing', 'broast', 'nugget', 'fried'] },
  { key: 'sandwich', words: ['burger', 'sandwich', 'bread', 'toast', 'bun', 'roll', 'wrap', 'shawarma', 'roti', 'naan', 'bakery'] },
  // Grocery staples before rice dishes, so "Atta, Daal & Rice" is grocery
  { key: 'grains', words: ['grocery', 'grain', 'atta', 'flour', 'daal', 'dal', 'pulse', 'spice', 'masala', 'oil', 'ghee', 'dairy', 'milk', 'sugar', 'kiryana', 'kirana'] },
  { key: 'bowl', words: ['rice', 'biryani', 'pulao', 'noodle', 'pasta', 'chinese', 'soup'] },
  { key: 'fish', words: ['fish', 'seafood', 'prawn', 'shrimp'] },
  { key: 'egg', words: ['egg', 'breakfast', 'omelette', 'paratha'] },
  { key: 'fire', words: ['bbq', 'tikka', 'kebab', 'kabab', 'karahi', 'grill', 'spicy', 'handi'] },
  { key: 'cake', words: ['cake', 'dessert', 'sweet', 'mithai', 'ice cream', 'pastry', 'bakery item'] },
  { key: 'cookies', words: ['snack', 'chip', 'crisp', 'biscuit', 'cookie', 'namkeen', 'nimko', 'chocolate', 'candy', 'confectionery'] },
  { key: 'coffee', words: ['tea', 'chai', 'coffee', 'espresso', 'latte'] },
  { key: 'shake', words: ['shake', 'smoothie', 'lassi', 'juice'] },
  { key: 'drink', words: ['drink', 'beverage', 'soft drink', 'cold drink', 'soda', 'water', 'mineral water'] },
  { key: 'fruit', words: ['fruit'] },
  { key: 'veg', words: ['vegetable', 'sabzi', 'salad', 'veggie'] },
  // General
  { key: 'deal', words: ['deal', 'combo', 'offer', 'discount', 'sale', 'bundle'] },
  { key: 'star', words: ['special', 'chef', 'signature', 'premium'] },
  { key: 'leaf', words: ['healthy', 'organic', 'vegan', 'vegetarian', 'diet'] },
  { key: 'gift', words: ['gift', 'hamper'] },
  { key: 'box', words: ['general', 'misc', 'miscellaneous', 'other', 'others'] },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole words, allowing simple plurals: "tablet" matches "Tablets", "brush" matches "brushes"
const COMPILED = RULES.map((r) => ({
  key: r.key,
  re: new RegExp(`(^|[^a-z])(${r.words.map((w) => escapeRe(w).replace(/ /g, '[\\s\\-&_]+')).join('|')})(s|es)?(?=$|[^a-z])`, 'i'),
}));

/** Icon key for a category / product name, or null when no rule matches. */
export function matchCategoryIconKey(text: string): string | null {
  const t = (text || '').toLowerCase();
  if (!t.trim()) return null;
  for (const r of COMPILED) if (r.re.test(t)) return r.key;
  return null;
}

/** Icon key to use: saved key if valid, else from the name, else the business-type default. */
export function resolveCategoryIconKey(name: string, savedKey?: string | null, module?: string | null): string {
  if (savedKey && ICON_BY_KEY.has(savedKey)) return savedKey;
  return matchCategoryIconKey(name) || (module === 'fastfood' ? 'food' : 'bag');
}

/** Render the icon for a key (falls back to the shopping bag). */
export function CategoryGlyph({ iconKey, size, color }: { iconKey: string; size: number; color?: string }): React.JSX.Element {
  const Icon = ICON_BY_KEY.get(iconKey) || ShoppingBag24Regular;
  return <Icon style={{ width: size, height: size, flexShrink: 0, ...(color ? { color } : {}) }} />;
}
