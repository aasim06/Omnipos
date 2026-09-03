import { Express, Request, Response } from 'express';
import { getPrisma } from '../database/client';

export function registerRoutes(app: Express): void {
  const db = getPrisma();

  // ── Products ──
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const module = req.query.module as string | undefined;
      const where = module ? { module } : {};
      const products = await db.product.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const product = await db.product.create({
        data: {
          ...req.body,
          updatedAt: new Date(),
        },
      });
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const product = await db.product.update({
        where: { id },
        data: {
          ...req.body,
          updatedAt: new Date(),
        },
      });
      res.json(product);
    } catch (err: any) {
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

  // ── Categories ──
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const module = req.query.module as string | undefined;
      const where = module ? { module } : {};
      const categories = await db.category.findMany({ where, orderBy: { name: 'asc' } });
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/categories', async (req: Request, res: Response) => {
    try {
      const cat = await db.category.create({ data: req.body });
      res.json(cat);
    } catch (err: any) {
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

      const order = await db.order.create({
        data: {
          ...orderData,
          isSynced: true,
          updatedAt: new Date(),
          lines: {
            create: (lines || []).map((line: any) => ({
              productId: line.productId,
              name: line.name,
              unitPrice: Number(line.unitPrice),
              quantity: Number(line.quantity),
              variantLabel: line.variantLabel,
              notes: line.notes,
            })),
          },
        },
        include: { lines: true },
      });

      // Deduct inventory stock for each sold product line
      if (Array.isArray(lines)) {
        for (const line of lines) {
          if (line.productId) {
            try {
              const product = await db.product.findUnique({
                where: { id: String(line.productId) },
              });
              if (product && product.openingStock !== null && product.openingStock !== undefined) {
                const soldQty = Number(line.quantity || 1);
                const newStock = Math.max(0, product.openingStock - soldQty);
                await db.product.update({
                  where: { id: String(line.productId) },
                  data: {
                    openingStock: newStock,
                    updatedAt: new Date(),
                  },
                });
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

  // ── Stock Movements ──
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

  app.post('/api/stock-movements', async (req: Request, res: Response) => {
    try {
      const movement = await db.stockMovement.create({
        data: {
          ...req.body,
          quantity: Number(req.body.quantity),
          unitCost: req.body.unitCost ? Number(req.body.unitCost) : null,
          unitPrice: req.body.unitPrice ? Number(req.body.unitPrice) : null,
        },
      });

      // Automatically synchronize Product stock in database
      if (req.body.productId || req.body.productName) {
        try {
          const product = await db.product.findFirst({
            where: {
              OR: [
                ...(req.body.productId ? [{ id: req.body.productId }] : []),
                ...(req.body.productName ? [{ name: req.body.productName }] : []),
              ],
            },
          });
          if (product) {
            const delta = movement.type === 'in' ? movement.quantity : -movement.quantity;
            const updatedStock = Math.max(0, (product.openingStock || 0) + delta);
            await db.product.update({
              where: { id: product.id },
              data: {
                openingStock: updatedStock,
                costPrice: (movement.type === 'in' && movement.unitCost) ? movement.unitCost : product.costPrice,
              },
            });
          }
        } catch (stockErr) {
          console.error('[Stock Sync Error]:', stockErr);
        }
      }

      res.json(movement);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/stock-movements/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const existing = await db.stockMovement.findUnique({ where: { id } });
      if (existing) {
        try {
          const product = await db.product.findFirst({
            where: {
              OR: [
                ...(existing.productId ? [{ id: existing.productId }] : []),
                ...(existing.productName ? [{ name: existing.productName }] : []),
              ],
            },
          });
          if (product) {
            // Revert stock delta
            const delta = existing.type === 'in' ? -existing.quantity : existing.quantity;
            const updatedStock = Math.max(0, (product.openingStock || 0) + delta);
            await db.product.update({
              where: { id: product.id },
              data: { openingStock: updatedStock },
            });
          }
        } catch (stockErr) {
          console.error('[Stock Revert Error]:', stockErr);
        }
      }

      await db.stockMovement.delete({ where: { id } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/stock-movements/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const prev = await db.stockMovement.findUnique({ where: { id } });
      const updated = await db.stockMovement.update({
        where: { id },
        data: {
          ...req.body,
          quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
          unitCost: req.body.unitCost !== undefined ? (req.body.unitCost ? Number(req.body.unitCost) : null) : undefined,
          unitPrice: req.body.unitPrice !== undefined ? (req.body.unitPrice ? Number(req.body.unitPrice) : null) : undefined,
        },
      });

      if (prev && req.body.quantity !== undefined) {
        try {
          const product = await db.product.findFirst({
            where: {
              OR: [
                ...(updated.productId ? [{ id: updated.productId }] : []),
                ...(updated.productName ? [{ name: updated.productName }] : []),
              ],
            },
          });
          if (product) {
            const prevDelta = prev.type === 'in' ? prev.quantity : -prev.quantity;
            const newDelta = updated.type === 'in' ? updated.quantity : -updated.quantity;
            const diff = newDelta - prevDelta;
            const updatedStock = Math.max(0, (product.openingStock || 0) + diff);
            await db.product.update({
              where: { id: product.id },
              data: {
                openingStock: updatedStock,
                costPrice: (updated.type === 'in' && updated.unitCost) ? updated.unitCost : product.costPrice,
              },
            });
          }
        } catch (stockErr) {
          console.error('[Stock Update Error]:', stockErr);
        }
      }

      res.json(updated);
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

      const totalGrossSales = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
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

      const grossProfit = totalGrossSales - estimatedCOGS;
      const netProfit = grossProfit - totalExpenses;
      const topSellingItems = Object.values(itemCountMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      res.json({
        totalGrossSales,
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

  // ── Khata (Customer Ledger) ──
  const localKhataList: any[] = [
    {
      id: 'khata-local-1',
      name: 'Haji Aslam (Grocery)',
      phone: '+92 301 2345678',
      address: 'Shop #3, Market',
      currentDebt: 4500,
      creditLimit: 20000,
      entries: [
        { id: 'tx-1', date: new Date().toISOString(), type: 'DEBIT', amount: 4500, description: 'Monthly Ration items' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'khata-local-2',
      name: 'Malik Zeeshan',
      phone: '+92 321 9876543',
      address: 'House #14, Street 2',
      currentDebt: 1200,
      creditLimit: 10000,
      entries: [
        { id: 'tx-2', date: new Date().toISOString(), type: 'DEBIT', amount: 1200, description: 'Snacks & Drinks' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  app.get('/api/khata', async (_req: Request, res: Response) => {
    res.json(localKhataList);
  });

  app.post('/api/khata', async (req: Request, res: Response) => {
    const { name, phone, address, currentDebt } = req.body;
    const newKhata = {
      id: `khata-${Date.now()}`,
      name: name || 'Unnamed Customer',
      phone: phone || '',
      address: address || '',
      currentDebt: Number(currentDebt) || 0,
      creditLimit: 15000,
      entries: currentDebt
        ? [{ id: `tx-${Date.now()}`, date: new Date().toISOString(), type: 'DEBIT', amount: Number(currentDebt), description: 'Initial balance' }]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localKhataList.unshift(newKhata);
    res.json(newKhata);
  });

  app.post('/api/khata/:id/transaction', async (req: Request, res: Response) => {
    const id = req.params.id;
    const { type, amount, description } = req.body;
    const khata = localKhataList.find((k) => k.id === id);
    if (!khata) return res.status(404).json({ error: 'Khata not found' });
    const amt = Number(amount) || 0;
    khata.entries.unshift({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      amount: amt,
      description: description || '',
    });
    if (type === 'DEBIT') khata.currentDebt += amt;
    else khata.currentDebt = Math.max(0, khata.currentDebt - amt);
    khata.updatedAt = new Date().toISOString();
    res.json({ ok: true, khata });
  });

  // ── Sync Status ──
  app.get('/api/sync/status', async (_req: Request, res: Response) => {
    try {
      const pendingCount = await db.syncOutbox.count({ where: { status: 'pending' } });
      res.json({ pendingCount, isOnline: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
