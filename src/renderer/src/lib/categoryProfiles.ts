import { CategoryProfile, ModuleKey } from './types';

export interface CategoryProfileConfig {
  key: CategoryProfile;
  label: string;
  shortTag: string;
  description: string;
  icon: string;
  defaultItemRole: 'food_menu' | 'retail_product' | 'raw_ingredient';
  isKitchenRouted: boolean;
  suggestedSizes: string[];
  suggestedUnits: string[];
  allowDecimals: boolean;
  accentColor: string;
  defaultCategories: string[];
}

export const CATEGORY_PROFILES: Record<CategoryProfile, CategoryProfileConfig> = {
  footwear: {
    key: 'footwear',
    label: 'Footwear & Shoes Store',
    shortTag: 'Shoes',
    description: 'Shoes, boots, sneakers, sandals, and slippers with shoe size matrix (38 - 45)',
    icon: 'Footprints',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    suggestedUnits: ['PAIR', 'PCS', 'BOX', 'PACK', 'DOZEN', 'SET'],
    allowDecimals: false,
    accentColor: '#EC4899',
    defaultCategories: [
      'Formal Shoes',
      'Sneakers & Joggers',
      'Slippers & Chappal',
      'Sandals & Peshawari',
      'Boots & High Tops',
      'Kids Footwear',
    ],
  },
  apparel: {
    key: 'apparel',
    label: 'Garments, Clothing & Boutique',
    shortTag: 'Clothing',
    description: 'Shirts, pants, suits, kurtas, and garments with size matrix (XS - 3XL) and fabric units',
    icon: 'Shirt',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    suggestedUnits: ['PCS', 'SUIT', 'METER', 'GAZ', 'THAN', 'SET', 'PACK', 'DOZEN', 'PAIR', 'BOX'],
    allowDecimals: false,
    accentColor: '#8B5CF6',
    defaultCategories: [
      'Gents Kurta & Shalwar Kameez',
      'Casual Shirts & Polos',
      'Trousers, Jeans & Pants',
      'Ladies Unstitched Suits',
      'Ladies Ready-to-Wear (Pret)',
      'Kids Wear',
      'Jackets & Winter Wear',
    ],
  },
  grocery: {
    key: 'grocery',
    label: 'Grocery, Supermarket & Mini Mart',
    shortTag: 'Grocery',
    description: 'Barcode scanning POS with weighed loose items (KG, Grams) and FMCG packaged goods',
    icon: 'ShoppingBag',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['250g', '500g', '1 KG', '5 KG'],
    suggestedUnits: ['KG', 'GRAM', 'LITER', 'ML', 'PCS', 'PACK', 'BOX', 'CARTON', 'BAG', 'DOZEN', 'BOTTLE', 'JAR', 'TIN', 'SACHET', 'TRAY', 'BUNDLE'],
    allowDecimals: true,
    accentColor: '#059669',
    defaultCategories: [
      'Beverages & Cold Drinks',
      'Snacks, Chips & Biscuits',
      'Dairy, Milk & Eggs',
      'Staples, Rice, Flour & Daal',
      'Cooking Oil & Banaspati Ghee',
      'Household & Cleaning',
      'Spices & Condiments',
    ],
  },
  cosmetics: {
    key: 'cosmetics',
    label: 'Cosmetics & Beauty Store',
    shortTag: 'Cosmetics',
    description: 'Beauty products with shade color numbers (#01, #08) and bottle volume sizes',
    icon: 'Palette',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['#01 Red', '#08 Nude', '#14 Maroon', '#22 Gold', '50ml', '100ml', '250ml'],
    suggestedUnits: ['PCS', 'PACK', 'BOTTLE', 'SET', 'KIT', 'TUBE', 'JAR', 'BOX', 'DOZEN', 'ML', 'Gram', 'STRIP'],
    allowDecimals: false,
    accentColor: '#D946EF',
    defaultCategories: [
      'Lipsticks & Lip Gloss',
      'Foundations & Face Powders',
      'Skin Care, Creams & Serums',
      'Eye Makeup & Mascara',
      'Perfumes & Body Mists',
      'Hair Care & Shampoos',
      'Nail Polishes & Nail Care',
    ],
  },
  pharmacy: {
    key: 'pharmacy',
    label: 'Pharmacy & Medical Store',
    shortTag: 'Pharmacy',
    description: 'Medicines with strip/box/tablet division, batch numbers and expiry tracking',
    icon: 'HeartPulse',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['Strip (10 Tablets)', 'Box (100 Tablets)', '60ml', '120ml'],
    suggestedUnits: ['STRIP', 'BOX', 'TABLET', 'CAPSULE', 'SYRUP', 'BOTTLE', 'TUBE', 'SACHET', 'VIAL', 'AMPOULE', 'PACK', 'ROLL', 'BAG', 'PCS'],
    allowDecimals: false,
    accentColor: '#0284C7',
    defaultCategories: [
      'Tablets & Capsules',
      'Syrups & Suspensions',
      'Injections & Infusions',
      'Ointments & Topical Drops',
      'Medical Devices & Surgicals',
      'Baby Food & Diapers',
    ],
  },
  electronics: {
    key: 'electronics',
    label: 'Mobile, Electronics & Accessories',
    shortTag: 'Electronics',
    description: 'Smartphones and electronics with unique IMEI/Serial numbers and warranty tracking',
    icon: 'Smartphone',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['64GB', '128GB', '256GB', '512GB'],
    suggestedUnits: ['PCS', 'SET', 'BOX', 'PACK', 'PAIR', 'KIT', 'METER', 'ROLL'],
    allowDecimals: false,
    accentColor: '#3B82F6',
    defaultCategories: [
      'Smartphones & Handsets',
      'Chargers, Adapters & Cables',
      'Wireless Earbuds & Audio',
      'Screen Protectors & Glass',
      'Mobile Covers & Pouches',
      'Power Banks & Batteries',
    ],
  },
  bakery: {
    key: 'bakery',
    label: 'Bakery & Sweets / Confectionery',
    shortTag: 'Bakery',
    description: 'Fresh confectionery and traditional sweets sold by box / weight (250g, 500g, 1 KG)',
    icon: 'Cake',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['250g', '500g', '1 KG', '2 KG'],
    suggestedUnits: ['KG', 'GRAM', 'POUND', 'DABBA', 'BOX', 'PCS', 'DOZEN', 'PACK', 'TRAY'],
    allowDecimals: true,
    accentColor: '#F59E0B',
    defaultCategories: [
      'Traditional Sweets & Mithai',
      'Cakes, Pastries & Desserts',
      'Bakery Biscuits & Cookies',
      'Fresh Breads, Rusk & Buns',
      'Savories, Samosa & Nimko',
    ],
  },
  food: {
    key: 'food',
    label: 'Fast Food, Cafe & Restaurant',
    shortTag: 'Fast Food',
    description: 'Food and kitchen menu with KDS ticket dispatch, portion sizes and deal combos',
    icon: 'Utensils',
    defaultItemRole: 'food_menu',
    isKitchenRouted: true,
    suggestedSizes: ['Regular', 'Small', 'Medium', 'Large', 'Family', 'Half', 'Full'],
    suggestedUnits: ['PCS', 'SERVING', 'PORTION', 'PLATE', 'DEAL', 'PACK', 'CUP', 'GLASS', 'BOTTLE', 'CAN', 'KG', 'BOX'],
    allowDecimals: false,
    accentColor: '#E51937',
    defaultCategories: [
      'Burgers & Sandwiches',
      'Pizzas & Calzones',
      'Crispy Broast & Wings',
      'Karahi, Handi & Gravies',
      'BBQ, Tikka & Kebabs',
      'Cold Beverages & Shakes',
      'Family Deals & Combos',
    ],
  },
  hardware: {
    key: 'hardware',
    label: 'Hardware, Sanitary & Paint Store',
    shortTag: 'Hardware',
    description: 'Building materials, paints, plumbing, sanitary fittings, fasteners and tools',
    icon: 'Wrench',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['1/2" (20mm)', '3/4" (25mm)', '1" (32mm)', '1.5" (50mm)', '2" (63mm)', 'Per Foot', '10 Feet Length', '13 Feet Length', 'Quarter (1L)', 'Gallon (4L)', 'Balti (16L)', '0.5 KG', '1.0 KG'],
    suggestedUnits: ['PCS', 'SET', 'FEET', 'LENGTH', 'RFT', 'INCH', 'ROLL', 'TUBE', 'PACK', 'BOX', 'BAG', 'DOZEN', 'PAIR', 'METER', 'KG', 'COIL', 'SHEET', 'GALLON', 'QUARTER', 'BALTI'],
    allowDecimals: true,
    accentColor: '#D97706',
    defaultCategories: [
      'Sanitary Fittings & Bathroom Pipes',
      'Paints, Distemper & Coatings',
      'Fasteners, Screws & Nails',
      'Hand Tools & Power Equipment',
      'Locks, Handles & Security',
    ],
  },
  electric: {
    key: 'electric',
    label: 'Electrical Store & Lighting',
    shortTag: 'Electrical',
    description: 'Electrical cables, switches, sockets, LED lights, breakers, conduits and appliances',
    icon: 'Zap',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: ['1.5mm', '2.5mm', '7/29', '7/36', '7/44', '9W', '12W', '18W'],
    suggestedUnits: ['COIL', 'METER', 'FEET', 'LENGTH', 'ROLL', 'PCS', 'SET', 'PACK', 'BOX', 'DOZEN', 'PAIR', 'GAZ'],
    allowDecimals: true,
    accentColor: '#EAB308',
    defaultCategories: [
      'Electrical Cables & Flexible Wires',
      'Switches, Sockets & Face Plates',
      'LED Lights, Bulbs & Panels',
      'Circuit Breakers & DB Distribution Boxes',
      'PVC Conduit Pipes & Fittings',
      'Ceiling & Exhaust Fans',
      'Extension Boards & Power Strips',
    ],
  },
  standard: {
    key: 'standard',
    label: 'Standard Retail (General / Mart)',
    shortTag: 'Standard',
    description: 'Packaged goods, supermarket items, and general retail',
    icon: 'Package',
    defaultItemRole: 'retail_product',
    isKitchenRouted: false,
    suggestedSizes: [],
    suggestedUnits: ['PCS', 'PACK', 'BOX', 'CARTON', 'DOZEN', 'PAIR', 'SET', 'KG', 'GRAM', 'LITER', 'BOTTLE', 'BAG', 'ROLL', 'METER', 'BUNDLE'],
    allowDecimals: false,
    accentColor: '#64748B',
    defaultCategories: ['General Items', 'Packaged Goods'],
  },
};

