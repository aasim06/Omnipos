import { app } from 'electron';
import { PrismaClient } from '@prisma/client';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function getSavedLicenseKey(): string | null {
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

export function getPosDbPath(): string {
  const userData = app.getPath('userData');
  return join(userData, 'pos.db');
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
  }

  if (!prisma) {
    currentDbPath = targetDbPath;
    prisma = new PrismaClient({
      datasources: {
        db: { url: `file:${targetDbPath.replaceAll('\\', '/')}` },
      },
    });
  }

  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
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
      "minThreshold" INTEGER,
      "openingStock" INTEGER,
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
      "quantity" INTEGER NOT NULL,
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
      "quantity" INTEGER NOT NULL,
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

  // Auto-seed initial products if none exist
  const count = await database.product.count();
  if (count === 0) {
    await seedInitialData(database);
  }

  isInitialized = true;
}

async function seedInitialData(db: PrismaClient): Promise<void> {
  const initialProducts = [
    {
      id: "prod_ff_1",
      module: "fastfood",
      name: "Crispy Zinger Burger",
      category: "Burger",
      costPrice: 320,
      price: 550,
      skuCode: "SKU-89915275",
      rackLocation: "Kitchen A-01",
      unit: "PCS",
      minThreshold: 10,
      openingStock: 50,
      description: "Crispy chicken fillet with Mayo & Lettuce",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_ff_2",
      module: "fastfood",
      name: "Double Cheese Burger",
      category: "Burger",
      costPrice: 450,
      price: 720,
      skuCode: "SKU-61339903",
      rackLocation: "Kitchen A-02",
      unit: "PCS",
      minThreshold: 10,
      openingStock: 40,
      description: "Two beef patties with double cheddar cheese",
      imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_mm_1",
      module: "minimart",
      name: "seal 80*10",
      category: "General",
      costPrice: 18,
      price: 25,
      skuCode: "SKU-89915275",
      rackLocation: "Rack A-01",
      unit: "PCS",
      minThreshold: 10,
      openingStock: 50,
      description: "Industrial Seal 80x10",
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "prod_mm_2",
      module: "minimart",
      name: "Oil Filter Premium",
      category: "Automotive",
      costPrice: 850,
      price: 1200,
      skuCode: "SKU-61339903",
      rackLocation: "Rack B-03",
      unit: "PCS",
      minThreshold: 5,
      openingStock: 25,
      description: "Universal High Flow Oil Filter",
      imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
    }
  ];

  for (const p of initialProducts) {
    await db.product.create({
      data: {
        ...p,
        updatedAt: new Date(),
      },
    });
  }

  const initialCategories = [
    { id: "cat_1", module: "fastfood", name: "Burger" },
    { id: "cat_2", module: "fastfood", name: "Pizza" },
    { id: "cat_3", module: "fastfood", name: "Beverages" },
    { id: "cat_4", module: "minimart", name: "General" },
    { id: "cat_5", module: "minimart", name: "Automotive" },
  ];

  for (const c of initialCategories) {
    await db.category.create({ data: c });
  }
}
