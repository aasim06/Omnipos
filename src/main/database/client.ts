import { app } from 'electron';
import { PrismaClient } from '@prisma/client';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { createHash } from 'node:crypto';

export function getSavedLicenseKey(): string | null {
  try {
    const file = join(app.getPath('userData'), 'license.dat');
    if (existsSync(file)) {
      const key = readFileSync(file, 'utf-8').trim();
      if (key) return key;
    }
  } catch { /* ignore */ }
  try {
    const cacheFile = join(app.getPath('userData'), 'license-cache.json');
    if (existsSync(cacheFile)) {
      const cache = JSON.parse(readFileSync(cacheFile, 'utf-8')) as { key?: string };
      if (cache?.key) return cache.key;
    }
  } catch { /* ignore */ }
  return null;
}

export function getPosDbPath(licenseKey?: string): string {
  const userData = app.getPath('userData');
  const key = licenseKey || getSavedLicenseKey();
  if (key) {
    const hash = createHash('sha256').update(key.trim().toUpperCase()).digest('hex').slice(0, 16);
    return join(userData, `pos_lic_${hash}.db`);
  }
  return join(userData, 'pos_default.db');
}

let prisma: PrismaClient | undefined;
let currentDbPath: string | undefined;
let isInitialized = false;

export function getPrisma(): PrismaClient {
  const targetDbPath = getPosDbPath();
  if (prisma && currentDbPath !== targetDbPath) {
    try {
      void prisma.$disconnect();
    } catch { /* ignore */ }
    prisma = undefined;
    isInitialized = false;
  }

  if (!prisma) {
    currentDbPath = targetDbPath;
    isInitialized = false;
    prisma = new PrismaClient({
      datasources: {
        db: { url: `file:${targetDbPath.replaceAll('\\', '/')}` },
      },
    });
    const activePrisma = prisma;
    initializeDatabase(activePrisma).catch((err) => {
      console.warn('[DB] initializeDatabase error:', err);
    });
  }

  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
    isInitialized = false;
  }
}