/**
 * Automatically infers the category profile if not explicitly chosen.
 * Intelligently matches category keywords to the proper industry vertical.
 */
export function detectCategoryProfile(categoryName: string, explicitProfile?: CategoryProfile): CategoryProfile {
  if (explicitProfile && explicitProfile !== 'standard') {
    return explicitProfile;
  }

  const name = categoryName.toLowerCase().trim();

  // 1. Footwear / Shoes keywords
  if (
    /(shoe|boot|sneaker|sandal|chappal|jogger|heel|slipper|footwear|khussa|kheri|peshawari|loafer|slide)/i.test(
      name
    )
  ) {
    return 'footwear';
  }

  // 2. Apparel / Clothes keywords
  if (
    /(shirt|cloth|dress|garment|apparel|pant|jeans|suit|kurta|hoodie|jacket|trouser|t-shirt|polo|kamiz|shalwar|coat|fabric|lawn|cotton|boski|pret|stitched|unstitched)/i.test(
      name
    )
  ) {
    return 'apparel';
  }

  // 3. Cosmetics / Beauty keywords
  if (
    /(cosmetic|lipstick|gloss|cream|lotion|foundation|powder|perfume|serum|makeup|eyeliner|mascara|shade|shampoo|soap|beauty|nail|scent)/i.test(
      name
    )
  ) {
    return 'cosmetics';
  }

  // 4. Pharmacy / Medicine keywords
  if (
    /(pharma|tablet|capsule|syrup|medicine|injection|drop|dawa|medical|surgical|bandage|panadol|antibiotic|ointment|pharma|drip)/i.test(
      name
    )
  ) {
    return 'pharmacy';
  }

  // 5. Electronics / Mobile keywords
  if (
    /(mobile|phone|charger|adapter|earbud|headphone|battery|electronics|smartphone|case|protector|screen|gadget|bluetooth|powerbank)/i.test(
      name
    )
  ) {
    return 'electronics';
  }

  // 6. Bakery / Sweets / Mithai keywords
  if (
    /(bakery|mithai|sweet|cake|pastry|biscuit|cookie|bread|rusk|bun|nimko|samosa|jalebi|barfi|gulab jamun|halwa|patties)/i.test(
      name
    )
  ) {
    return 'bakery';
  }

  // 7. Electrical & Lighting keywords
  if (
    /(electric|cable|wire|switch|socket|breaker|bulb|led|panel|light|lighting|fan|choke|conduit|db box|extension board)/i.test(
      name
    )
  ) {
    return 'electric';
  }

  // 8. Hardware, Sanitary & Paint keywords
  if (
    /(hardware|iron|steel|pipe|paint|distemper|cement|sanitary|keel|nail|screw|nut|thinner|varnish|tap|basin|valve|fitting|tool|lock|handle|shower|shover|toti|tooti|faucet|pvc|pprc|cpvc|cock)/i.test(
      name
    )
  ) {
    return 'hardware';
  }

  // 9. Food / Restaurant keywords
  if (
    /(food|burger|pizza|sandwich|shawarma|beverage|drink|snack|roll|platter|karahi|bbq|handi|broast|tikka|biryani|chai|tea|coffee|fries|deal|combo)/i.test(
      name
    )
  ) {
    return 'food';
  }

  // 10. Grocery / Supermarket keywords
  if (
    /(grocery|mart|flour|atta|rice|chawal|oil|ghee|sugar|cheeni|daal|pulse|masala|spice|cleaning|detergent|surf|soap|staple|supermarket)/i.test(
      name
    )
  ) {
    return 'grocery';
  }

  return explicitProfile || 'standard';
}

