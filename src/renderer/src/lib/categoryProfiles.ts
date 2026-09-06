import { CategoryProfile } from './types';

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
    suggestedUnits: ['PAIR', 'PCS'],
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
    suggestedUnits: ['PCS', 'SUIT', 'METER', 'GAZ', 'SET'],
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
    suggestedUnits: ['KG', 'GRAM', 'LITER', 'PACK', 'BOX', 'PCS'],
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
    suggestedUnits: ['PCS', 'PACK', 'BOTTLE', 'SET'],
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
    suggestedUnits: ['STRIP', 'BOX', 'TABLET', 'SYRUP', 'PCS'],
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
    suggestedUnits: ['PCS', 'SET'],
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
    suggestedUnits: ['KG', 'GRAM', 'DABBA', 'PCS', 'BOX'],
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
    suggestedUnits: ['PCS', 'SERVING', 'DEAL', 'PACK'],
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
    suggestedSizes: ['Quarter (1L)', 'Gallon (4L)', 'Balti (16L)', '0.5 KG', '1.0 KG', 'Half Inch', 'One Inch'],
    suggestedUnits: ['METER', 'FEET', 'KG', 'GALLON', 'QUARTER', 'BALTI', 'PCS'],
    allowDecimals: true,
    accentColor: '#D97706',
    defaultCategories: [
      'Paints, Distemper & Coatings',
      'Sanitary Fittings & Bathroom Pipes',
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
    suggestedUnits: ['COIL', 'METER', 'FEET', 'PCS', 'PACK', 'BOX'],
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
    suggestedUnits: ['PCS', 'PACK', 'BOX', 'DOZEN', 'KG', 'LITER'],
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
    /(hardware|iron|steel|pipe|paint|distemper|cement|sanitary|keel|nail|screw|nut|thinner|varnish|tap|basin|valve|fitting|tool|lock|handle)/i.test(
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
