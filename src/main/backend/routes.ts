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
      const parsed = products.map((p: any) => {
        let v = p.variants;
        if (typeof v === 'string') {
          try {
            v = JSON.parse(v);
          } catch {
            /* ignore */
          }
        }
        return { ...p, variants: v };
      });
      res.json(parsed);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const { hasVariants, itemRole, isKitchenRouted, pricingType, variants, ...safeData } = req.body;
      const variantsStr = Array.isArray(variants) ? JSON.stringify(variants) : typeof variants === 'string' ? variants : null;
      const product = await db.product.create({
        data: {
          ...safeData,
          ...(variantsStr ? { variants: variantsStr } : {}),
          updatedAt: new Date(),
        },
      });
      res.json({ ...product, variants: Array.isArray(variants) ? variants : product.variants });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { hasVariants, itemRole, isKitchenRouted, pricingType, variants, ...safeData } = req.body;
      const variantsStr = Array.isArray(variants) ? JSON.stringify(variants) : typeof variants === 'string' ? variants : null;
      const product = await db.product.update({
        where: { id },
        data: {
          ...safeData,
          ...(variantsStr ? { variants: variantsStr } : {}),
          updatedAt: new Date(),
        },
      });
      res.json({ ...product, variants: Array.isArray(variants) ? variants : product.variants });
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
      const { id, module, productId, productName, type, quantity, unitCost, unitPrice, reason, note, referenceInvoice, date } = req.body;
      const movement = await db.stockMovement.create({
        data: {
          ...(id ? { id } : {}),
          module: module || 'minimart',
          productId: productId || '',
          productName: productName || 'Unknown Product',
          type: type || 'in',
          quantity: Number(quantity || 0),
          unitCost: unitCost ? Number(unitCost) : null,
          unitPrice: unitPrice ? Number(unitPrice) : null,
          reason: reason || null,
          note: note || referenceInvoice || null,
          ...(date ? { date: new Date(date) } : {}),
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
      const { id: _id, module, productId, productName, type, quantity, unitCost, unitPrice, reason, note, referenceInvoice, date } = req.body;
      const updated = await db.stockMovement.update({
        where: { id },
        data: {
          ...(module ? { module } : {}),
          ...(productId ? { productId } : {}),
          ...(productName ? { productName } : {}),
          ...(type ? { type } : {}),
          ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
          ...(unitCost !== undefined ? { unitCost: unitCost ? Number(unitCost) : null } : {}),
          ...(unitPrice !== undefined ? { unitPrice: unitPrice ? Number(unitPrice) : null } : {}),
          ...(reason !== undefined ? { reason } : {}),
          ...(note !== undefined || referenceInvoice !== undefined ? { note: note || referenceInvoice || null } : {}),
          ...(date ? { date: new Date(date) } : {}),
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

  app.post('/api/kitchen/tickets', async (req: Request, res: Response) => {
    try {
      const { customerName, orderType, lines } = req.body;
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
            create: (lines || []).map((l: any) => ({
              productId: l.id || null,
              name: l.name,
              unitPrice: 0,
              quantity: Number(l.quantity) || 1,
              variantLabel: l.variantLabel || null,
              notes: l.notes || null,
            })),
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