export interface DefaultCategoryItem {
  name: string;
  profile: CategoryProfile | string;
  module?: ModuleKey;
}

export interface BusinessCategoryTemplate {
  name: string;
  profile: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  iconName: string;
  module: 'fastfood' | 'minimart';
  description: string;
  suggestedUnits: string[];
  suggestedSizes: string[];
  defaultCategories: BusinessCategoryTemplate[];
  features?: {
    hasKitchenKDS?: boolean;
    hasWeighingScale?: boolean;
    hasImeiSerial?: boolean;
    hasBatchExpiry?: boolean;
    hasColorShades?: boolean;
    hasPipeDecimals?: boolean;
  };
}
export interface ShoeSizePreset {
  id: 'kids' | 'baby' | 'mens' | 'youth' | 'ladies';
  name: string;
  badge: string;
  rangeText: string;
  categoryMatch?: RegExp;
  sizes: string[];
}

export const SHOE_SIZE_PRESETS: ShoeSizePreset[] = [
  {
    id: 'kids',
    name: 'Kids / Children',
    badge: 'Sizes 6 - 11',
    rangeText: '6 - 11',
    categoryMatch: /(kid|child|bach)/i,
    sizes: ['6', '7', '8', '9', '10', '11'],
  },
  {
    id: 'baby',
    name: 'Baby / Toddler',
    badge: 'Sizes 0 - 5',
    rangeText: '0 - 5',
    categoryMatch: /(baby|infant|toddler|chot)/i,
    sizes: ['0', '1', '2', '3', '4', '5'],
  },
  {
    id: 'mens',
    name: "Men's / Gents",
    badge: 'Sizes 39 - 44 / 45',
    rangeText: '39 - 45',
    categoryMatch: /(men|gent|formal|jogger|boot|peshawari|leather)/i,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
  },
  {
    id: 'youth',
    name: 'Youth / Boys & Girls',
    badge: 'Sizes 31 - 36',
    rangeText: '31 - 36',
    categoryMatch: /(youth|teen)/i,
    sizes: ['31', '32', '33', '34', '35', '36'],
  },
  {
    id: 'ladies',
    name: "Women's / Ladies",
    badge: 'Sizes 36 - 41',
    rangeText: '36 - 41',
    categoryMatch: /(lad|women|female|aurat|heel)/i,
    sizes: ['36', '37', '38', '39', '40', '41'],
  },
];

