import { Product, ProductVariant } from './types';

export const VARIANT_MARKER_PREFIX = '<!--omni:variants:';
export const VARIANT_MARKER_SUFFIX = '-->';
const VARIANT_MARKER_REGEX = /\n?<!--omni:variants:(.+?)-->/s;
const REGISTRY_STORAGE_KEY = 'omnipos_variants_registry';

interface VariantMeta {
  variants: ProductVariant[];
  pricingType?: string;
}

/**
 * Get the local fallback registry of product variants from localStorage.
 */
export function getLocalVariantRegistry(): Record<string, VariantMeta> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save product variants to the local fallback registry in localStorage.
 */
export function setLocalVariantRegistry(productId: string, variants: ProductVariant[], pricingType?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const registry = getLocalVariantRegistry();
    registry[productId] = { variants, pricingType };
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch (err) {
    console.warn('[VariantRegistry] Failed to save registry:', err);
  }
}

/**
 * Encodes variants and pricingType into the description string so it safely
 * persists through cloud backends (like Vercel) whose SQL schema lacks a variants column.
 */
export function encodeProductVariants(
  description: string | null | undefined,
  variants: ProductVariant[] | undefined,
  pricingType?: string
): string | undefined {
  const baseDesc = (description || '').replace(VARIANT_MARKER_REGEX, '').trim();
  if (!variants || variants.length === 0) {
    return baseDesc || undefined;
  }
  const payload = JSON.stringify({ variants, pricingType: pricingType || 'smlxl' });
  const marker = `${VARIANT_MARKER_PREFIX}${payload}${VARIANT_MARKER_SUFFIX}`;
  return baseDesc ? `${baseDesc}\n${marker}` : marker;
}

/**
 * Synthesizes default pizza / portion variants if an item belongs to Pizza category
 * or has pizza/kabab in name but variants were lost during serialization.
 */
export function synthesizePizzaVariants(basePrice: number, name?: string): ProductVariant[] {
  const p = Math.max(basePrice || 500, 100);
  const cleanName = (name || 'ITEM').replace(/\s+/g, '').toUpperCase().slice(0, 5);
  return [
    {
      id: `var_s_${cleanName}`,
      label: 'S',
      price: p,
      priceDelta: 0,
      costDelta: 0,
      stock: 50,
      skuCode: `SKU-${cleanName}-S`,
    },
    {
      id: `var_m_${cleanName}`,
      label: 'M',
      price: Math.round(p * 1.35 / 50) * 50, // e.g. 800 -> 1100, 1000 -> 1350
      priceDelta: 0,
      costDelta: 0,
      stock: 50,
      skuCode: `SKU-${cleanName}-M`,
    },
    {
      id: `var_l_${cleanName}`,
      label: 'L',
      price: Math.round(p * 1.75 / 50) * 50, // e.g. 800 -> 1400, 1000 -> 1750
      priceDelta: 0,
      costDelta: 0,
      stock: 50,
      skuCode: `SKU-${cleanName}-L`,
    },
    {
      id: `var_xl_${cleanName}`,
      label: 'XL',
      price: Math.round(p * 2.25 / 50) * 50, // e.g. 800 -> 1800, 1000 -> 2250
      priceDelta: 0,
      costDelta: 0,
      stock: 50,
      skuCode: `SKU-${cleanName}-XL`,
    },
  ];
}

/**
 * Safely extracts and decodes variants from product.variants, product.description,
 * or the local variant registry. Guarantees that product.variants is ProductVariant[].
 */
export function decodeProductVariants(product: Product): Product {
  let variants: ProductVariant[] = [];
  let pricingType = product.pricingType;
  let cleanDescription = product.description;

  // 1. Direct array in product.variants
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    variants = product.variants;
  }
  // 2. Stringified JSON in product.variants
  else if (typeof product.variants === 'string') {
    try {
      const parsed = JSON.parse(product.variants);
      if (Array.isArray(parsed)) {
        variants = parsed;
      } else if (typeof parsed === 'string') {
        const doubleParsed = JSON.parse(parsed);
        if (Array.isArray(doubleParsed)) variants = doubleParsed;
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Encoded marker in description
  if (variants.length === 0 && product.description) {
    const match = product.description.match(VARIANT_MARKER_REGEX);
    if (match && match[1]) {
      try {
        const decoded = JSON.parse(match[1]);
        if (Array.isArray(decoded)) {
          variants = decoded;
        } else if (decoded && Array.isArray(decoded.variants)) {
          variants = decoded.variants;
          if (decoded.pricingType) pricingType = decoded.pricingType;
        }
      } catch {
        /* ignore */
      }
    }
  }

  // 4. Local registry lookup
  if (variants.length === 0 && product.id) {
    const registry = getLocalVariantRegistry();
    const found = registry[product.id];
    if (found && Array.isArray(found.variants) && found.variants.length > 0) {
      variants = found.variants;
      if (found.pricingType) pricingType = found.pricingType;
    }
  }

  // 5. Intelligent auto-repair for Pizza items (like Bihari Kabab, Crown Crust)
  const isPizzaCategory =
    product.category?.toLowerCase() === 'pizza' ||
    (product.name.toLowerCase().includes('pizza') &&
      !product.name.toLowerCase().includes('fries') &&
      product.category?.toLowerCase() !== 'fries & sides');

  if (variants.length === 0 && isPizzaCategory && product.module === 'fastfood') {
    variants = synthesizePizzaVariants(product.price, product.name);
    pricingType = 'smlxl';
  }

  // Clean description of any internal marker for display
  if (cleanDescription) {
    cleanDescription = cleanDescription.replace(VARIANT_MARKER_REGEX, '').trim() || undefined;
  }

  const hasVariants = variants.length > 0;

  return {
    ...product,
    description: cleanDescription,
    pricingType: pricingType || (hasVariants ? 'smlxl' : 'fixed'),
    hasVariants,
    variants: hasVariants ? variants : undefined,
  };
}

/**
 * Normalizes any raw variants value into a safe ProductVariant[] array.
 */
export function normalizeVariants(raw: any, productPrice = 0, name?: string): ProductVariant[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        const double = JSON.parse(parsed);
        if (Array.isArray(double)) return double;
      }
    } catch {
      return [];
    }
  }
  return [];
}
