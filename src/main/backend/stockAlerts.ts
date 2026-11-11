/**
 * Low-stock alerts.
 *
 * After anything changes a product's stock or alert limit, evaluateStockAlerts() compares the
 * stock with the item's limit (Product.minThreshold; empty = store default from AppSetting
 * "inventory.lowStockDefault"; 0 = off) and keeps at most ONE active alert per product:
 *   - stock falls to/below the limit  → open a "low" alert (or "out" at 0)
 *   - low → out                       → escalate the same alert and mark it unread again
 *   - stock back above the limit      → resolve the alert automatically
 * Dismissing hides an alert until it resolves (or escalates to "out"); snoozing hides it
 * until a time. Helpers accept a Prisma client or transaction client.
 */

type Db = any;

export const LOW_STOCK_DEFAULT_SETTING = 'inventory.lowStockDefault';
const FALLBACK_DEFAULT = 10;
const ACTIVE = ['open', 'dismissed'];

/** Store-wide default limit (AppSetting value { value: n }). */
export async function readLowStockDefault(db: Db): Promise<number> {
  try {
    const row = await db.appSetting.findUnique({ where: { key: LOW_STOCK_DEFAULT_SETTING } });
    const n = Number(row ? JSON.parse(row.value)?.value : NaN);
    return Number.isFinite(n) && n >= 0 ? n : FALLBACK_DEFAULT;
  } catch {
    return FALLBACK_DEFAULT;
  }
}

/** The limit that applies to a product, or null when its alert is off. */
export function alertLimitFor(p: { minThreshold?: number | null }, storeDefault: number): number | null {
  if (p.minThreshold === null || p.minThreshold === undefined) return storeDefault > 0 ? storeDefault : null;
  return p.minThreshold > 0 ? p.minThreshold : null;
}

/** 'low' | 'out' | null (fine / not tracked / alert off). */
export function alertLevelFor(p: { openingStock?: number | null; minThreshold?: number | null }, storeDefault: number): 'low' | 'out' | null {
  if (p.openingStock === null || p.openingStock === undefined) return null;
  const stock = Number(p.openingStock) || 0;
  if (stock <= 0) return 'out';
  const limit = alertLimitFor(p, storeDefault);
  return limit !== null && stock <= limit ? 'low' : null;
}

/** Re-check the given products (or all stock-tracked products when ids is omitted). */
export async function evaluateStockAlerts(db: Db, productIds?: string[]): Promise<void> {
  const storeDefault = await readLowStockDefault(db);
  const products = productIds
    ? await db.product.findMany({ where: { id: { in: Array.from(new Set(productIds.filter(Boolean))) } } })
    : await db.product.findMany({ where: { openingStock: { not: null } } });

  for (const p of products) {
    const level = alertLevelFor(p, storeDefault);
    const active = await db.stockAlert.findFirst({
      where: { productId: p.id, status: { in: ACTIVE } },
      orderBy: { createdAt: 'desc' },
    });
    const limit = alertLimitFor(p, storeDefault);

    if (!level) {
      if (active) {
        await db.stockAlert.update({ where: { id: active.id }, data: { status: 'resolved', resolvedAt: new Date() } });
      }
      continue;
    }

    if (!active) {
      await db.stockAlert.create({
        data: {
          productId: p.id,
          productName: p.name,
          level,
          stockAtAlert: Number(p.openingStock) || 0,
          limitAtAlert: limit,
          status: 'open',
        },
      });
      continue;
    }

    const escalated = active.level === 'low' && level === 'out';
    await db.stockAlert.update({
      where: { id: active.id },
      data: {
        level,
        productName: p.name,
        stockAtAlert: Number(p.openingStock) || 0,
        limitAtAlert: limit,
        // Running out re-opens a dismissed / snoozed / read alert so it is seen again
        ...(escalated ? { status: 'open', readAt: null, snoozedUntil: null } : {}),
      },
    });
  }
}
