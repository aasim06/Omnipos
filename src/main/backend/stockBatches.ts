/**
 * Batch-wise stock with FEFO (first-expiry-first-out).
 *
 * A stock-in that carries a batch number or expiry date opens a StockBatch. Every stock-out
 * (sale, recipe usage, manual deduction) draws from open batches, earliest expiry first
 * (batches without an expiry last, then oldest receipt), and records BatchAllocation rows so a
 * reversal or customer return can put the units back into the same batch. Stock that was never
 * received under a batch is treated as having no expiry and is simply not tracked per batch.
 *
 * All helpers take a Prisma transaction client.
 */

/** Round to 3 decimals so decimal quantities (KG, L) don't drift. */
export const round3 = (n: number): number => Math.round((Number(n) || 0) * 1000) / 1000;

type Tx = any;

/** Open a batch for a stock-in movement that has a batch number or expiry date. */
export async function openBatchForReceipt(
  tx: Tx,
  movement: { id: string; productId: string; quantity: number; unitCost?: number | null; batchNumber?: string | null; expiryDate?: string | null; date?: Date }
): Promise<void> {
  if (!movement.batchNumber && !movement.expiryDate) return;
  if (await tx.stockBatch.findUnique({ where: { movementId: movement.id } })) return;
  await tx.stockBatch.create({
    data: {
      productId: movement.productId,
      movementId: movement.id,
      batchNumber: movement.batchNumber || null,
      expiryDate: movement.expiryDate || null,
      quantity: round3(movement.quantity),
      remaining: round3(movement.quantity),
      unitCost: movement.unitCost ?? null,
      ...(movement.date ? { receivedAt: movement.date } : {}),
    },
  });
}

/** Draw `qty` from the product's open batches, earliest expiry first. Returns the quantity allocated. */
export async function consumeFefo(tx: Tx, productId: string, qty: number, movementId: string): Promise<number> {
  let needed = round3(qty);
  if (needed <= 0) return 0;
  const open = await tx.stockBatch.findMany({ where: { productId, remaining: { gt: 0 } } });
  open.sort((a: any, b: any) => {
    if (a.expiryDate && b.expiryDate && a.expiryDate !== b.expiryDate) return a.expiryDate < b.expiryDate ? -1 : 1;
    if (a.expiryDate && !b.expiryDate) return -1;
    if (!a.expiryDate && b.expiryDate) return 1;
    return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
  });
  let allocated = 0;
  for (const batch of open) {
    if (needed <= 0) break;
    const take = round3(Math.min(needed, batch.remaining));
    if (take <= 0) continue;
    await tx.stockBatch.update({ where: { id: batch.id }, data: { remaining: round3(batch.remaining - take) } });
    await tx.batchAllocation.create({ data: { movementId, batchId: batch.id, quantity: take } });
    needed = round3(needed - take);
    allocated = round3(allocated + take);
  }
  return allocated;
}

/**
 * Put up to `qty` units of an out-movement back into the batches it drew from (most recent
 * allocation first). Omit `qty` to restore everything.
 */
export async function restoreAllocations(tx: Tx, movementId: string, qty?: number): Promise<number> {
  const allocations = await tx.batchAllocation.findMany({ where: { movementId }, orderBy: { createdAt: 'desc' } });
  let left = qty === undefined ? Infinity : round3(qty);
  let restored = 0;
  for (const a of allocations) {
    if (left <= 0) break;
    const back = round3(Math.min(left, a.quantity));
    const batch = await tx.stockBatch.findUnique({ where: { id: a.batchId } });
    if (batch) {
      await tx.stockBatch.update({ where: { id: batch.id }, data: { remaining: round3(Math.min(batch.quantity, batch.remaining + back)) } });
    }
    if (back >= a.quantity) {
      await tx.batchAllocation.delete({ where: { id: a.id } });
    } else {
      await tx.batchAllocation.update({ where: { id: a.id }, data: { quantity: round3(a.quantity - back) } });
    }
    left = round3(left - back);
    restored = round3(restored + back);
  }
  return restored;
}

/** Change the size of the batch opened by a stock-in movement (edit or reversal of that receipt). */
export async function resizeReceiptBatch(tx: Tx, movementId: string, delta: number): Promise<void> {
  const batch = await tx.stockBatch.findUnique({ where: { movementId } });
  if (!batch || !delta) return;
  await tx.stockBatch.update({
    where: { id: batch.id },
    data: {
      quantity: round3(Math.max(0, batch.quantity + delta)),
      remaining: round3(Math.max(0, batch.remaining + delta)),
    },
  });
}

/** Keep Product.batchNumber / expiryDate pointing at the earliest-expiring open batch. */
export async function syncProductNearestBatch(tx: Tx, productId: string): Promise<void> {
  const batches = await tx.stockBatch.findMany({ where: { productId } });
  if (batches.length === 0) return;
  const open = batches
    .filter((b: any) => b.remaining > 0)
    .sort((a: any, b: any) => {
      if (a.expiryDate && b.expiryDate) return a.expiryDate < b.expiryDate ? -1 : a.expiryDate > b.expiryDate ? 1 : 0;
      return a.expiryDate ? -1 : b.expiryDate ? 1 : 0;
    });
  const nearest = open[0];
  await tx.product.update({
    where: { id: productId },
    data: { batchNumber: nearest?.batchNumber ?? null, expiryDate: nearest?.expiryDate ?? null },
  });
}