export function getShoePresetForCategory(categoryName: string): ShoeSizePreset {
  const name = (categoryName || '').toLowerCase().trim();
  for (const preset of SHOE_SIZE_PRESETS) {
    if (preset.categoryMatch && preset.categoryMatch.test(name)) {
      return preset;
    }
  }
  return SHOE_SIZE_PRESETS[2]; // Default to Men's
}

/**
 * Returns only the shoe size presets applicable to the given footwear category.
 * - Kids Footwear: Kids (6-11), Baby (0-5), Youth (31-36) (strictly no Men/Ladies)
 * - Ladies Footwear: Women's / Ladies (36-41)
 * - Men's / Gents Footwear: Men's / Gents (39-45)
 */
export function getAvailableShoePresetsForCategory(categoryName: string): ShoeSizePreset[] {
  const name = (categoryName || '').toLowerCase().trim();

  // 1. Kids / Children / Baby / Toddler / Youth
  if (/(kid|child|baby|infant|toddler|youth|teen|bach)/i.test(name)) {
    return SHOE_SIZE_PRESETS.filter((p) => p.id === 'kids' || p.id === 'baby' || p.id === 'youth');
  }

  // 2. Women's / Ladies
  if (/(lad|women|female|aurat|heel|girl)/i.test(name)) {
    return SHOE_SIZE_PRESETS.filter((p) => p.id === 'ladies');
  }

  // 3. Men's / Adult / Gents (Formal Shoes, Sneakers, Chappal, Peshawari, Boots, etc.)
  return SHOE_SIZE_PRESETS.filter((p) => p.id === 'mens');
}

export interface ItemTypeOption {
  id: string;
  name: string;
  shortLabel?: string;
  iconName?: string;
  suggestedUnits: string[];
  defaultUnit: string;
  recommendedPricingType: string;
  placeholderName: string;
  keywordMatch: RegExp;
}

export const isSanitaryCategory = (catName: string): boolean => {
  return /(sanitary|bathroom|pipe|pip|tap|toti|tooti|shower|shover|faucet|basin|commode|fitting|plumb|valve|cock|waste|coupling|elbow|tee|socket|union|nipple|pvc|pprc|cpvc|gi pipe)/i.test(catName || '');
};

/**
 * Returns specific item types / subcategories for a given category & profile.
 * Allows the user to select e.g. Toti vs Shower vs Pipe vs Fittings,
 * which immediately narrows down the suggested measurement units, default unit, and pricing type!
 */