export async function initializeDatabase(database: PrismaClient = getPrisma()): Promise<void> {
  if (isInitialized) return;

  try {
    await database.$queryRawUnsafe('PRAGMA journal_mode = WAL');
    await database.$executeRawUnsafe('PRAGMA synchronous = NORMAL');
    await database.$executeRawUnsafe('PRAGMA temp_store = MEMORY');
  } catch {
    /* Ignore pragma errors */
  }

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "module" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "costPrice" REAL,
      "price" REAL NOT NULL,
      "category" TEXT NOT NULL,
      "skuCode" TEXT,
      "rackLocation" TEXT,
      "unit" TEXT,
      "minThreshold" REAL,
      "openingStock" REAL,
      "prepTime" INTEGER,
      "displayOrder" INTEGER DEFAULT 0,
      "tags" TEXT,
      "allergens" TEXT,
      "isAvailable" BOOLEAN NOT NULL DEFAULT 1,
      "imageBase64" TEXT,
      "imageUrl" TEXT,
      "variants" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "module" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "module" TEXT NOT NULL,
      "discountPercent" REAL NOT NULL DEFAULT 0,
      "customerName" TEXT,
      "orderType" TEXT,
      "stage" TEXT NOT NULL DEFAULT 'paid',
      "totalAmount" REAL NOT NULL DEFAULT 0,
      "refundedAmount" REAL NOT NULL DEFAULT 0,
      "syncStatus" TEXT NOT NULL DEFAULT 'synced',
      "isSynced" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OrderItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "productId" TEXT,
      "name" TEXT NOT NULL,
      "unitPrice" REAL NOT NULL,
      "quantity" REAL NOT NULL,
      "variantLabel" TEXT,
      "notes" TEXT,
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StockMovement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "module" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "productName" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "quantity" REAL NOT NULL,
      "unitCost" REAL,
      "unitPrice" REAL,
      "reason" TEXT,
      "note" TEXT,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "KitchenTicket" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderId" TEXT NOT NULL UNIQUE,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "orderType" TEXT,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CustomerKhata" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "phone" TEXT,
      "address" TEXT,
      "currentDebt" REAL NOT NULL DEFAULT 0,
      "creditLimit" REAL DEFAULT 50000,
      "note" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "KhataTransaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "khataId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "balanceAfter" REAL NOT NULL,
      "description" TEXT,
      "orderId" TEXT,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("khataId") REFERENCES "CustomerKhata"("id") ON DELETE CASCADE
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SyncOutbox" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "payload" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "retryCount" INTEGER NOT NULL DEFAULT 0,
      "lastError" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "syncedAt" DATETIME
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Expense" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "category" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "paymentMode" TEXT NOT NULL DEFAULT 'cash',
      "description" TEXT,
      "vendorName" TEXT,
      "receiptNo" TEXT,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CashDrawer" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "openingFloat" REAL NOT NULL DEFAULT 0,
      "cashSales" REAL NOT NULL DEFAULT 0,
      "cashIn" REAL NOT NULL DEFAULT 0,
      "cashOut" REAL NOT NULL DEFAULT 0,
      "closingCash" REAL,
      "status" TEXT NOT NULL DEFAULT 'open',
      "closedAt" DATETIME,
      "notes" TEXT
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppSetting" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  // Quotations / estimates (previously kept only on the till that created them)
  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Quotation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "quoteNumber" TEXT NOT NULL,
      "module" TEXT NOT NULL DEFAULT 'minimart',
      "customerName" TEXT NOT NULL,
      "customerPhone" TEXT,
      "customerAddress" TEXT,
      "lines" TEXT NOT NULL,
      "subtotal" REAL NOT NULL DEFAULT 0,
      "discountPercent" REAL NOT NULL DEFAULT 0,
      "discountAmount" REAL NOT NULL DEFAULT 0,
      "taxAmount" REAL,
      "totalAmount" REAL NOT NULL DEFAULT 0,
      "validUntil" DATETIME NOT NULL,
      "notes" TEXT,
      "terms" TEXT,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "convertedOrderId" TEXT,
      "convertedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OrderRefund" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "customerName" TEXT,
      "refundAmount" REAL NOT NULL,
      "paymentMode" TEXT NOT NULL DEFAULT 'cash',
      "reason" TEXT,
      "items" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
    )
  `);

  try {
    await database.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "refundedAmount" REAL DEFAULT 0`);
  } catch {
    /* Ignore if column already exists */
  }

  try {
    await database.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "syncStatus" TEXT DEFAULT 'synced'`);
  } catch {
    /* Ignore if column already exists */
  }

  try {
    await database.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "isSynced" BOOLEAN DEFAULT 0`);
  } catch {
    /* Ignore if column already exists */
  }

  // POS tile board: category colour, icon and order
  for (const col of [`"color" TEXT`, `"icon" TEXT`, `"displayOrder" INTEGER DEFAULT 0`]) {
    try {
      await database.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN ${col}`);
    } catch {
      /* Ignore if column already exists */
    }
  }

  // Stock manager (Phase 2): batch / expiry on products, vendor + invoice details on movements
  for (const col of [
    `"batchNumber" TEXT`, `"expiryDate" TEXT`, `"recipe" TEXT`, `"itemRole" TEXT`, `"barcode" TEXT`,
    `"primaryUnit" TEXT`, `"secondaryUnit" TEXT`, `"conversionRate" REAL`, `"secondaryPrice" REAL`,
  ]) {
    try {
      await database.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN ${col}`);
    } catch {
      /* Ignore if column already exists */
    }
  }
  for (const col of [
    `"vendorName" TEXT`, `"referenceInvoice" TEXT`, `"batchNumber" TEXT`, `"expiryDate" TEXT`,
    `"createdBy" TEXT`, `"reversalOf" TEXT`, `"reversedAt" DATETIME`, `"reversedBy" TEXT`,
    `"correctionOf" TEXT`, `"variantAllocations" TEXT`,
  ]) {
    try {
      await database.$executeRawUnsafe(`ALTER TABLE "StockMovement" ADD COLUMN ${col}`);
    } catch {
      /* Ignore if column already exists */
    }
  }

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Vendor" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "companyName" TEXT,
      "contactPerson" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "address" TEXT,
      "category" TEXT,
      "notes" TEXT,
      "openingBalance" REAL NOT NULL DEFAULT 0,
      "currentBalance" REAL NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VendorTransaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "vendorId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "balanceAfter" REAL NOT NULL,
      "description" TEXT,
      "billId" TEXT,
      "paymentMethod" TEXT,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE
    )
  `);

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PurchaseBill" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "billNumber" TEXT NOT NULL,
      "vendorId" TEXT,
      "vendorName" TEXT NOT NULL,
      "vendorPhone" TEXT,
      "billDate" TEXT NOT NULL,
      "lines" TEXT NOT NULL,
      "subtotal" REAL NOT NULL DEFAULT 0,
      "discountAmount" REAL NOT NULL DEFAULT 0,
      "taxAmount" REAL NOT NULL DEFAULT 0,
      "grandTotal" REAL NOT NULL DEFAULT 0,
      "paidAmount" REAL NOT NULL DEFAULT 0,
      "paymentMode" TEXT NOT NULL DEFAULT 'cash',
      "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);
  await database.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseBill_billNumber_key" ON "PurchaseBill"("billNumber")`);
  for (const [table, col] of [["VendorTransaction", `"createdBy" TEXT`], ["PurchaseBill", `"createdBy" TEXT`]]) {
    try {
      await database.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${col}`);
    } catch {
      /* Ignore if column already exists */
    }
  }

  // Payment details sent by the POS (orders were rejected without these columns)
  for (const col of [`"paymentMode" TEXT`, `"customerPhone" TEXT`, `"splitPayments" TEXT`, `"customerId" TEXT`]) {
    try {
      await database.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN ${col}`);
    } catch {
      /* Ignore if column already exists */
    }
  }

  // Customer profile fields the khata screens send (account creation was rejected without them)
  for (const [table, col] of [
    ["CustomerKhata", `"cnic" TEXT`],
    ["CustomerKhata", `"customerType" TEXT DEFAULT 'retail'`],
    ["CustomerKhata", `"dueDays" INTEGER DEFAULT 30`],
    ["KhataTransaction", `"paymentMethod" TEXT`],
    ["KhataTransaction", `"reversalOf" TEXT`],
    ["OrderRefund", `"creditNoteNo" TEXT`],
    ["Quotation", `"revisionOf" TEXT`],
    ["Quotation", `"advanceAmount" REAL NOT NULL DEFAULT 0`],
    ["Quotation", `"advanceKhataId" TEXT`],
    ["Quotation", `"sales" TEXT`],
    ["StockMovement", `"vendorId" TEXT`],
  ]) {
    try {
      await database.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${col}`);
    } catch {
      /* Ignore if column already exists */
    }
  }

  try {
    await database.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN "selectedUnit" TEXT`);
  } catch {
    /* Ignore if column already exists */
  }

  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StockAlert" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "productName" TEXT NOT NULL,
      "level" TEXT NOT NULL,
      "stockAtAlert" REAL NOT NULL,
      "limitAtAlert" REAL,
      "status" TEXT NOT NULL DEFAULT 'open',
      "readAt" DATETIME,
      "snoozedUntil" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "resolvedAt" DATETIME
    )
  `);
  await database.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StockAlert_productId_status_idx" ON "StockAlert"("productId", "status")`);

  // Batch-wise stock (FEFO). Quantity columns elsewhere are declared INTEGER on older
  // databases; SQLite still stores decimals in them, so no table rebuild is needed.
  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StockBatch" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "movementId" TEXT NOT NULL,
      "batchNumber" TEXT,
      "expiryDate" TEXT,
      "quantity" REAL NOT NULL,
      "remaining" REAL NOT NULL,
      "unitCost" REAL,
      "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await database.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "StockBatch_movementId_key" ON "StockBatch"("movementId")`);
  await database.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StockBatch_productId_idx" ON "StockBatch"("productId")`);
  await database.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BatchAllocation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "movementId" TEXT NOT NULL,
      "batchId" TEXT NOT NULL,
      "quantity" REAL NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await database.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BatchAllocation_movementId_idx" ON "BatchAllocation"("movementId")`);
  await database.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VendorTransaction_vendorId_idx" ON "VendorTransaction"("vendorId")`);

  isInitialized = true;
}


