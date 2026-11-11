import { Express, Request, Response } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { getPrisma } from '../database/client';
import { getImagesDir, resolveImagePath } from '../backup/images-paths';
import {
  round3,
  openBatchForReceipt,
  consumeFefo,
  restoreAllocations,
  resizeReceiptBatch,
  syncProductNearestBatch,
} from './stockBatches';
import { evaluateStockAlerts, readLowStockDefault, alertLimitFor, LOW_STOCK_DEFAULT_SETTING } from './stockAlerts';

export function saveBase64Image(dataUrlOrBase64: string, prefix: string): string | null {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') return null;
  if (dataUrlOrBase64.startsWith('images/') || dataUrlOrBase64.startsWith('/images/')) {
    return dataUrlOrBase64;
  }
  let ext = 'png';
  let base64 = dataUrlOrBase64;
  const match = dataUrlOrBase64.match(/^data:(image\/([a-zA-Z0-9+.-]+));base64,(.+)$/);
  if (match) {
    ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    base64 = match[3];
  } else if (dataUrlOrBase64.startsWith('data:')) {
    return dataUrlOrBase64;
  }

  try {
    const dir = getImagesDir('products');
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safePrefix}.${ext}`;
    const dest = join(dir, filename);
    writeFileSync(dest, Buffer.from(base64, 'base64'));
    return `images/products/${filename}`;
  } catch (err) {
    console.warn('[saveBase64Image] Error saving image file:', err);
    return dataUrlOrBase64;
  }
}

/**
 * Quantity of a sale / return line in the product's base (retail) unit. A line sold in the
 * wholesale unit (selectedUnit 'primary', e.g. 1 Carton) is multiplied by the conversion rate.
 */
export function baseQuantity(line: { quantity?: unknown; selectedUnit?: unknown }, product: { conversionRate?: number | null } | null): number {
  const qty = Number(line.quantity || 1);
  const rate = Number(product?.conversionRate || 0);
  return round3(line.selectedUnit === 'primary' && rate > 1 ? qty * rate : qty);
}

/** Deterministic id for the 'out' movement of a POS sale line (client writes the same id offline). */
/** User sent by the app in the x-omnipos-user header (base64 of URI-encoded JSON), if any. */
export function requestUser(req: Request): { name?: string; role?: string; permissions: string[] } | null {
  const raw = req.header('x-omnipos-user');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(Buffer.from(raw, 'base64').toString('utf8')));
    return { name: parsed?.name, role: parsed?.role, permissions: Array.isArray(parsed?.permissions) ? parsed.permissions : [] };
  } catch {
    return null;
  }
}

/**
 * Stock corrections (edit, reverse, physical count) need the "Stock Corrections" permission.
 * Requests that carry no user (queued offline sync, older app versions) are allowed so retries
 * never get stuck; the app always sends the signed-in user. Not a security boundary: the local
 * backend has no login of its own. Returns true when the request was refused.
 */
export function refuseWithoutStockAdjust(req: Request, res: Response): boolean {
  const user = requestUser(req);
  if (!user) return false;
  if (user.role === 'admin' || user.permissions.includes('stock_adjust')) return false;
  res.status(403).json({ error: `${user.name || 'This user'} does not have the "Stock Corrections" permission.`, code: 'FORBIDDEN' });
  return true;
}

const toOptionalStr = (v: unknown): string | null => (v === undefined || v === null || v === '' ? null : String(v));

export function saleMovementId(orderId: string, lineIndex: number): string {
  return `sale_${orderId}_${lineIndex}`;
}

/**
 * Apply a stock delta to the variant whose label matches, inside a product's
 * JSON-encoded variants column. Returns the new JSON string, or null when there
 * is nothing to change (no label, no parsable variants, or the variant has no stock tracking).
 */
export function adjustVariantStockJson(variantsRaw: unknown, variantLabel: unknown, delta: number): string | null {
  if (!variantLabel || variantsRaw === null || variantsRaw === undefined) return null;
  try {
    let vars: any = typeof variantsRaw === 'string' ? JSON.parse(variantsRaw) : variantsRaw;
    if (typeof vars === 'string') vars = JSON.parse(vars);
    if (!Array.isArray(vars)) return null;
    const label = String(variantLabel).trim().toLowerCase();
    let changed = false;
    const next = vars.map((v: any) => {
      if (!changed && v && String(v.label || '').trim().toLowerCase() === label && v.stock !== undefined && v.stock !== null) {
        changed = true;
        return { ...v, stock: Math.max(0, Number(v.stock || 0) + delta) };
      }
      return v;
    });
    return changed ? JSON.stringify(next) : null;
  } catch {
    return null;
  }
}

export interface RecipeLine {
  ingredientId: string;
  ingredientName?: string;
  quantity: number; // ingredient stock units consumed per 1 unit of the menu item sold
  variantLabel?: string; // only for this size/variant; omitted = every variant
}

/** Parse a product's recipe column (JSON string or array) into clean lines. */
export function parseRecipe(raw: unknown): RecipeLine[] {
  let value: any = raw;
  try {
    if (typeof value === 'string') value = value.trim() ? JSON.parse(value) : [];
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((r: any) => r && r.ingredientId && Number(r.quantity) > 0)
    .map((r: any) => ({
      ingredientId: String(r.ingredientId),
      ingredientName: r.ingredientName ? String(r.ingredientName) : undefined,
      quantity: Number(r.quantity),
      variantLabel: r.variantLabel ? String(r.variantLabel) : undefined,
    }));
}

/**
 * Recipe lines that apply to a sold variant: lines for that exact variant when any exist,
 * otherwise the lines that apply to every variant.
 */
export function recipeLinesFor(recipe: RecipeLine[], variantLabel?: string | null): RecipeLine[] {
  const label = (variantLabel || '').trim().toLowerCase();
  const generic = recipe.filter((r) => !r.variantLabel);
  if (!label) return generic;
  const specific = recipe.filter((r) => (r.variantLabel || '').trim().toLowerCase() === label);
  return specific.length > 0 ? specific : generic;
}

/** Deterministic id for the ingredient movement of a sale line (client writes the same id offline). */
export function recipeMovementId(orderId: string, lineIndex: number, ingredientIndex: number): string {
  return `sale_${orderId}_${lineIndex}_r${ingredientIndex}`;
}

/** Deduct a sold menu item's recipe ingredients and log each as a 'Recipe Usage' out movement. */
async function consumeRecipeIngredients(order: any, lineIndex: number, line: any, product: any): Promise<void> {
  const db = getPrisma();
  const lines = recipeLinesFor(parseRecipe(product.recipe), line.variantLabel);
  if (lines.length === 0) return;
  const soldQty = baseQuantity(line, product);

  for (let k = 0; k < lines.length; k++) {
    const r = lines[k];
    const used = round3(r.quantity * soldQty);
    if (used <= 0) continue;
    try {
      await db.$transaction(async (tx: any) => {
        const ingredient = await tx.product.findUnique({ where: { id: r.ingredientId } });
        if (!ingredient || ingredient.openingStock === null || ingredient.openingStock === undefined) return;
        const id = recipeMovementId(order.id, lineIndex, k);
        if (await tx.stockMovement.findUnique({ where: { id } })) return;
        await tx.stockMovement.create({
          data: {
            id,
            module: order.module || ingredient.module || 'fastfood',
            productId: ingredient.id,
            productName: ingredient.name,
            type: 'out',
            quantity: used,
            unitCost: ingredient.costPrice ?? null,
            reason: 'Recipe Usage',
            createdBy: 'POS',
            note: `Sale Order #${order.id}: ${soldQty} × ${product.name}${line.variantLabel ? ` (${line.variantLabel})` : ''}`,
            date: order.createdAt || new Date(),
          },
        });
        await tx.product.update({
          where: { id: ingredient.id },
          data: { openingStock: Math.max(0, round3((ingredient.openingStock || 0) - used)), updatedAt: new Date() },
        });
        await consumeFefo(tx, ingredient.id, used, id);
        await syncProductNearestBatch(tx, ingredient.id);
        await evaluateStockAlerts(tx, [ingredient.id]);
      });
    } catch (err) {
      console.warn(`[Recipe] Failed to consume ingredient ${r.ingredientId} for ${product.id}:`, err);
    }
  }
}

export function sanitizeProduct(raw: any) {
  if (!raw || typeof raw !== 'object') return {};
  const allowed = [
    'id', 'module', 'name', 'description', 'costPrice', 'price',
    'category', 'skuCode', 'rackLocation', 'unit', 'minThreshold',
    'openingStock', 'prepTime', 'displayOrder', 'tags', 'allergens',
    'isAvailable', 'imageBase64', 'imageUrl', 'variants', 'batchNumber', 'expiryDate', 'recipe',
    'itemRole', 'barcode', 'primaryUnit', 'secondaryUnit', 'conversionRate', 'secondaryPrice'
  ];
  const out: any = {};
  for (const k of allowed) {
    if (raw[k] !== undefined) {
      if (k === 'price' || k === 'costPrice' || k === 'conversionRate' || k === 'secondaryPrice') {
        out[k] = raw[k] === null || raw[k] === '' ? null : Number(raw[k]);
      } else if (k === 'openingStock') {
        // Decimal stock is allowed (KG, L, meters)
        out[k] = raw[k] === null || raw[k] === '' || raw[k] === undefined ? null : round3(Number(raw[k]));
      } else if (k === 'minThreshold') {
        // Low-stock alert limit: decimals allowed, empty = use the store default
        out[k] = raw[k] === null || raw[k] === '' || raw[k] === undefined ? null : Math.max(0, round3(Number(raw[k])));
      } else if (k === 'prepTime' || k === 'displayOrder') {
        out[k] = raw[k] === null || raw[k] === '' || raw[k] === undefined ? null : Math.round(Number(raw[k]));
      } else if (k === 'variants') {
        out[k] = Array.isArray(raw[k]) ? JSON.stringify(raw[k]) : typeof raw[k] === 'string' ? raw[k] : null;
      } else if (k === 'recipe') {
        out[k] = Array.isArray(raw[k]) ? JSON.stringify(raw[k]) : typeof raw[k] === 'string' ? raw[k] : null;
      } else if (k === 'tags' || k === 'allergens') {
        out[k] = Array.isArray(raw[k]) ? JSON.stringify(raw[k]) : typeof raw[k] === 'string' ? raw[k] : null;
      } else if (k === 'isAvailable') {
        out[k] = Boolean(raw[k]);
      } else {
        out[k] = raw[k];
      }
    }
  }

  // If image is given as base64, save to disk under userData/images/products and store clean relative path
  const prodId = out.id || `prod_${Date.now()}`;
  if (out.imageUrl && typeof out.imageUrl === 'string' && out.imageUrl.startsWith('data:image/')) {
    const savedPath = saveBase64Image(out.imageUrl, prodId);
    if (savedPath) out.imageUrl = savedPath;
  } else if (out.imageBase64 && typeof out.imageBase64 === 'string' && out.imageBase64.startsWith('data:image/')) {
    const savedPath = saveBase64Image(out.imageBase64, prodId);
    if (savedPath) {
      if (!out.imageUrl) out.imageUrl = savedPath;
    }
  }

  return out;
}

