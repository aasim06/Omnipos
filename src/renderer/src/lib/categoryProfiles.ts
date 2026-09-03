import { CategoryProfile } from './types';

export interface CategoryProfileConfig {
  key: CategoryProfile;
  label: string;
  shortTag: string;
  description: string;
  suggestedSizes: string[];
  suggestedUnits: string[];
  allowDecimals: boolean;
  accentColor: string;
}

export const CATEGORY_PROFILES: Record<CategoryProfile, CategoryProfileConfig> = {
  standard: {
    key: 'standard',
    label: 'Standard Retail (General / Mart)',
    shortTag: 'Standard',
    description: 'Packaged goods, supermarket items, and general retail',
    suggestedSizes: [],
    suggestedUnits: ['PCS', 'PACK', 'BOX', 'DOZEN', 'KG', 'LITER'],
    allowDecimals: false,
    accentColor: '#0284C7',
  },
  apparel: {
    key: 'apparel',
    label: 'Apparel & Clothing (Sizes XS - 3XL)',
    shortTag: 'Clothing',
    description: 'Shirts, pants, suits, kurtas, and garments with size matrix',
    suggestedSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    suggestedUnits: ['PCS', 'SUIT', 'SET'],
    allowDecimals: false,
    accentColor: '#8B5CF6',
  },
  footwear: {
    key: 'footwear',
    label: 'Footwear & Shoes (Sizes 38 - 45)',
    shortTag: 'Shoes',
    description: 'Shoes, boots, sneakers, sandals, and slippers with shoe size matrix',
    suggestedSizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    suggestedUnits: ['PAIR', 'PCS'],
    allowDecimals: false,
    accentColor: '#EC4899',
  },
  hardware: {
    key: 'hardware',
    label: 'Hardware, Iron & Building Materials',
    shortTag: 'Hardware',
    description: 'Sariya, keel, paints, wires, pipes with loose measurement & decimals',
    suggestedSizes: [],
    suggestedUnits: ['KG', 'FEET', 'METER', 'LITER', 'GALLON', 'BAG', 'BUNDLE', 'PCS'],
    allowDecimals: true,
    accentColor: '#F59E0B',
  },
  food: {
    key: 'food',
    label: 'Restaurant & Fast Food (Portions)',
    shortTag: 'Food Menu',
    description: 'Meals, burgers, pizzas, portions & recipe items',
    suggestedSizes: ['Regular', 'Small', 'Medium', 'Large', 'Family'],
    suggestedUnits: ['PCS', 'SERVING', 'PACK'],
    allowDecimals: false,
    accentColor: '#E51937',
  },
};

/**
 * Automatically infers the category profile if not explicitly chosen.
 * Allows instant intelligent smart detection of clothes, shoes, hardware, and food!
 */
export function detectCategoryProfile(categoryName: string, explicitProfile?: CategoryProfile): CategoryProfile {
  if (explicitProfile && explicitProfile !== 'standard') {
    return explicitProfile;
  }

  const name = categoryName.toLowerCase().trim();

  // 1. Apparel / Clothes keywords
  if (
    /(shirt|cloth|dress|garment|apparel|pant|jeans|suit|kurta|hoodie|jacket|trouser|t-shirt|polo|kamiz|shalwar|coat|fabric|lawn)/i.test(
      name
    )
  ) {
    return 'apparel';
  }

  // 2. Footwear / Shoes keywords
  if (
    /(shoe|boot|sneaker|sandal|chappal|jogger|heel|slipper|footwear|khussa|kheri)/i.test(
      name
    )
  ) {
    return 'footwear';
  }

  // 3. Hardware / Iron / Sanitary / Paint keywords
  if (
    /(iron|hardware|steel|wire|pipe|paint|cement|sanitary|looha|sariya|keel|cable|nail|screw|nut|thinner|varnish|gravel|ret)/i.test(
      name
    )
  ) {
    return 'hardware';
  }

  // 4. Food / Restaurant keywords
  if (
    /(food|burger|pizza|sandwich|shawarma|beverage|drink|snack|roll|platter|karahi|bbq|handi|broast)/i.test(
      name
    )
  ) {
    return 'food';
  }

  return explicitProfile || 'standard';
}