export function getItemTypesForCategory(categoryName: string, profile: CategoryProfile): ItemTypeOption[] {
  const cat = (categoryName || '').toLowerCase().trim();

  // 1. Sanitary & Bathroom Pipes
  if (isSanitaryCategory(cat)) {
    return [
      {
        id: 'san_toti',
        name: 'Totiyan & Taps (Bib Cocks)',
        shortLabel: 'Totiyan / Taps',
        iconName: 'Droplets',
        suggestedUnits: ['PCS', 'PAIR', 'DOZEN', 'SET', 'BOX'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_bath_sets',
        placeholderName: 'e.g. Master Chrome Double Bib Cock Toti / Single Toti / Basin Mixer',
        keywordMatch: /(toti|tooti|tap|bibcock|bib cock|cock|mixer|faucet)/i,
      },
      {
        id: 'san_shower',
        name: 'Showers & Muslim Showers',
        shortLabel: 'Showers',
        iconName: 'Droplets',
        suggestedUnits: ['PCS', 'SET', 'PACK', 'BOX'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_bath_sets',
        placeholderName: 'e.g. Master Muslim Shower / Rainfall Shower Head 8" / Shower Arm',
        keywordMatch: /(shower|shover|muslim shower)/i,
      },
      {
        id: 'san_pipe',
        name: 'Bathroom & Plumbing Pipes',
        shortLabel: 'Pipes',
        iconName: 'Ruler',
        suggestedUnits: ['FEET', 'LENGTH', 'RFT', 'METER', 'INCH'],
        defaultUnit: 'FEET',
        recommendedPricingType: 'retail_pipe_lengths',
        placeholderName: 'e.g. PPRC Hot & Cold Water Pipe 25mm / UPVC Drainage Pipe 3"',
        keywordMatch: /(pipe|pip|conduit|gi pipe)/i,
      },
      {
        id: 'san_fitting',
        name: 'Pipe Fittings & Valves',
        shortLabel: 'Fittings & Valves',
        iconName: 'Wrench',
        suggestedUnits: ['PCS', 'PACK', 'DOZEN', 'BOX'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_sanitary_sizes',
        placeholderName: 'e.g. PPRC Elbow 90° 25mm / UPVC Tee 3" / Brass Ball Valve 1/2"',
        keywordMatch: /(fitting|elbow|tee|socket|union|nipple|valve|bend|coupling|waste|trap)/i,
      },
      {
        id: 'san_sealant',
        name: 'Teflon Tape & Sealants',
        shortLabel: 'Teflon / Sealants',
        iconName: 'Package',
        suggestedUnits: ['ROLL', 'TUBE', 'PACK', 'PCS'],
        defaultUnit: 'ROLL',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Teflon Tape Roll (Dhaaga Tape) / Silicon Sealant Tube / PVC Solution',
        keywordMatch: /(teflon|solution|silicone|sealant|cement|tape)/i,
      },
    ];
  }

  // 2. Hardware & Paint
  if (profile === 'hardware' || /paint|distemper|hardware|fastener|cement|tool|lock/i.test(cat)) {
    return [
      {
        id: 'hw_paint',
        name: 'Paints & Distempers',
        shortLabel: 'Paints',
        iconName: 'Palette',
        suggestedUnits: ['GALLON', 'QUARTER', 'BALTI', 'LITER', 'KG', 'PCS'],
        defaultUnit: 'GALLON',
        recommendedPricingType: 'retail_paint',
        placeholderName: 'e.g. Berger Weathercoat / Nippon Matt Enamel / Distemper',
        keywordMatch: /(paint|distemper|color|coating|varnish|thinner|emulsion)/i,
      },
      {
        id: 'hw_fasteners',
        name: 'Fasteners, Screws & Keel',
        shortLabel: 'Fasteners / Keel',
        iconName: 'Wrench',
        suggestedUnits: ['KG', 'PACK', 'BOX', 'DOZEN', 'PCS'],
        defaultUnit: 'KG',
        recommendedPricingType: 'perkg',
        placeholderName: 'e.g. Gypsum Screws 1.5" / Steel Concrete Nails / Wood Screws',
        keywordMatch: /(keel|nail|screw|fastener|nut|bolt|washer)/i,
      },
      {
        id: 'hw_cement',
        name: 'Cement & Building Material',
        shortLabel: 'Cement / Building',
        iconName: 'Package',
        suggestedUnits: ['BAG', 'KG', 'BORI'],
        defaultUnit: 'BAG',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Falcon White Cement 40 KG / Plaster of Paris / Tile Bond',
        keywordMatch: /(cement|plaster|bond|sand|concrete|bori)/i,
      },
      {
        id: 'hw_tools',
        name: 'Tools, Locks & Equipment',
        shortLabel: 'Tools & Locks',
        iconName: 'Wrench',
        suggestedUnits: ['PCS', 'SET', 'BOX'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Pipe Wrench 14" / Claw Hammer / Main Door Handle Lock',
        keywordMatch: /(tool|wrench|hammer|lock|handle|drill|plier|cutter)/i,
      },
    ];
  }

  // 3. Garments, Clothing & Boutique
  if (profile === 'apparel' || /garment|cloth|kurta|fabric|shirt|pant|boutique/i.test(cat)) {
    return [
      {
        id: 'gar_stitched',
        name: 'Stitched Garments / Kurta (Pret)',
        shortLabel: 'Stitched Garments',
        iconName: 'Shirt',
        suggestedUnits: ['PCS', 'SUIT', 'PACK', 'DOZEN'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_garments',
        placeholderName: 'e.g. Pure Cotton Men Kurta / Gents Shalwar Kameez / Casual Shirt',
        keywordMatch: /(kurta|shirt|pant|trouser|kameez|suit|garment|pret|stitched|polo|t-shirt)/i,
      },
      {
        id: 'gar_unstitched',
        name: 'Unstitched Fabric / Than / Gaz',
        shortLabel: 'Fabric (Than / Gaz)',
        iconName: 'Ruler',
        suggestedUnits: ['METER', 'GAZ', 'THAN', 'SUIT'],
        defaultUnit: 'METER',
        recommendedPricingType: 'retail_fabric',
        placeholderName: 'e.g. Lawn Fabric 3-Piece / Boski Than / Cotton Wash-n-Wear 4m',
        keywordMatch: /(fabric|than|unstitched|cloth|kapra|lawn|cotton|boski|silk|linen)/i,
      },
      {
        id: 'gar_accessories',
        name: 'Socks, Undergarments & Ties',
        shortLabel: 'Accessories / Socks',
        iconName: 'Package',
        suggestedUnits: ['PAIR', 'PACK', 'DOZEN', 'BOX', 'PCS'],
        defaultUnit: 'PAIR',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Cotton Socks 3-Pair Pack / Gents Vest / Silk Tie Set',
        keywordMatch: /(sock|glove|undergarment|vest|brief|tie|handkerchief|belt|accessory)/i,
      },
    ];
  }

  // 4. Electrical Store & Lighting
  if (profile === 'electric' || /electric|cable|wire|bulb|light|fan|switch/i.test(cat)) {
    return [
      {
        id: 'elec_wire',
        name: 'Wires & Cables (Coil / Meter)',
        shortLabel: 'Wires & Cables',
        iconName: 'Zap',
        suggestedUnits: ['COIL', 'METER', 'FEET', 'GAZ'],
        defaultUnit: 'COIL',
        recommendedPricingType: 'retail_wire',
        placeholderName: 'e.g. Pakistan Cables 7/29 Copper / Flexible Wire 2.5mm / 90m Coil',
        keywordMatch: /(cable|wire|coil|7\/29|7\/36|7\/44|1\.5mm|2\.5mm)/i,
      },
      {
        id: 'elec_led',
        name: 'LED Bulbs & Panels (Wattage)',
        shortLabel: 'LED Bulbs & Lights',
        iconName: 'Zap',
        suggestedUnits: ['PCS', 'PACK', 'BOX', 'DOZEN'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_wattage',
        placeholderName: 'e.g. EcoStar 12W LED Bulb / SMD Downlight 18W / Panel 24W',
        keywordMatch: /(led|bulb|light|watt|panel|smd|lamp|spotlight)/i,
      },
      {
        id: 'elec_conduit',
        name: 'PVC Conduit Pipes & Fittings',
        shortLabel: 'Conduit Pipes',
        iconName: 'Ruler',
        suggestedUnits: ['LENGTH', 'FEET', 'PCS', 'PACK'],
        defaultUnit: 'LENGTH',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Popular PVC Electric Conduit 10ft Length / Conduit Bend 25mm',
        keywordMatch: /(conduit|pvc pipe|duct|casing)/i,
      },
      {
        id: 'elec_switches',
        name: 'Switches, Sockets & Breakers',
        shortLabel: 'Switches & Breakers',
        iconName: 'Zap',
        suggestedUnits: ['PCS', 'PACK', 'BOX', 'DOZEN'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Clipsal 1-Gang Light Switch / Power Plug 13A / Circuit Breaker 32A',
        keywordMatch: /(switch|socket|breaker|db|distribution|plug|face plate)/i,
      },
      {
        id: 'elec_fans',
        name: 'Fans & Appliances',
        shortLabel: 'Fans & Appliances',
        iconName: 'Zap',
        suggestedUnits: ['PCS', 'SET'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Pak Fan Deluxe 56" / Exhaust Fan 10" / Extension Board',
        keywordMatch: /(fan|heater|iron|exhaust|appliance|board)/i,
      },
    ];
  }

  // 5. Pharmacy & Medical Store
  if (profile === 'pharmacy' || /pharma|medicine|tablet|syrup|surgical/i.test(cat)) {
    return [
      {
        id: 'pharma_tablets',
        name: 'Tablets & Capsules (Strip / Box)',
        shortLabel: 'Tablets / Capsules',
        iconName: 'HeartPulse',
        suggestedUnits: ['STRIP', 'BOX', 'TABLET', 'CAPSULE'],
        defaultUnit: 'STRIP',
        recommendedPricingType: 'retail_pharma_strip',
        placeholderName: 'e.g. Panadol Extra 500mg (Strip 10 Tabs) / Augmentin 625mg',
        keywordMatch: /(tablet|capsule|strip|pill|cap|tab)/i,
      },
      {
        id: 'pharma_syrups',
        name: 'Syrups, Drops & Suspensions',
        shortLabel: 'Syrups & Suspensions',
        iconName: 'Droplets',
        suggestedUnits: ['SYRUP', 'BOTTLE', 'ML'],
        defaultUnit: 'SYRUP',
        recommendedPricingType: 'retail_pharma_syrup',
        placeholderName: 'e.g. Calpol Suspension 120ml / Hydryllin Cough Syrup 120ml',
        keywordMatch: /(syrup|suspension|liquid|drop|solution)/i,
      },
      {
        id: 'pharma_injections',
        name: 'Injections & IV Drips',
        shortLabel: 'Injections & Drips',
        iconName: 'HeartPulse',
        suggestedUnits: ['VIAL', 'AMPOULE', 'BAG', 'PCS'],
        defaultUnit: 'VIAL',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Dextrose 5% 1000ml Infusion Bag / Diclogesic Ampoule',
        keywordMatch: /(injection|vial|ampoule|drip|infusion|iv)/i,
      },
      {
        id: 'pharma_ointments',
        name: 'Ointments, Creams & Gels',
        shortLabel: 'Ointments & Creams',
        iconName: 'HeartPulse',
        suggestedUnits: ['TUBE', 'JAR', 'PCS'],
        defaultUnit: 'TUBE',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Polyfax Skin Ointment 20g / Voltral Pain Gel',
        keywordMatch: /(ointment|cream|gel|balm|tube)/i,
      },
      {
        id: 'pharma_surgicals',
        name: 'Bandages, Diapers & Surgicals',
        shortLabel: 'Bandages & Diapers',
        iconName: 'HeartPulse',
        suggestedUnits: ['PACK', 'ROLL', 'PCS', 'BOX'],
        defaultUnit: 'PACK',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Crepe Bandage 4" / Pampers Baby Diapers Large / BD Syringe 5ml',
        keywordMatch: /(bandage|cotton|diaper|syringe|surgical|mask|gauge|cannula)/i,
      },
    ];
  }

  // 6. Grocery, Supermarket & Mini Mart
  if (profile === 'grocery' || /grocery|supermarket|mart|flour|rice|oil/i.test(cat)) {
    return [
      {
        id: 'groc_loose',
        name: 'Loose Grains, Rice, Flour & Daal',
        shortLabel: 'Loose Grains (Per KG)',
        iconName: 'Scale',
        suggestedUnits: ['KG', 'GRAM', 'BAG'],
        defaultUnit: 'KG',
        recommendedPricingType: 'perkg',
        placeholderName: 'e.g. Super Basmati Rice / Daal Chana / Chakki Atta',
        keywordMatch: /(rice|chawal|atta|flour|daal|pulse|sugar|cheeni|spice|masala|loose)/i,
      },
      {
        id: 'groc_packaged',
        name: 'Packaged FMCG, Biscuits & Snacks',
        shortLabel: 'Packaged Snacks / FMCG',
        iconName: 'Package',
        suggestedUnits: ['PCS', 'PACK', 'BOX', 'CARTON', 'DOZEN'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_packs',
        placeholderName: 'e.g. Lays Masala Chips / Sooper Biscuit Pack / Lux Soap',
        keywordMatch: /(snack|chip|biscuit|soap|shampoo|toothpaste|detergent|surf)/i,
      },
      {
        id: 'groc_oil',
        name: 'Cooking Oil, Ghee & Drinks',
        shortLabel: 'Cooking Oil & Drinks',
        iconName: 'Droplets',
        suggestedUnits: ['LITER', 'BOTTLE', 'CAN', 'TIN', 'CARTON', 'ML'],
        defaultUnit: 'LITER',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Dalda Cooking Oil 5L Bottle / Habib Banaspati Ghee 1 KG',
        keywordMatch: /(oil|ghee|banaspati|beverage|drink|juice|soda|cola)/i,
      },
      {
        id: 'groc_dairy',
        name: 'Dairy, Eggs & Fresh Produce',
        shortLabel: 'Dairy & Eggs',
        iconName: 'Package',
        suggestedUnits: ['DOZEN', 'TRAY', 'PCS', 'KG', 'PACK'],
        defaultUnit: 'DOZEN',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Farm Fresh Eggs (Dozen) / Olpers Milk 1L / Bread Large',
        keywordMatch: /(egg|ande|milk|doodh|yogurt|dahi|butter|cheese|dairy)/i,
      },
    ];
  }

  // 7. Bakery & Sweets
  if (profile === 'bakery' || /bakery|mithai|sweet|cake/i.test(cat)) {
    return [
      {
        id: 'bak_cakes',
        name: 'Cakes & Fresh Pastries',
        shortLabel: 'Cakes & Pastries',
        iconName: 'Cake',
        suggestedUnits: ['POUND', 'PCS'],
        defaultUnit: 'POUND',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Belgium Chocolate Fudge Cake (2 Pound) / Pineapple Pastry',
        keywordMatch: /(cake|pastry|fudge|cheesecake)/i,
      },
      {
        id: 'bak_sweets',
        name: 'Traditional Sweets & Mithai',
        shortLabel: 'Mithai & Sweets',
        iconName: 'Cake',
        suggestedUnits: ['KG', 'GRAM', 'DABBA', 'BOX', 'TRAY'],
        defaultUnit: 'KG',
        recommendedPricingType: 'retail_bakery',
        placeholderName: 'e.g. Gulab Jamun / Special Barfi / Mixed Mithai Dabba 1 KG',
        keywordMatch: /(mithai|sweet|halwa|barfi|gulab jamun|jalebi|laddu)/i,
      },
      {
        id: 'bak_biscuits',
        name: 'Fresh Breads, Rusk & Biscuits',
        shortLabel: 'Breads & Biscuits',
        iconName: 'Cake',
        suggestedUnits: ['PACK', 'PCS', 'DOZEN', 'KG'],
        defaultUnit: 'PACK',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Fresh Rusk (Gol Papay) / Almond Bakery Biscuits / Chicken Patty',
        keywordMatch: /(bread|rusk|biscuit|cookie|patty|samosa|nimko|bun)/i,
      },
    ];
  }

  // 8. Cosmetics & Beauty
  if (profile === 'cosmetics' || /cosmetic|beauty|makeup|lipstick/i.test(cat)) {
    return [
      {
        id: 'cos_shades',
        name: 'Lipsticks, Nail Colors & Shades',
        shortLabel: 'Lipsticks & Shades',
        iconName: 'Sparkles',
        suggestedUnits: ['PCS', 'SET', 'DOZEN'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_shades',
        placeholderName: 'e.g. Medora Matte Lipstick #201 / Golden Rose Nail Enamel',
        keywordMatch: /(lipstick|lip|gloss|nail|polish|shade|color)/i,
      },
      {
        id: 'cos_volumes',
        name: 'Lotions, Shampoos & Creams',
        shortLabel: 'Lotions & Creams',
        iconName: 'Droplets',
        suggestedUnits: ['BOTTLE', 'TUBE', 'JAR', 'ML', 'Gram'],
        defaultUnit: 'BOTTLE',
        recommendedPricingType: 'retail_volumes',
        placeholderName: 'e.g. Pond\'s Face Wash 100g / Nivea Body Lotion 250ml',
        keywordMatch: /(lotion|shampoo|cream|serum|facewash|bottle|volume)/i,
      },
      {
        id: 'cos_kits',
        name: 'Facial Kits, Perfumes & Sets',
        shortLabel: 'Kits & Perfumes',
        iconName: 'Sparkles',
        suggestedUnits: ['KIT', 'SET', 'BOX', 'BOTTLE'],
        defaultUnit: 'KIT',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Dermacos 7-Step Facial Kit / J. Pour Femme Perfume 100ml',
        keywordMatch: /(kit|perfume|scent|makeup kit|set)/i,
      },
    ];
  }

  // 9. Footwear & Shoes
  if (profile === 'footwear' || /shoe|footwear|jogger|chappal/i.test(cat)) {
    return [
      {
        id: 'foot_shoes',
        name: 'Shoes, Joggers, Boots & Chappal',
        shortLabel: 'Shoes / Footwear',
        iconName: 'Footprints',
        suggestedUnits: ['PAIR', 'PCS', 'BOX', 'DOZEN'],
        defaultUnit: 'PAIR',
        recommendedPricingType: 'retail_shoes',
        placeholderName: 'e.g. Men Genuine Leather Formal Shoes / Kids Sport Joggers',
        keywordMatch: /(shoe|jogger|boot|sneaker|chappal|sandal|khussa)/i,
      },
      {
        id: 'foot_care',
        name: 'Socks, Insoles & Shoe Care',
        shortLabel: 'Shoe Care & Socks',
        iconName: 'Package',
        suggestedUnits: ['PAIR', 'PACK', 'DOZEN', 'PCS'],
        defaultUnit: 'PAIR',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. Kiwi Shoe Polish Black / Cotton Ankle Socks / Memory Foam Insole',
        keywordMatch: /(polish|insole|lace|brush|shoe care)/i,
      },
    ];
  }

  // 10. Mobile & Electronics
  if (profile === 'electronics' || /mobile|phone|electronics|charger/i.test(cat)) {
    return [
      {
        id: 'elec_phones',
        name: 'Smartphones & Mobile Handsets',
        shortLabel: 'Phones / Handsets',
        iconName: 'Smartphone',
        suggestedUnits: ['PCS', 'BOX', 'SET'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'retail_storage',
        placeholderName: 'e.g. Redmi Note 13 / Samsung Galaxy A15 (Box Pack)',
        keywordMatch: /(phone|mobile|smartphone|handset)/i,
      },
      {
        id: 'elec_acc',
        name: 'Chargers, Earbuds & Screen Glass',
        shortLabel: 'Mobile Accessories',
        iconName: 'Zap',
        suggestedUnits: ['PCS', 'PACK', 'PAIR', 'BOX', 'METER'],
        defaultUnit: 'PCS',
        recommendedPricingType: 'fixed',
        placeholderName: 'e.g. 65W Fast Charger Type-C / 9D Tempered Glass / TWS Earbuds',
        keywordMatch: /(charger|cable|earbud|airpod|headphone|glass|protector|cover)/i,
      },
    ];
  }

  return [];
}