export function sanitizeCategory(raw: any) {
  if (!raw || typeof raw !== 'object') return {};
  const allowed = ['id', 'module', 'name', 'color', 'icon', 'displayOrder'];
  const out: any = {};
  for (const k of allowed) {
    if (raw[k] === undefined) continue;
    if (k === 'displayOrder') {
      out[k] = raw[k] === null || raw[k] === '' ? 0 : Math.round(Number(raw[k])) || 0;
    } else if (k === 'color' || k === 'icon') {
      out[k] = raw[k] === null ? null : String(raw[k]).slice(0, 40);
    } else {
      out[k] = raw[k];
    }
  }
  return out;
}

export function registerRoutes(app: Express): void {
  const db = new Proxy({} as any, {
    get(_target, prop) {
      return (getPrisma() as any)[prop];
    },
  });

  // ── Products ──
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const module = req.query.module as string | undefined;
      const where = module ? { module } : {};
      const products = await db.product.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      const parsed = products.map((p: any) => {
        let v = p.variants;
        if (typeof v === 'string') {
          try {
            v = JSON.parse(v);
          } catch {
            /* ignore */
          }
        }
        let imageBase64 = p.imageBase64;
        if (!imageBase64 && p.imageUrl && p.imageUrl.startsWith('images/')) {
          try {
            const abs = resolveImagePath(p.imageUrl);
            if (existsSync(abs)) {
              const ext = extname(abs).replace('.', '') || 'png';
              const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
              imageBase64 = `data:${mime};base64,${readFileSync(abs).toString('base64')}`;
            }
          } catch {}
        }
        return { ...p, imageBase64, variants: v };
      });
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const safeData = sanitizeProduct(req.body);
      const id = safeData.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const product = await db.product.upsert({
        where: { id },
        update: {
          ...safeData,
          updatedAt: new Date(),
        },
        create: {
          ...safeData,
          id,
          updatedAt: new Date(),
        },
      });
      let parsedVariants = product.variants;
      if (typeof parsedVariants === 'string') {
        try { parsedVariants = JSON.parse(parsedVariants); } catch {}
      }
      await evaluateStockAlerts(db, [product.id]).catch((e: any) => console.warn('[StockAlert]', e));
      res.json({ ...product, variants: parsedVariants });
    } catch (err: any) {
      console.error('[API POST /api/products] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const safeData = sanitizeProduct(req.body);
      delete safeData.id;
      const product = await db.product.update({
        where: { id },
        data: {
          ...safeData,
          updatedAt: new Date(),
        },
      });
      let parsedVariants = product.variants;
      if (typeof parsedVariants === 'string') {
        try { parsedVariants = JSON.parse(parsedVariants); } catch {}
      }
      res.json({ ...product, variants: parsedVariants });
    } catch (err: any) {
      console.error('[API PUT /api/products] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await db.product.delete({ where: { id } });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Predefined Default Business Categories Registry ──
  const DEFAULT_BUSINESS_CATEGORIES = [
    // footwear
    { name: 'Formal Shoes', profile: 'footwear', module: 'minimart' },
    { name: 'Sneakers & Joggers', profile: 'footwear', module: 'minimart' },
    { name: 'Slippers & Chappal', profile: 'footwear', module: 'minimart' },
    { name: 'Sandals & Peshawari', profile: 'footwear', module: 'minimart' },
    { name: 'Boots & High Tops', profile: 'footwear', module: 'minimart' },
    { name: 'Kids Footwear', profile: 'footwear', module: 'minimart' },

    // apparel
    { name: 'Gents Kurta & Shalwar Kameez', profile: 'apparel', module: 'minimart' },
    { name: 'Casual Shirts & Polos', profile: 'apparel', module: 'minimart' },
    { name: 'Trousers, Jeans & Pants', profile: 'apparel', module: 'minimart' },
    { name: 'Ladies Unstitched Suits', profile: 'apparel', module: 'minimart' },
    { name: 'Ladies Ready-to-Wear (Pret)', profile: 'apparel', module: 'minimart' },
    { name: 'Kids Wear', profile: 'apparel', module: 'minimart' },
    { name: 'Jackets & Winter Wear', profile: 'apparel', module: 'minimart' },

    // grocery
    { name: 'Beverages & Cold Drinks', profile: 'grocery', module: 'minimart' },
    { name: 'Snacks, Chips & Biscuits', profile: 'grocery', module: 'minimart' },
    { name: 'Dairy, Milk & Eggs', profile: 'grocery', module: 'minimart' },
    { name: 'Staples, Rice, Flour & Daal', profile: 'grocery', module: 'minimart' },
    { name: 'Cooking Oil & Banaspati Ghee', profile: 'grocery', module: 'minimart' },
    { name: 'Household & Cleaning', profile: 'grocery', module: 'minimart' },
    { name: 'Spices & Condiments', profile: 'grocery', module: 'minimart' },

    // cosmetics
    { name: 'Lipsticks & Lip Gloss', profile: 'cosmetics', module: 'minimart' },
    { name: 'Foundations & Face Powders', profile: 'cosmetics', module: 'minimart' },
    { name: 'Skin Care, Creams & Serums', profile: 'cosmetics', module: 'minimart' },
    { name: 'Eye Makeup & Mascara', profile: 'cosmetics', module: 'minimart' },
    { name: 'Perfumes & Body Mists', profile: 'cosmetics', module: 'minimart' },
    { name: 'Hair Care & Shampoos', profile: 'cosmetics', module: 'minimart' },
    { name: 'Nail Polishes & Nail Care', profile: 'cosmetics', module: 'minimart' },

    // pharmacy
    { name: 'Tablets & Capsules', profile: 'pharmacy', module: 'minimart' },
    { name: 'Syrups & Suspensions', profile: 'pharmacy', module: 'minimart' },
    { name: 'Injections & Infusions', profile: 'pharmacy', module: 'minimart' },
    { name: 'Ointments & Topical Drops', profile: 'pharmacy', module: 'minimart' },
    { name: 'Medical Devices & Surgicals', profile: 'pharmacy', module: 'minimart' },
    { name: 'Baby Food & Diapers', profile: 'pharmacy', module: 'minimart' },

    // electronics
    { name: 'Smartphones & Handsets', profile: 'electronics', module: 'minimart' },
    { name: 'Chargers, Adapters & Cables', profile: 'electronics', module: 'minimart' },
    { name: 'Wireless Earbuds & Audio', profile: 'electronics', module: 'minimart' },
    { name: 'Screen Protectors & Glass', profile: 'electronics', module: 'minimart' },
    { name: 'Mobile Covers & Pouches', profile: 'electronics', module: 'minimart' },
    { name: 'Power Banks & Batteries', profile: 'electronics', module: 'minimart' },

    // bakery
    { name: 'Traditional Sweets & Mithai', profile: 'bakery', module: 'minimart' },
    { name: 'Cakes, Pastries & Desserts', profile: 'bakery', module: 'minimart' },
    { name: 'Bakery Biscuits & Cookies', profile: 'bakery', module: 'minimart' },
    { name: 'Fresh Breads, Rusk & Buns', profile: 'bakery', module: 'minimart' },
    { name: 'Savories, Samosa & Nimko', profile: 'bakery', module: 'minimart' },

    // food
    { name: 'Burgers & Sandwiches', profile: 'food', module: 'fastfood' },
    { name: 'Pizzas & Calzones', profile: 'food', module: 'fastfood' },
    { name: 'Crispy Broast & Wings', profile: 'food', module: 'fastfood' },
    { name: 'Karahi, Handi & Gravies', profile: 'food', module: 'fastfood' },
    { name: 'BBQ, Tikka & Kebabs', profile: 'food', module: 'fastfood' },
    { name: 'Cold Beverages & Shakes', profile: 'food', module: 'fastfood' },
    { name: 'Family Deals & Combos', profile: 'food', module: 'fastfood' },

    // hardware
    { name: 'Paints, Distemper & Coatings', profile: 'hardware', module: 'minimart' },
    { name: 'Sanitary Fittings & Bathroom Pipes', profile: 'hardware', module: 'minimart' },
    { name: 'Fasteners, Screws & Nails', profile: 'hardware', module: 'minimart' },
    { name: 'Hand Tools & Power Equipment', profile: 'hardware', module: 'minimart' },
    { name: 'Locks, Handles & Security', profile: 'hardware', module: 'minimart' },

    // electric
    { name: 'Electrical Cables & Flexible Wires', profile: 'electric', module: 'minimart' },
    { name: 'Switches, Sockets & Face Plates', profile: 'electric', module: 'minimart' },
    { name: 'LED Lights, Bulbs & Panels', profile: 'electric', module: 'minimart' },
    { name: 'Circuit Breakers & DB Distribution Boxes', profile: 'electric', module: 'minimart' },
    { name: 'PVC Conduit Pipes & Fittings', profile: 'electric', module: 'minimart' },
    { name: 'Ceiling & Exhaust Fans', profile: 'electric', module: 'minimart' },
    { name: 'Extension Boards & Power Strips', profile: 'electric', module: 'minimart' },

    // standard
    { name: 'General Items', profile: 'standard', module: 'minimart' },
    { name: 'Packaged Goods', profile: 'standard', module: 'minimart' },
  ];

  app.get('/api/categories/default-templates', (req: Request, res: Response) => {
    try {
      const profile = req.query.profile as string | undefined;
      const module = req.query.module as string | undefined;
      let list = DEFAULT_BUSINESS_CATEGORIES;
      if (profile) list = list.filter((c) => c.profile === profile);
      if (module) list = list.filter((c) => !c.module || c.module === module);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const BUSINESS_PROFILES_MAP: Record<string, any> = {
    footwear: {
      id: 'footwear',
      name: 'Footwear & Shoes Store',
      iconName: 'Footprints',
      module: 'minimart',
      description: 'Specialized for shoe shops with sizes 38 - 45, colors, pairs and article codes',
      suggestedUnits: ['PAIR', 'PCS', 'BOX', 'PACK', 'DOZEN', 'SET'],
      suggestedSizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
      defaultCategories: [
        { name: 'Formal Shoes', profile: 'footwear' },
        { name: 'Sneakers & Joggers', profile: 'footwear' },
        { name: 'Slippers & Chappal', profile: 'footwear' },
        { name: 'Sandals & Peshawari', profile: 'footwear' },
        { name: 'Boots & High Tops', profile: 'footwear' },
        { name: 'Kids Footwear', profile: 'footwear' },
      ],
      features: { hasColorShades: true },
    },
    apparel: {
      id: 'apparel',
      name: 'Garments, Clothing & Boutique',
      iconName: 'Shirt',
      module: 'minimart',
      description: 'Standard apparel sizes (XS to 3XL) and unstitched fabric / meter measurements',
      suggestedUnits: ['PCS', 'SUIT', 'METER', 'GAZ', 'THAN', 'SET', 'PACK', 'DOZEN', 'PAIR', 'BOX'],
      suggestedSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
      defaultCategories: [
        { name: 'Gents Kurta & Shalwar Kameez', profile: 'apparel' },
        { name: 'Casual Shirts & Polos', profile: 'apparel' },
        { name: 'Trousers, Jeans & Pants', profile: 'apparel' },
        { name: 'Ladies Unstitched Suits', profile: 'apparel' },
        { name: 'Ladies Ready-to-Wear (Pret)', profile: 'apparel' },
        { name: 'Kids Wear', profile: 'apparel' },
        { name: 'Jackets & Winter Wear', profile: 'apparel' },
      ],
      features: { hasColorShades: true },
    },
    grocery: {
      id: 'grocery',
      name: 'Grocery, Supermarket & Mini Mart',
      iconName: 'ShoppingBag',
      module: 'minimart',
      description: 'Barcode scanning POS with weighed loose grains (KG/Grams) and FMCG items',
      suggestedUnits: ['KG', 'GRAM', 'LITER', 'ML', 'PCS', 'PACK', 'BOX', 'CARTON', 'BAG', 'DOZEN', 'BOTTLE', 'JAR', 'TIN', 'SACHET', 'TRAY', 'BUNDLE'],
      suggestedSizes: ['250g', '500g', '1 KG', '5 KG'],
      defaultCategories: [
        { name: 'Beverages & Cold Drinks', profile: 'grocery' },
        { name: 'Snacks, Chips & Biscuits', profile: 'grocery' },
        { name: 'Dairy, Milk & Eggs', profile: 'grocery' },
        { name: 'Staples, Rice, Flour & Daal', profile: 'grocery' },
        { name: 'Cooking Oil & Banaspati Ghee', profile: 'grocery' },
        { name: 'Household & Cleaning', profile: 'grocery' },
        { name: 'Spices & Condiments', profile: 'grocery' },
      ],
      features: { hasWeighingScale: true },
    },
    cosmetics: {
      id: 'cosmetics',
      name: 'Cosmetics & Beauty Store',
      iconName: 'Palette',
      module: 'minimart',
      description: 'Beauty products with shade color numbers (#01, #08) and bottle volume sizes',
      suggestedUnits: ['PCS', 'PACK', 'BOTTLE', 'SET', 'KIT', 'TUBE', 'JAR', 'BOX', 'DOZEN', 'ML', 'Gram', 'STRIP'],
      suggestedSizes: ['#01 Red', '#08 Nude', '#14 Maroon', '#22 Gold', '50ml', '100ml', '250ml'],
      defaultCategories: [
        { name: 'Lipsticks & Lip Gloss', profile: 'cosmetics' },
        { name: 'Foundations & Face Powders', profile: 'cosmetics' },
        { name: 'Skin Care, Creams & Serums', profile: 'cosmetics' },
        { name: 'Eye Makeup & Mascara', profile: 'cosmetics' },
        { name: 'Perfumes & Body Mists', profile: 'cosmetics' },
        { name: 'Hair Care & Shampoos', profile: 'cosmetics' },
        { name: 'Nail Polishes & Nail Care', profile: 'cosmetics' },
      ],
      features: { hasColorShades: true, hasBatchExpiry: true },
    },
    pharmacy: {
      id: 'pharmacy',
      name: 'Pharmacy & Medical Store',
      iconName: 'Cross',
      module: 'minimart',
      description: 'Medicines with strip/box/tablet division, batch numbers and expiry tracking',
      suggestedUnits: ['STRIP', 'BOX', 'TABLET', 'CAPSULE', 'SYRUP', 'BOTTLE', 'TUBE', 'SACHET', 'VIAL', 'AMPOULE', 'PACK', 'ROLL', 'BAG', 'PCS'],
      suggestedSizes: ['Strip (10 Tablets)', 'Box (100 Tablets)', '60ml', '120ml'],
      defaultCategories: [
        { name: 'Tablets & Capsules', profile: 'pharmacy' },
        { name: 'Syrups & Suspensions', profile: 'pharmacy' },
        { name: 'Injections & Infusions', profile: 'pharmacy' },
        { name: 'Ointments & Topical Drops', profile: 'pharmacy' },
        { name: 'Medical Devices & Surgicals', profile: 'pharmacy' },
        { name: 'Baby Food & Diapers', profile: 'pharmacy' },
      ],
      features: { hasBatchExpiry: true },
    },
    electronics: {
      id: 'electronics',
      name: 'Mobile, Electronics & Accessories',
      iconName: 'Smartphone',
      module: 'minimart',
      description: 'Smartphones and electronics with unique IMEI/Serial numbers and warranty tracking',
      suggestedUnits: ['PCS', 'SET', 'BOX', 'PACK', 'PAIR', 'KIT', 'METER', 'ROLL'],
      suggestedSizes: ['64GB', '128GB', '256GB', '512GB'],
      defaultCategories: [
        { name: 'Smartphones & Handsets', profile: 'electronics' },
        { name: 'Chargers, Adapters & Cables', profile: 'electronics' },
        { name: 'Wireless Earbuds & Audio', profile: 'electronics' },
        { name: 'Screen Protectors & Glass', profile: 'electronics' },
        { name: 'Mobile Covers & Pouches', profile: 'electronics' },
        { name: 'Power Banks & Batteries', profile: 'electronics' },
      ],
      features: { hasImeiSerial: true },
    },
    bakery: {
      id: 'bakery',
      name: 'Bakery & Sweets / Confectionery',
      iconName: 'Cake',
      module: 'minimart',
      description: 'Fresh confectionery and traditional sweets sold by box / weight (250g, 500g, 1 KG)',
      suggestedUnits: ['KG', 'GRAM', 'POUND', 'DABBA', 'BOX', 'PCS', 'DOZEN', 'PACK', 'TRAY'],
      suggestedSizes: ['250g', '500g', '1 KG', '2 KG'],
      defaultCategories: [
        { name: 'Traditional Sweets & Mithai', profile: 'bakery' },
        { name: 'Cakes, Pastries & Desserts', profile: 'bakery' },
        { name: 'Bakery Biscuits & Cookies', profile: 'bakery' },
        { name: 'Fresh Breads, Rusk & Buns', profile: 'bakery' },
        { name: 'Savories, Samosa & Nimko', profile: 'bakery' },
      ],
      features: { hasWeighingScale: true },
    },
    food: {
      id: 'food',
      name: 'Fast Food, Cafe & Restaurant',
      iconName: 'Utensils',
      module: 'fastfood',
      description: 'Food and kitchen menu with KDS ticket dispatch, portion sizes and deal combos',
      suggestedUnits: ['PCS', 'SERVING', 'PORTION', 'PLATE', 'DEAL', 'PACK', 'CUP', 'GLASS', 'BOTTLE', 'CAN', 'KG', 'BOX'],
      suggestedSizes: ['Regular', 'Small', 'Medium', 'Large', 'Family', 'Half', 'Full'],
      defaultCategories: [
        { name: 'Burgers & Sandwiches', profile: 'food' },
        { name: 'Pizzas & Calzones', profile: 'food' },
        { name: 'Crispy Broast & Wings', profile: 'food' },
        { name: 'Karahi, Handi & Gravies', profile: 'food' },
        { name: 'BBQ, Tikka & Kebabs', profile: 'food' },
        { name: 'Cold Beverages & Shakes', profile: 'food' },
        { name: 'Family Deals & Combos', profile: 'food' },
      ],
      features: { hasKitchenKDS: true },
    },
    hardware: {
      id: 'hardware',
      name: 'Hardware, Sanitary & Paint Store',
      iconName: 'Wrench',
      module: 'minimart',
      description: 'Building materials, paints, plumbing, sanitary fittings, fasteners and tools',
      suggestedUnits: ['PCS', 'SET', 'FEET', 'LENGTH', 'RFT', 'INCH', 'ROLL', 'TUBE', 'PACK', 'BOX', 'BAG', 'DOZEN', 'PAIR', 'METER', 'KG', 'COIL', 'SHEET', 'GALLON', 'QUARTER', 'BALTI'],
      suggestedSizes: ['Quarter (1L)', 'Gallon (4L)', 'Balti (16L)', '0.5 KG', '1.0 KG', 'Half Inch', 'One Inch'],
      defaultCategories: [
        { name: 'Paints, Distemper & Coatings', profile: 'hardware' },
        { name: 'Sanitary Fittings & Bathroom Pipes', profile: 'hardware' },
        { name: 'Fasteners, Screws & Nails', profile: 'hardware' },
        { name: 'Hand Tools & Power Equipment', profile: 'hardware' },
        { name: 'Locks, Handles & Security', profile: 'hardware' },
      ],
      features: { hasPipeDecimals: true, hasWeighingScale: true },
    },
    electric: {
      id: 'electric',
      name: 'Electrical Store & Lighting',
      iconName: 'Zap',
      module: 'minimart',
      description: 'Electrical cables, switches, sockets, LED lights, breakers, conduits and appliances',
      suggestedUnits: ['COIL', 'METER', 'FEET', 'LENGTH', 'ROLL', 'PCS', 'SET', 'PACK', 'BOX', 'DOZEN', 'PAIR', 'GAZ'],
      suggestedSizes: ['1.5mm', '2.5mm', '7/29', '7/36', '7/44', '9W', '12W', '18W'],
      defaultCategories: [
        { name: 'Electrical Cables & Flexible Wires', profile: 'electric' },
        { name: 'Switches, Sockets & Face Plates', profile: 'electric' },
        { name: 'LED Lights, Bulbs & Panels', profile: 'electric' },
        { name: 'Circuit Breakers & DB Distribution Boxes', profile: 'electric' },
        { name: 'PVC Conduit Pipes & Fittings', profile: 'electric' },
        { name: 'Ceiling & Exhaust Fans', profile: 'electric' },
        { name: 'Extension Boards & Power Strips', profile: 'electric' },
      ],
      features: { hasPipeDecimals: true },
    },
  };

  app.get('/api/business-profiles', (_req: Request, res: Response) => {
    try {
      res.json(Object.values(BUSINESS_PROFILES_MAP));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/business-profiles/:id', (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const profile = BUSINESS_PROFILES_MAP[id] || null;
      if (!profile) {
        return res.status(404).json({ error: 'Business profile not found' });
      }
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Categories ──
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const module = req.query.module as string | undefined;
      const where = module ? { module } : {};
      const categories = await db.category.findMany({ where, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] });
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/categories', async (req: Request, res: Response) => {
    try {
      const safeData = sanitizeCategory(req.body);
      // Upsert so editing a category (colour, icon, order) updates the existing row.
      const cat = safeData.id
        ? await db.category.upsert({ where: { id: safeData.id }, update: safeData, create: safeData })
        : await db.category.create({ data: safeData });
      res.json(cat);
    } catch (err: any) {
      console.error('[API POST /api/categories] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Pre-backup flush: Bulk upsert products & categories into SQLite ──
  app.post('/api/sync/flush-all', async (req: Request, res: Response) => {
    try {
      const { products = [], categories = [] } = req.body;
      let pCount = 0;
      let cCount = 0;

      for (const rawC of categories) {
        if (!rawC || !rawC.name) continue;
        const safeC = sanitizeCategory(rawC);
        const cId = String(safeC.id || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
        try {
          await db.category.upsert({
            where: { id: cId },
            update: safeC,
            create: { ...safeC, id: cId },
          });
          cCount++;
        } catch (catErr: any) {
          console.warn('[flush-all] Category error:', catErr.message);
        }
      }

      for (const rawP of products) {
        if (!rawP || !rawP.name) continue;
        const safeP = sanitizeProduct(rawP);
        const pId = String(safeP.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
        try {
          await db.product.upsert({
            where: { id: pId },
            update: { ...safeP, updatedAt: new Date() },
            create: { ...safeP, id: pId, updatedAt: new Date() },
          });
          pCount++;
        } catch (prodErr: any) {
          console.warn('[flush-all] Product error:', prodErr.message);
        }
      }

      console.log(`[API /api/sync/flush-all] Flushed ${pCount} products, ${cCount} categories to SQLite`);
      res.json({ ok: true, syncedProducts: pCount, syncedCategories: cCount });
    } catch (err: any) {
      console.error('[API POST /api/sync/flush-all] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await db.category.delete({ where: { id } });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Orders ──
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const module = req.query.module as string | undefined;
      const where = module ? { module } : {};
      const orders = await db.order.findMany({
        where,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const { lines, synced, syncError, ...orderData } = req.body;

      if (orderData.id) {
        const existing = await db.order.findUnique({
          where: { id: String(orderData.id) },
          include: { lines: true },
        });
        if (existing) {
          return res.json(existing);
        }
      }

      const rawLines = Array.isArray(lines) ? lines : [];
      const orderLines = await Promise.all(
        rawLines.map(async (line: any) => {
          let validProductId: string | null = null;
          const candidateId =
            line.productId ||
            (line.id && !String(line.id).startsWith('item_') && !String(line.id).startsWith('line_')
              ? String(line.id)
              : null);

          if (candidateId) {
            try {
              const p = await db.product.findUnique({
                where: { id: candidateId },
                select: { id: true },
              });
              if (p) validProductId = p.id;
            } catch {
              validProductId = null;
            }
          }

          return {
            productId: validProductId,
            name: line.name || 'Order Item',
            unitPrice: Number(line.unitPrice) || 0,
            quantity: Number(line.quantity) || 1,
            variantLabel: line.variantLabel || null,
            selectedUnit: line.selectedUnit || null,
            notes: line.notes || null,
          };
        })
      );

      const order = await db.order.create({
        data: {
          ...orderData,
          isSynced: true,
          updatedAt: new Date(),
          lines: {
            create: orderLines,
          },
        },
        include: { lines: true },
      });

      // Auto-create Kitchen Ticket for Fast Food orders so kitchen staff sees prep card immediately
      if (order.module === 'fastfood') {
        try {
          const typeLabel = order.orderType ? String(order.orderType).toUpperCase() : 'DINE-IN';
          const custNote = order.customerName ? ` (${order.customerName})` : '';
          await db.kitchenTicket.create({
            data: {
              orderId: order.id,
              orderType: `${typeLabel}${custNote}`,
              status: 'pending',
              notes: order.customerName || null,
            },
          });
        } catch (ktErr) {
          console.warn('[KitchenTicket] Auto-create error:', ktErr);
        }
      }

      // Deduct inventory stock (incl. size/variant stock) for each sold product line
      // and write an 'out' movement so the Stock Movement Ledger reconciles with sales.
      if (Array.isArray(lines)) {
        for (let idx = 0; idx < lines.length; idx++) {
          const line = lines[idx];
          if (line.productId) {
            try {
              const product = await db.product.findUnique({
                where: { id: String(line.productId) },
              });
              if (product && product.openingStock !== null && product.openingStock !== undefined) {
                const soldQty = baseQuantity(line, product);
                const newStock = Math.max(0, round3(product.openingStock - soldQty));
                const updatedVariants = adjustVariantStockJson(product.variants, line.variantLabel, -soldQty);
                await db.product.update({
                  where: { id: String(line.productId) },
                  data: {
                    openingStock: newStock,
                    ...(updatedVariants !== null ? { variants: updatedVariants } : {}),
                    updatedAt: new Date(),
                  },
                });

                try {
                  await db.stockMovement.create({
                    data: {
                      id: saleMovementId(order.id, idx),
                      module: order.module || product.module || 'minimart',
                      productId: product.id,
                      productName: line.variantLabel ? `${product.name} (${line.variantLabel})` : product.name,
                      type: 'out',
                      quantity: soldQty,
                      unitCost: product.costPrice ?? null,
                      unitPrice: Number(line.unitPrice || 0) || null,
                      reason: 'POS Sale',
                      note: `Sale Order #${order.id}`,
                      createdBy: toOptionalStr(orderData.cashierName || orderData.createdBy) || 'POS',
                      date: order.createdAt || new Date(),
                    },
                  });
                  await consumeFefo(db, product.id, soldQty, saleMovementId(order.id, idx));
                  await syncProductNearestBatch(db, product.id);
                  await evaluateStockAlerts(db, [product.id]);
                } catch (movErr) {
                  console.warn(`[Inventory] Sale movement not recorded for ${product.id}:`, movErr);
                }
              }

              // Recipe (bill of materials): consume the ingredients of the sold menu item
              if (product) {
                await consumeRecipeIngredients(order, idx, line, product);
              }
            } catch (stockErr) {
              console.error(`[Inventory] Failed to deduct stock for product ${line.productId}:`, stockErr);
            }
          }
        }
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { lines, ...orderData } = req.body;
      const order = await db.order.update({
        where: { id },
        data: {
          ...orderData,
          updatedAt: new Date(),
        },
        include: { lines: true },
      });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Order Refunds & Sales Returns ──
  app.get('/api/refunds', async (_req: Request, res: Response) => {
    try {
      const refunds = await (db as any).orderRefund.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(refunds);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders/:id/refund', async (req: Request, res: Response) => {
    try {
      const orderId = String(req.params.id);
      const { returnedLines, refundAmount, reason, paymentMode, customerName } = req.body;

      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { lines: true },
      });

      if (!order) {
        return res.status(404).json({ error: `Order #${orderId} not found` });
      }

      // 1. Restock products in inventory & create incoming StockMovements
      if (Array.isArray(returnedLines) && returnedLines.length > 0) {
        for (const line of returnedLines) {
          if (Number(line.quantity || 1) <= 0) continue;

          let product: any = null;
          if (line.productId) {
            product = await db.product.findUnique({
              where: { id: String(line.productId) },
            });
          }
          // Made-to-order items (no stock tracking) are not restocked, and their consumed
          // recipe ingredients are not returned either.
          if (!product || product.openingStock === null || product.openingStock === undefined) continue;
          const qty = baseQuantity(line, product);

          {
            const currentStock = Number(product.openingStock ?? 0);
            const newStock = round3(currentStock + qty);

            let updatedVariants = product.variants;
            if (line.variantLabel && product.variants) {
              try {
                let vars = typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
                if (Array.isArray(vars)) {
                  vars = vars.map((v: any) => {
                    if (v.label === line.variantLabel && v.stock !== undefined) {
                      return { ...v, stock: Number(v.stock || 0) + qty };
                    }
                    return v;
                  });
                  updatedVariants = JSON.stringify(vars);
                }
              } catch {}
            }

            await db.product.update({
              where: { id: product.id },
              data: {
                openingStock: newStock,
                variants: updatedVariants,
                updatedAt: new Date(),
              },
            });
          }

          // Create incoming Stock Movement
          await db.stockMovement.create({
            data: {
              module: order.module || 'minimart',
              productId: String(line.productId || 'manual'),
              productName: line.name || product?.name || 'Returned Product',
              type: 'in',
              quantity: qty,
              unitCost: product?.costPrice || null,
              unitPrice: Number(line.unitPrice || 0),
              reason: 'Sales Return / Customer Refund',
              note: `Return for Order #${order.id}. Reason: ${reason || 'Customer Return'}`,
              createdBy: toOptionalStr(req.body.createdBy) || null,
              date: new Date(),
            },
          });

          // Put the returned units back into the batches this order's sale drew from
          try {
            const saleMovements = await db.stockMovement.findMany({
              where: { productId: product.id, type: 'out', reason: 'POS Sale', id: { startsWith: `sale_${order.id}_` } },
            });
            let left = qty;
            for (const m of saleMovements) {
              if (left <= 0) break;
              left = round3(left - (await restoreAllocations(db, m.id, left)));
            }
            await syncProductNearestBatch(db, product.id);
          } catch (batchErr) {
            console.warn('[Refund] Batch restore failed:', batchErr);
          }
          await evaluateStockAlerts(db, [product.id]).catch(() => undefined);
        }
      }

      const totalRefund = Number(refundAmount || 0);

      // 2. Adjust Cash Drawer if refunded in Cash
      const pMode = String(paymentMode || 'cash').toLowerCase();
      if (pMode === 'cash' && totalRefund > 0) {
        try {
          const todayDrawer = await db.cashDrawer.findFirst({
            where: { status: 'open' },
            orderBy: { date: 'desc' },
          });
          if (todayDrawer) {
            await db.cashDrawer.update({
              where: { id: todayDrawer.id },
              data: {
                cashOut: (todayDrawer.cashOut || 0) + totalRefund,
              },
            });
          }
        } catch (drawerErr) {
          console.warn('[Refund] Cash Drawer update error:', drawerErr);
        }
      }

      // 3. Adjust Customer Khata if refunded to Khata account or if order was on Khata
      const custName = customerName || order.customerName;
      let updatedKhata: any = null;
      if ((pMode === 'khata' || order.orderType === 'khata' || (req.body as any).khataId) && totalRefund > 0) {
        try {
          let khata: any = null;
          const targetKhataId = (req.body as any).khataId;
          if (targetKhataId) {
            khata = await db.customerKhata.findUnique({ where: { id: String(targetKhataId) } });
          }
          if (!khata && custName) {
            khata = await db.customerKhata.findFirst({
              where: { name: custName },
            });
            if (!khata) {
              const cleanName = custName.replace(/\s*\(.*?\)\s*/g, '').trim();
              khata = await db.customerKhata.findFirst({
                where: { name: cleanName },
              });
            }
            if (!khata) {
              const allKhatas = await db.customerKhata.findMany();
              const cn = custName.toLowerCase().trim();
              khata = allKhatas.find((k: any) => {
                const kn = (k.name || '').toLowerCase().trim();
                return kn && (cn === kn || cn.includes(kn) || kn.includes(cn));
              }) || null;
            }
          }

          if (khata) {
            const newDebt = Math.max(0, (khata.currentDebt || 0) - totalRefund);
            updatedKhata = await db.customerKhata.update({
              where: { id: khata.id },
              data: { currentDebt: newDebt, updatedAt: new Date() },
            });
            await db.khataTransaction.create({
              data: {
                khataId: khata.id,
                type: 'CREDIT',
                amount: totalRefund,
                balanceAfter: newDebt,
                description: `Refund Reversal - Invoice #${order.id}`,
                orderId: order.id,
                date: new Date(),
              },
            });
          }
        } catch (khataErr) {
          console.warn('[Refund] Khata update error:', khataErr);
        }
      }

      // 4. Create OrderRefund record
      const refund = await (db as any).orderRefund.create({
        data: {
          orderId: order.id,
          customerName: custName || 'Walk-In Customer',
          refundAmount: totalRefund,
          paymentMode: pMode,
          reason: reason || 'Customer Return',
          items: JSON.stringify(returnedLines || []),
        },
      });

      // 5. Update Order status & refundedAmount
      const prevRefunded = Number((order as any).refundedAmount || 0);
      const newRefundedTotal = prevRefunded + totalRefund;
      const isFullyRefunded = newRefundedTotal >= (order.totalAmount || 0);

      const updatedOrder = await db.order.update({
        where: { id: order.id },
        data: {
          refundedAmount: newRefundedTotal,
          stage: isFullyRefunded ? 'refunded' : order.stage,
          updatedAt: new Date(),
        } as any,
        include: { lines: true },
      });

      res.json({
        ok: true,
        refund,
        order: updatedOrder,
        updatedKhata,
      });
    } catch (err: any) {
      console.error('[Refund] Error processing refund:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Stock Movements ──
  // Every write is atomic (movement + product stock in one transaction) and idempotent
  // (re-posting the same id, or deleting an already-deleted id, is a no-op) so offline
  // retries from the client outbox can never double-apply stock or get stuck.

  /** Resolve the product a movement refers to: by id, else by name only when the name is unambiguous. */
  async function resolveMovementProduct(tx: any, productId?: string | null, productName?: string | null) {
    if (productId) {
      const byId = await tx.product.findUnique({ where: { id: String(productId) } });
      if (byId) return byId;
    }
    if (productName) {
      const byName = await tx.product.findMany({ where: { name: String(productName) }, take: 2 });
      if (byName.length === 1) return byName[0];
    }
    return null;
  }

  const movementDelta = (m: { type: string; quantity: number }) => (m.type === 'in' ? m.quantity : -m.quantity);

  /**
   * Weighted average cost after adding (qty > 0) or removing (qty < 0) units bought at unitCost.
   * Falls back to the incoming cost when there is no prior valued stock, and keeps the current
   * cost when a removal would leave no stock or a non-positive value.
   */
  function weightedAverageCost(stock: number, cost: number | null | undefined, qty: number, unitCost: number): number | null {
    const curStock = Math.max(0, stock || 0);
    const curCost = Number(cost || 0);
    const nextStock = curStock + qty;
    if (qty > 0) {
      if (curStock <= 0 || curCost <= 0) return round2(unitCost);
      return round2((curStock * curCost + qty * unitCost) / nextStock);
    }
    if (nextStock <= 0) return cost ?? null;
    const value = curStock * curCost + qty * unitCost;
    return value > 0 ? round2(value / nextStock) : cost ?? null;
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const toOptionalString = (v: unknown) => (v === undefined || v === null || v === '' ? null : String(v));

  app.get('/api/stock-movements', async (req: Request, res: Response) => {
    try {
      const module = req.query.module as string | undefined;
      const where = module ? { module } : {};
      const movements = await db.stockMovement.findMany({
        where,
        orderBy: { date: 'desc' },
      });
      res.json(movements);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Parse a movement's size/variant split ({ "S": 2, "M": 3 }) from JSON or object. */
  function parseAllocations(raw: unknown): Record<string, number> {
    let v: any = raw;
    try {
      if (typeof v === 'string') v = v.trim() ? JSON.parse(v) : {};
    } catch {
      return {};
    }
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const out: Record<string, number> = {};
    for (const [label, qty] of Object.entries(v)) {
      const n = round3(Number(qty));
      if (label && n > 0) out[label] = n;
    }
    return out;
  }

  /** Apply a size/variant split to a product's variants JSON (sign +1 adds, -1 removes). */
  function applyVariantAllocations(variantsRaw: unknown, allocations: Record<string, number>, sign: 1 | -1): string | null {
    let current: unknown = variantsRaw;
    let changed = false;
    for (const [label, qty] of Object.entries(allocations)) {
      const next = adjustVariantStockJson(current, label, sign * qty);
      if (next !== null) {
        current = next;
        changed = true;
      }
    }
    return changed ? (current as string) : null;
  }

  /**
   * Create one stock movement and apply it (stock, weighted average cost, size split, batches)
   * inside the caller's transaction. Idempotent by id: an existing id is returned unchanged.
   */
  async function createMovementTx(tx: any, b: any) {
    if (b.id) {
      const existing = await tx.stockMovement.findUnique({ where: { id: String(b.id) } });
      if (existing) return existing;
    }
    const allocations = parseAllocations(b.variantAllocations);
    const created = await tx.stockMovement.create({
      data: {
        ...(b.id ? { id: String(b.id) } : {}),
        module: b.module || 'minimart',
        productId: b.productId || '',
        productName: b.productName || 'Unknown Product',
        type: b.type === 'out' ? 'out' : 'in',
        quantity: Math.max(0, round3(Number(b.quantity || 0))),
        unitCost: b.unitCost ? Number(b.unitCost) : null,
        unitPrice: b.unitPrice ? Number(b.unitPrice) : null,
        reason: b.reason || null,
        note: b.note || b.referenceInvoice || null,
        vendorName: toOptionalString(b.vendorName),
        referenceInvoice: toOptionalString(b.referenceInvoice),
        batchNumber: toOptionalString(b.batchNumber),
        expiryDate: toOptionalString(b.expiryDate),
        createdBy: toOptionalString(b.createdBy),
        variantAllocations: Object.keys(allocations).length ? JSON.stringify(allocations) : null,
        correctionOf: toOptionalString(b.correctionOf),
        ...(b.date ? { date: new Date(b.date) } : {}),
      },
    });

    const product = await resolveMovementProduct(tx, b.productId, b.productName);
    if (product) {
      const isIn = created.type === 'in';
      const variants = Object.keys(allocations).length ? applyVariantAllocations(product.variants, allocations, isIn ? 1 : -1) : null;
      await tx.product.update({
        where: { id: product.id },
        data: {
          openingStock: Math.max(0, round3((product.openingStock || 0) + movementDelta(created))),
          costPrice:
            isIn && created.unitCost
              ? weightedAverageCost(product.openingStock || 0, product.costPrice, created.quantity, created.unitCost)
              : product.costPrice,
          ...(variants !== null ? { variants } : {}),
          ...(isIn && created.batchNumber ? { batchNumber: created.batchNumber } : {}),
          ...(isIn && created.expiryDate ? { expiryDate: created.expiryDate } : {}),
        },
      });
      // Batch-wise stock: receipts with a batch / expiry open a batch, outflows draw FEFO
      if (isIn) {
        await openBatchForReceipt(tx, { ...created, productId: product.id });
      } else {
        await consumeFefo(tx, product.id, created.quantity, created.id);
      }
      await syncProductNearestBatch(tx, product.id);
      await evaluateStockAlerts(tx, [product.id]);
    }
    return created;
  }

  app.post('/api/stock-movements', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      if (body.reason === 'Stock Count Adjustment' && refuseWithoutStockAdjust(req, res)) return;
      const movement = await db.$transaction((tx: any) =>
        createMovementTx(tx, { ...body, createdBy: body.createdBy || requestUser(req)?.name })
      );
      res.json(movement);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Reverse a stock entry: instead of deleting history, post an equal and opposite entry
   * (reason "Reversal") and mark the original as reversed. Stock, average cost, size split and
   * batches are restored. Idempotent: reversing again returns the existing reversal.
   */
  async function reverseMovement(tx: any, id: string, by?: string | null, why?: string | null) {
    const original = await tx.stockMovement.findUnique({ where: { id } });
    if (!original) return { notFound: true };
    if (original.reversalOf) throw Object.assign(new Error('A reversal entry cannot itself be reversed.'), { status: 400 });
    const reversalId = `rev_${original.id}`;
    if (original.reversedAt) {
      return { original, reversal: await tx.stockMovement.findUnique({ where: { id: reversalId } }), alreadyReversed: true };
    }

    const reversal = await tx.stockMovement.create({
      data: {
        id: reversalId,
        module: original.module,
        productId: original.productId,
        productName: original.productName,
        type: original.type === 'in' ? 'out' : 'in',
        quantity: original.quantity,
        unitCost: original.unitCost,
        unitPrice: original.unitPrice,
        reason: 'Reversal',
        note: `Reversal of "${original.reason || original.type}" entry #${original.id.slice(-8)}${why ? ` — ${why}` : ''}`,
        vendorName: original.vendorName,
        referenceInvoice: original.referenceInvoice,
        batchNumber: original.batchNumber,
        expiryDate: original.expiryDate,
        variantAllocations: original.variantAllocations,
        createdBy: toOptionalString(by),
        reversalOf: original.id,
        date: new Date(),
      },
    });
    const updatedOriginal = await tx.stockMovement.update({
      where: { id: original.id },
      data: { reversedAt: new Date(), reversedBy: toOptionalString(by) },
    });

    const product = await resolveMovementProduct(tx, original.productId, original.productName);
    if (product) {
      const allocations = parseAllocations(original.variantAllocations);
      const variants = Object.keys(allocations).length
        ? applyVariantAllocations(product.variants, allocations, original.type === 'in' ? -1 : 1)
        : null;
      await tx.product.update({
        where: { id: product.id },
        data: {
          openingStock: Math.max(0, round3((product.openingStock || 0) - movementDelta(original))),
          // Undo this receipt's contribution to the weighted average cost
          ...(original.type === 'in' && original.unitCost
            ? { costPrice: weightedAverageCost(product.openingStock || 0, product.costPrice, -original.quantity, original.unitCost) }
            : {}),
          ...(variants !== null ? { variants } : {}),
        },
      });
      if (original.type === 'in') {
        await resizeReceiptBatch(tx, original.id, -original.quantity);
      } else {
        await restoreAllocations(tx, original.id);
      }
      await syncProductNearestBatch(tx, product.id);
      await evaluateStockAlerts(tx, [product.id]);
    }
    return { original: updatedOriginal, reversal };
  }

  app.post('/api/stock-movements/:id/reverse', async (req: Request, res: Response) => {
    try {
      if (refuseWithoutStockAdjust(req, res)) return;
      const id = String(req.params.id);
      const by = req.body?.createdBy || requestUser(req)?.name;
      const result: any = await db.$transaction((tx: any) => reverseMovement(tx, id, by, req.body?.reason));
      if (result.notFound) return res.status(404).json({ error: `Stock movement ${id} not found` });
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // Kept for older clients and queued offline deletes: a delete now posts a reversal
  // (history is never erased). Unknown ids are a no-op so retries never get stuck.
  app.delete('/api/stock-movements/:id', async (req: Request, res: Response) => {
    try {
      if (refuseWithoutStockAdjust(req, res)) return;
      const id = String(req.params.id);
      const by = (req.query.by as string | undefined) || requestUser(req)?.name;
      const result: any = await db.$transaction((tx: any) => reverseMovement(tx, id, by));
      if (result.notFound) return res.json({ success: true, alreadyDeleted: true });
      res.json({ success: true, reversed: true, ...result });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  /** Fields whose change alters stock or value; editing any of them posts a correction. */
  const STOCK_FIELDS = ['quantity', 'type', 'unitCost', 'productId', 'variantAllocations'] as const;

  /**
   * Edit a stock entry.
   * - Descriptive fields only (note, reason, vendor, invoice, date, name): updated in place.
   * - Anything that moves stock or value (qty, type, cost, product, size split): the original is
   *   reversed and a corrected entry is posted (id from `newId`, linked by `correctionOf`), so the
   *   ledger keeps the full history. Response: the corrected entry (or the updated one).
   */
  app.put('/api/stock-movements/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const b = { ...(req.body || {}) };
      b.createdBy = b.createdBy || requestUser(req)?.name;
      // Descriptive-only edits (e.g. the legacy label clean-up) are allowed for any inventory user;
      // anything that changes stock or value needs Stock Corrections.
      const touchesStock = ['quantity', 'type', 'unitCost', 'productId', 'variantAllocations'].some((f) => b[f] !== undefined);
      if (touchesStock && refuseWithoutStockAdjust(req, res)) return;

      const result = await db.$transaction(async (tx: any) => {
        const prev = await tx.stockMovement.findUnique({ where: { id } });
        if (!prev) return null;
        if (prev.reversedAt || prev.reversalOf) {
          throw Object.assign(new Error('Reversed entries and reversal entries cannot be edited.'), { status: 400 });
        }

        const nextAlloc = b.variantAllocations !== undefined ? JSON.stringify(parseAllocations(b.variantAllocations)) : undefined;
        const prevAlloc = JSON.stringify(parseAllocations(prev.variantAllocations));
        const stockChanged = STOCK_FIELDS.some((f) => {
          if (b[f] === undefined) return false;
          if (f === 'quantity') return round3(Number(b.quantity)) !== prev.quantity;
          if (f === 'unitCost') return (b.unitCost ? Number(b.unitCost) : null) !== prev.unitCost;
          if (f === 'type') return (b.type === 'out' ? 'out' : 'in') !== prev.type;
          if (f === 'variantAllocations') return nextAlloc !== prevAlloc;
          return String(b[f]) !== String(prev[f]);
        });

        const meta = {
          ...(b.module ? { module: b.module } : {}),
          ...(b.productName ? { productName: b.productName } : {}),
          ...(b.unitPrice !== undefined ? { unitPrice: b.unitPrice ? Number(b.unitPrice) : null } : {}),
          ...(b.reason !== undefined ? { reason: b.reason } : {}),
          ...(b.note !== undefined ? { note: b.note || null } : {}),
          ...(b.vendorName !== undefined ? { vendorName: toOptionalString(b.vendorName) } : {}),
          ...(b.referenceInvoice !== undefined ? { referenceInvoice: toOptionalString(b.referenceInvoice) } : {}),
          ...(b.date ? { date: new Date(b.date) } : {}),
        };

        if (!stockChanged) {
          return tx.stockMovement.update({ where: { id }, data: meta });
        }

        await reverseMovement(tx, id, b.createdBy, 'corrected');
        const merged = {
          module: prev.module,
          productId: prev.productId,
          productName: prev.productName,
          type: prev.type,
          quantity: prev.quantity,
          unitCost: prev.unitCost,
          unitPrice: prev.unitPrice,
          reason: prev.reason,
          note: prev.note,
          vendorName: prev.vendorName,
          referenceInvoice: prev.referenceInvoice,
          batchNumber: prev.batchNumber,
          expiryDate: prev.expiryDate,
          variantAllocations: prev.variantAllocations,
          date: prev.date,
          ...meta,
          ...(b.productId !== undefined ? { productId: b.productId } : {}),
          ...(b.type !== undefined ? { type: b.type } : {}),
          ...(b.quantity !== undefined ? { quantity: b.quantity } : {}),
          ...(b.unitCost !== undefined ? { unitCost: b.unitCost } : {}),
          ...(b.batchNumber !== undefined ? { batchNumber: b.batchNumber } : {}),
          ...(b.expiryDate !== undefined ? { expiryDate: b.expiryDate } : {}),
          ...(b.variantAllocations !== undefined ? { variantAllocations: b.variantAllocations } : {}),
          id: b.newId ? String(b.newId) : `${id}_c${Date.now().toString(36)}`,
          createdBy: b.createdBy ?? prev.createdBy,
          correctionOf: id,
        };
        return createMovementTx(tx, merged);
      });

      if (!result) return res.status(404).json({ error: `Stock movement ${id} not found` });
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  /**
   * Set low-stock alert limits for many products at once. Only minThreshold is written, so
   * stock and prices can never be overwritten from a stale screen.
   * Body: { items: [{ id, minThreshold: number | null }] } (null = use the store default).
   */
  app.post('/api/products/alert-limits', async (req: Request, res: Response) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      let updated = 0;
      await db.$transaction(async (tx: any) => {
        for (const it of items) {
          if (!it?.id) continue;
          const value = it.minThreshold === null || it.minThreshold === '' || it.minThreshold === undefined
            ? null
            : Math.max(0, round3(Number(it.minThreshold)));
          if (value !== null && !Number.isFinite(value)) continue;
          const r = await tx.product.updateMany({ where: { id: String(it.id) }, data: { minThreshold: value } });
          updated += r.count;
        }
        await evaluateStockAlerts(tx, items.map((it: any) => String(it?.id || '')));
      });
      res.json({ ok: true, updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Low-stock alerts ──

  /**
   * Active alerts (open, not snoozed) with the product's live stock, limit and a suggested
   * reorder quantity (14 days of average sales over the last 30 days, on top of the limit).
   * ?include=all also returns dismissed and snoozed alerts.
   */
  app.get('/api/stock-alerts', async (req: Request, res: Response) => {
    try {
      const includeAll = req.query.include === 'all';
      const now = new Date();
      const rows = await (db as any).stockAlert.findMany({
        where: includeAll
          ? { status: { in: ['open', 'dismissed'] } }
          : { status: 'open', OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: now } }] },
        orderBy: { createdAt: 'desc' },
      });
      const storeDefault = await readLowStockDefault(db);
      const ids = rows.map((r: any) => r.productId);
      const products = await db.product.findMany({ where: { id: { in: ids } } });
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sales = await db.stockMovement.findMany({
        where: { productId: { in: ids }, type: 'out', reason: { in: ['POS Sale', 'Recipe Usage'] }, reversedAt: null, date: { gte: since } },
        select: { productId: true, quantity: true },
      });
      const sold = new Map<string, number>();
      for (const s of sales) sold.set(s.productId, (sold.get(s.productId) || 0) + s.quantity);

      const out = rows.map((r: any) => {
        const p: any = products.find((x: any) => x.id === r.productId);
        const stock = Number(p?.openingStock ?? r.stockAtAlert) || 0;
        const limit = p ? alertLimitFor(p, storeDefault) : r.limitAtAlert;
        const daily = (sold.get(r.productId) || 0) / 30;
        const suggested = Math.max(1, Math.ceil(daily * 14 + (limit || 0) - stock));
        return {
          ...r,
          stock,
          limit,
          unit: p?.unit || null,
          costPrice: p?.costPrice ?? null,
          module: p?.module || null,
          suggestedQty: suggested,
        };
      });
      res.json(out);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/stock-alerts/read-all', async (_req: Request, res: Response) => {
    try {
      const r = await (db as any).stockAlert.updateMany({ where: { status: 'open', readAt: null }, data: { readAt: new Date() } });
      res.json({ ok: true, updated: r.count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/stock-alerts/:id/:action', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const action = String(req.params.action);
      let data: any;
      if (action === 'read') data = { readAt: new Date() };
      else if (action === 'dismiss') data = { status: 'dismissed', readAt: new Date() };
      else if (action === 'snooze') {
        const hours = Math.min(24 * 30, Math.max(1, Number(req.body?.hours) || 24));
        data = { snoozedUntil: new Date(Date.now() + hours * 60 * 60 * 1000), readAt: new Date() };
      } else return res.status(400).json({ error: `Unknown action "${action}"` });
      const r = await (db as any).stockAlert.updateMany({ where: { id }, data });
      if (r.count === 0) return res.status(404).json({ error: 'Alert not found' });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/stock-batches', async (req: Request, res: Response) => {
    try {
      const productId = req.query.productId as string | undefined;
      const openOnly = req.query.open === '1';
      const rows = await (db as any).stockBatch.findMany({
        where: { ...(productId ? { productId } : {}), ...(openOnly ? { remaining: { gt: 0 } } : {}) },
        orderBy: { receivedAt: 'asc' },
      });
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Vendors, Vendor Ledger & Purchase Bills ──
  // currentBalance is the running payable and only ever changes together with a
  // VendorTransaction row, inside one database transaction.

  const signedVendorAmount = (type: string, amount: number) => (type === 'PAYMENT' ? -amount : amount);

  const vendorData = (b: any) => ({
    name: String(b.name || b.companyName || 'Unnamed Vendor'),
    companyName: toOptionalString(b.companyName),
    contactPerson: toOptionalString(b.contactPerson),
    phone: toOptionalString(b.phone),
    email: toOptionalString(b.email),
    address: toOptionalString(b.address),
    category: toOptionalString(b.category),
    notes: toOptionalString(b.notes),
  });

  app.get('/api/vendors', async (_req: Request, res: Response) => {
    try {
      res.json(await (db as any).vendor.findMany({ orderBy: { createdAt: 'desc' } }));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/vendors', async (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      const opening = Number(b.openingBalance || 0);
      const vendor = await db.$transaction(async (tx: any) => {
        const existing = b.id ? await tx.vendor.findUnique({ where: { id: String(b.id) } }) : null;
        if (existing) {
          // Editing the opening balance shifts the running balance by the same amount
          const shift = b.openingBalance !== undefined ? opening - (existing.openingBalance || 0) : 0;
          return tx.vendor.update({
            where: { id: existing.id },
            data: {
              ...vendorData({ ...existing, ...b }),
              ...(b.openingBalance !== undefined ? { openingBalance: opening } : {}),
              currentBalance: (existing.currentBalance || 0) + shift,
            },
          });
        }
        return tx.vendor.create({
          data: {
            ...(b.id ? { id: String(b.id) } : {}),
            ...vendorData(b),
            openingBalance: opening,
            currentBalance: opening,
          },
        });
      });
      res.json(vendor);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/vendors/:id', async (req: Request, res: Response) => {
    try {
      await (db as any).vendor.deleteMany({ where: { id: String(req.params.id) } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/vendor-transactions', async (req: Request, res: Response) => {
    try {
      const vendorId = req.query.vendorId as string | undefined;
      res.json(
        await (db as any).vendorTransaction.findMany({
          where: vendorId ? { vendorId } : {},
          orderBy: { date: 'desc' },
        })
      );
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /** Post a ledger entry and move the vendor's running balance atomically (idempotent by id). */
  async function postVendorTransaction(tx: any, t: any) {
    if (t.id) {
      const existing = await tx.vendorTransaction.findUnique({ where: { id: String(t.id) } });
      if (existing) return { transaction: existing, vendor: await tx.vendor.findUnique({ where: { id: existing.vendorId } }) };
    }
    const vendor = await tx.vendor.findUnique({ where: { id: String(t.vendorId) } });
    if (!vendor) throw Object.assign(new Error(`Vendor ${t.vendorId} not found`), { status: 404 });
    const type = ['BILL', 'PAYMENT', 'ADJUSTMENT'].includes(t.type) ? t.type : 'BILL';
    const amount = Number(t.amount || 0);
    const balanceAfter = (vendor.currentBalance || 0) + signedVendorAmount(type, amount);
    const transaction = await tx.vendorTransaction.create({
      data: {
        ...(t.id ? { id: String(t.id) } : {}),
        vendorId: vendor.id,
        type,
        amount,
        balanceAfter,
        description: toOptionalString(t.description),
        billId: toOptionalString(t.billId),
        paymentMethod: toOptionalString(t.paymentMethod),
        createdBy: toOptionalString(t.createdBy),
        ...(t.date ? { date: new Date(t.date) } : {}),
      },
    });
    const updatedVendor = await tx.vendor.update({ where: { id: vendor.id }, data: { currentBalance: balanceAfter } });
    return { transaction, vendor: updatedVendor };
  }

  app.post('/api/vendor-transactions', async (req: Request, res: Response) => {
    try {
      const result = await db.$transaction((tx: any) => postVendorTransaction(tx, req.body || {}));
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  const billData = (b: any) => ({
    billNumber: String(b.billNumber || '').trim(),
    vendorId: toOptionalString(b.vendorId),
    vendorName: String(b.vendorName || 'Supplier'),
    vendorPhone: toOptionalString(b.vendorPhone),
    billDate: String(b.billDate || new Date().toISOString().slice(0, 10)),
    lines: typeof b.lines === 'string' ? b.lines : JSON.stringify(Array.isArray(b.lines) ? b.lines : []),
    subtotal: Number(b.subtotal || 0),
    discountAmount: Number(b.discountAmount || 0),
    taxAmount: Number(b.taxAmount || 0),
    grandTotal: Number(b.grandTotal || 0),
    paidAmount: Number(b.paidAmount || 0),
    paymentMode: String(b.paymentMode || 'cash'),
    paymentStatus: String(b.paymentStatus || 'unpaid'),
    notes: toOptionalString(b.notes),
    createdBy: toOptionalString(b.createdBy),
    ...(b.createdAt ? { createdAt: new Date(b.createdAt) } : {}),
  });

  const parseBill = (row: any) => {
    if (!row) return row;
    let lines: any[] = [];
    try {
      lines = JSON.parse(row.lines || '[]');
    } catch {
      lines = [];
    }
    return { ...row, lines };
  };

  app.get('/api/purchase-bills', async (_req: Request, res: Response) => {
    try {
      const rows = await (db as any).purchaseBill.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(rows.map(parseBill));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/purchase-bills', async (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      const data = billData(b);
      if (!data.billNumber) return res.status(400).json({ error: 'Bill number is required' });

      const sameNumber = await (db as any).purchaseBill.findUnique({ where: { billNumber: data.billNumber } });
      if (sameNumber && sameNumber.id !== b.id) {
        return res.status(409).json({ error: `Purchase bill #${data.billNumber} already exists`, code: 'DUPLICATE_BILL' });
      }
      const existing = b.id ? await (db as any).purchaseBill.findUnique({ where: { id: String(b.id) } }) : null;
      const saved = existing
        ? await (db as any).purchaseBill.update({ where: { id: existing.id }, data })
        : await (db as any).purchaseBill.create({ data: { ...(b.id ? { id: String(b.id) } : {}), ...data } });
      res.json(parseBill(saved));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Receive a purchase bill atomically: the bill, its stock-in entries (with size split, batch,
   * expiry, landed cost), the vendor ledger rows and retail price updates are written in ONE
   * transaction — all or nothing. Idempotent by bill id (a retry returns the stored bill).
   * Body: { bill, vendor?, movements[], vendorTransactions[], productUpdates[] }.
   */
  app.post('/api/purchase-bills/receive', async (req: Request, res: Response) => {
    try {
      const { bill, vendor, movements = [], vendorTransactions = [], productUpdates = [] } = req.body || {};
      if (!bill?.id) return res.status(400).json({ error: 'Bill id is required' });
      const data = billData(bill);
      if (!data.billNumber) return res.status(400).json({ error: 'Bill number is required' });
      const by = toOptionalString(bill.createdBy) || requestUser(req)?.name || null;

      const result = await db.$transaction(async (tx: any) => {
        const existing = await tx.purchaseBill.findUnique({ where: { id: String(bill.id) } });
        if (existing) return { bill: parseBill(existing), alreadyReceived: true };

        const sameNumber = await tx.purchaseBill.findUnique({ where: { billNumber: data.billNumber } });
        if (sameNumber) {
          throw Object.assign(new Error(`Purchase bill #${data.billNumber} already exists`), { status: 409, code: 'DUPLICATE_BILL' });
        }

        // Vendor typed in on the bill may not have reached the backend yet
        if (vendor?.id && !(await tx.vendor.findUnique({ where: { id: String(vendor.id) } }))) {
          const opening = Number(vendor.openingBalance || 0);
          await tx.vendor.create({ data: { id: String(vendor.id), ...vendorData(vendor), openingBalance: opening, currentBalance: opening } });
        }

        const saved = await tx.purchaseBill.create({ data: { id: String(bill.id), ...data, createdBy: by } });

        const createdMovements = [];
        for (const m of Array.isArray(movements) ? movements : []) {
          createdMovements.push(await createMovementTx(tx, { ...m, type: 'in', createdBy: m.createdBy || by }));
        }
        const ledger = [];
        for (const t of Array.isArray(vendorTransactions) ? vendorTransactions : []) {
          ledger.push((await postVendorTransaction(tx, { ...t, createdBy: t.createdBy || by })).transaction);
        }
        for (const u of Array.isArray(productUpdates) ? productUpdates : []) {
          if (!u?.id || !(Number(u.price) > 0)) continue;
          await tx.product.updateMany({ where: { id: String(u.id) }, data: { price: Number(u.price) } });
        }
        return { bill: parseBill(saved), movements: createdMovements, ledger };
      });

      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    }
  });

  /**
   * Catch-up import of vendor data held in the renderer's localStorage (first run after
   * upgrade, or entries written while the backend was unreachable). Inserts only what the
   * server does not have. Ledger rows for vendors created in this same import are stored
   * as-is (the vendor's balance already includes them); rows for vendors the server already
   * had are posted normally so the running balance moves.
   */
  app.post('/api/vendors/import', async (req: Request, res: Response) => {
    try {
      const { vendors = [], transactions = [], bills = [] } = req.body || {};
      const summary = await db.$transaction(async (tx: any) => {
        const created = new Set<string>();
        let txCount = 0;
        let billCount = 0;

        for (const v of Array.isArray(vendors) ? vendors : []) {
          if (!v?.id) continue;
          const exists = await tx.vendor.findUnique({ where: { id: String(v.id) } });
          if (exists) continue;
          const opening = Number(v.openingBalance || 0);
          await tx.vendor.create({
            data: {
              id: String(v.id),
              ...vendorData(v),
              openingBalance: opening,
              currentBalance: Number(v.currentBalance ?? opening),
              ...(v.createdAt ? { createdAt: new Date(v.createdAt) } : {}),
            },
          });
          created.add(String(v.id));
        }

        const sortedTx = (Array.isArray(transactions) ? [...transactions] : []).sort(
          (a: any, b: any) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
        );
        for (const t of sortedTx) {
          if (!t?.id || !t.vendorId) continue;
          const exists = await tx.vendorTransaction.findUnique({ where: { id: String(t.id) } });
          if (exists) continue;
          const vendorExists = await tx.vendor.findUnique({ where: { id: String(t.vendorId) } });
          if (!vendorExists) continue;
          if (created.has(String(t.vendorId))) {
            await tx.vendorTransaction.create({
              data: {
                id: String(t.id),
                vendorId: String(t.vendorId),
                type: String(t.type || 'BILL'),
                amount: Number(t.amount || 0),
                balanceAfter: Number(t.balanceAfter || 0),
                description: toOptionalString(t.description),
                billId: toOptionalString(t.billId),
                paymentMethod: toOptionalString(t.paymentMethod),
                ...(t.date ? { date: new Date(t.date) } : {}),
              },
            });
          } else {
            await postVendorTransaction(tx, t);
          }
          txCount++;
        }

        for (const b of Array.isArray(bills) ? bills : []) {
          if (!b?.id || !b.billNumber) continue;
          const exists = await tx.purchaseBill.findUnique({ where: { id: String(b.id) } });
          if (exists) continue;
          const data = billData(b);
          const numberTaken = await tx.purchaseBill.findUnique({ where: { billNumber: data.billNumber } });
          await tx.purchaseBill.create({
            data: { id: String(b.id), ...data, ...(numberTaken ? { billNumber: `${data.billNumber}-${String(b.id).slice(-4)}` } : {}) },
          });
          billCount++;
        }

        return { vendors: created.size, transactions: txCount, bills: billCount };
      });
      res.json({ ok: true, imported: summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Settings ──
  app.get('/api/settings/:key', async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const setting = await db.appSetting.findUnique({ where: { key } });
      res.json(setting ? JSON.parse(setting.value) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/:key', async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const setting = await db.appSetting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(req.body) },
        update: { value: JSON.stringify(req.body) },
      });
      if (key === LOW_STOCK_DEFAULT_SETTING) {
        await evaluateStockAlerts(db).catch((e: any) => console.warn('[StockAlert]', e));
      }
      res.json(JSON.parse(setting.value));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Kitchen KDS ──
  app.get('/api/kitchen/tickets', async (_req: Request, res: Response) => {
    try {
      const tickets = await db.kitchenTicket.findMany({
        where: { status: { in: ['pending', 'cooking', 'ready'] } },
        include: { order: { include: { lines: true } } },
        orderBy: { createdAt: 'asc' },
      });
      res.json(tickets);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/kitchen/tickets', async (req: Request, res: Response) => {
    try {
      const { customerName, orderType, lines } = req.body;

      const rawLines = Array.isArray(lines) ? lines : [];
      const orderLines = await Promise.all(
        rawLines.map(async (l: any) => {
          let validProductId: string | null = null;
          const candidateId =
            l.productId ||
            (l.id && !String(l.id).startsWith('item_') && !String(l.id).startsWith('line_')
              ? String(l.id)
              : null);

          if (candidateId) {
            try {
              const productExists = await db.product.findUnique({
                where: { id: candidateId },
                select: { id: true },
              });
              if (productExists) {
                validProductId = productExists.id;
              }
            } catch {
              validProductId = null;
            }
          }

          return {
            productId: validProductId,
            name: l.name || 'Rush Order Item',
            unitPrice: Number(l.unitPrice) || 0,
            quantity: Number(l.quantity) || 1,
            variantLabel: l.variantLabel || null,
            notes: l.notes || null,
          };
        })
      );

      const order = await db.order.create({
        data: {
          module: 'fastfood',
          orderType: (orderType || 'dine-in').toLowerCase(),
          customerName: customerName || 'Rush / Manual Kitchen Ticket',
          totalAmount: 0,
          stage: 'kot',
          isSynced: true,
          updatedAt: new Date(),
          lines: {
            create: orderLines,
          },
        },
        include: { lines: true },
      });

      const ticket = await db.kitchenTicket.create({
        data: {
          orderId: order.id,
          orderType: orderType ? String(orderType).toUpperCase() : 'DINE-IN',
          status: 'pending',
          notes: customerName || null,
        },
        include: { order: { include: { lines: true } } },
      });

      res.status(201).json(ticket);
    } catch (err: any) {
      console.error('[API POST /api/kitchen/tickets] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/kitchen/tickets/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await db.kitchenTicket.delete({
        where: { id },
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/kitchen/tickets/:id/status', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const ticket = await db.kitchenTicket.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      });
      res.json(ticket);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Customer Khata (Ledger) ──
  app.get('/api/khata', async (_req: Request, res: Response) => {
    try {
      const khatas = await db.customerKhata.findMany({
        include: { entries: { orderBy: { date: 'desc' }, take: 10 } },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(khatas);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/khata', async (req: Request, res: Response) => {
    try {
      const khata = await db.customerKhata.create({
        data: {
          ...req.body,
          currentDebt: Number(req.body.currentDebt || 0),
          creditLimit: Number(req.body.creditLimit || 50000),
          updatedAt: new Date(),
        },
      });
      res.json(khata);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/khata/:id/transaction', async (req: Request, res: Response) => {
    try {
      const khataId = String(req.params.id);
      const { type, amount, description, orderId } = req.body; // type: "DEBIT" | "CREDIT"
      const current = await db.customerKhata.findUniqueOrThrow({ where: { id: khataId } });
      const numAmount = Number(amount);
      const newDebt = type === 'DEBIT' ? current.currentDebt + numAmount : current.currentDebt - numAmount;

      const [entry] = await db.$transaction([
        db.khataTransaction.create({
          data: {
            khataId,
            type,
            amount: numAmount,
            balanceAfter: newDebt,
            description,
            orderId,
          },
        }),
        db.customerKhata.update({
          where: { id: khataId },
          data: { currentDebt: newDebt, updatedAt: new Date() },
        }),
      ]);

      res.json(entry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Expenses & Cash Drawer ──
  app.get('/api/expenses', async (_req: Request, res: Response) => {
    try {
      const expenses = await db.expense.findMany({ orderBy: { date: 'desc' } });
      res.json(expenses);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/expenses', async (req: Request, res: Response) => {
    try {
      const expense = await db.expense.create({
        data: {
          category: req.body.category || 'Other',
          amount: parseFloat(req.body.amount) || 0,
          paymentMode: req.body.paymentMode || 'cash',
          description: req.body.description || null,
          vendorName: req.body.vendorName || null,
          receiptNo: req.body.receiptNo || null,
          date: req.body.date ? new Date(req.body.date) : new Date(),
        },
      });
      res.json(expense);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cash-drawer', async (_req: Request, res: Response) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let drawer = await db.cashDrawer.findFirst({
        where: { date: { gte: todayStart } },
        orderBy: { date: 'desc' },
      });

      if (!drawer) {
        drawer = await db.cashDrawer.create({
          data: {
            openingFloat: 5000,
            cashSales: 0,
            cashIn: 0,
            cashOut: 0,
            status: 'open',
          },
        });
      }
      res.json(drawer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cash-drawer/action', async (req: Request, res: Response) => {
    try {
      const { id, type, amount, notes } = req.body; // type: "CASH_IN" | "CASH_OUT" | "CLOSE"
      const drawer = await db.cashDrawer.findUniqueOrThrow({ where: { id } });
      const num = parseFloat(amount) || 0;

      let updated;
      if (type === 'CASH_IN') {
        updated = await db.cashDrawer.update({
          where: { id },
          data: { cashIn: drawer.cashIn + num, notes },
        });
      } else if (type === 'CASH_OUT') {
        updated = await db.cashDrawer.update({
          where: { id },
          data: { cashOut: drawer.cashOut + num, notes },
        });
      } else if (type === 'CLOSE') {
        const expected = drawer.openingFloat + drawer.cashSales + drawer.cashIn - drawer.cashOut;
        updated = await db.cashDrawer.update({
          where: { id },
          data: { status: 'closed', closingCash: num || expected, closedAt: new Date(), notes },
        });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Analytics & Profit/Loss Report ──
  app.get('/api/reports/analytics', async (_req: Request, res: Response) => {
    try {
      const orders = await db.order.findMany({ include: { lines: true } });
      const expenses = await db.expense.findMany();
      const products = await db.product.findMany();
      let refunds: any[] = [];
      try {
        refunds = await (db as any).orderRefund.findMany();
      } catch {}

      let totalGrossSales = 0;
      let totalDiscounts = 0;
      let totalSalesAfterDiscount = 0;

      for (const ord of orders) {
        const sub = (ord.lines || []).reduce((s: number, l: any) => s + (l.unitPrice || 0) * (l.quantity || 1), 0);
        totalGrossSales += sub;
        const netOrd = typeof ord.totalAmount === 'number' && ord.totalAmount >= 0
          ? ord.totalAmount
          : Math.max(0, sub - ((sub * (ord.discountPercent || 0)) / 100));
        totalSalesAfterDiscount += netOrd;
        totalDiscounts += Math.max(0, sub - netOrd);
      }

      const totalRefunds = refunds.reduce((sum: number, r: any) => sum + (r.refundAmount || 0), 0);
      const netSales = Math.max(0, totalSalesAfterDiscount - totalRefunds);
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      // Estimate Cost of Goods Sold (COGS)
      const costMap = new Map<string, number>(products.map((p: any) => [p.id, Number(p.costPrice || (p.price * 0.6))]));
      let estimatedCOGS = 0;
      const itemCountMap: Record<string, { name: string; count: number; revenue: number }> = {};

      for (const ord of orders) {
        for (const line of ord.lines) {
          const cost = Number((line.productId ? costMap.get(line.productId) : null) || (line.unitPrice * 0.6));
          estimatedCOGS += cost * line.quantity;

          if (!itemCountMap[line.name]) {
            itemCountMap[line.name] = { name: line.name, count: 0, revenue: 0 };
          }
          itemCountMap[line.name].count += line.quantity;
          itemCountMap[line.name].revenue += line.unitPrice * line.quantity;
        }
      }

      const grossProfit = netSales - estimatedCOGS;
      const netProfit = grossProfit - totalExpenses;
      const topSellingItems = Object.values(itemCountMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.json({
        totalGrossSales,
        totalDiscounts,
        totalRefunds,
        netSales,
        estimatedCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        totalOrdersCount: orders.length,
        topSellingItems,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Database Wipe (Clear all records, keep schema) ──
  app.post('/api/database/wipe', async (_req: Request, res: Response) => {
    try {
      await db.$transaction([
        db.kitchenTicket.deleteMany(),
        db.orderItem.deleteMany(),
        db.order.deleteMany(),
        db.product.deleteMany(),
        db.category.deleteMany(),
        db.khataTransaction.deleteMany(),
        db.customerKhata.deleteMany(),
        db.stockMovement.deleteMany(),
        (db as any).vendorTransaction.deleteMany(),
        (db as any).vendor.deleteMany(),
        (db as any).purchaseBill.deleteMany(),
        (db as any).stockBatch.deleteMany(),
        (db as any).batchAllocation.deleteMany(),
        (db as any).stockAlert.deleteMany(),
        db.expense.deleteMany(),
        db.cashDrawer.deleteMany(),
        db.syncOutbox.deleteMany(),
      ]);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

