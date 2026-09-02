import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Food24Regular,
  FoodChickenLeg24Regular,
  FoodPizza24Regular,
  FoodApple24Regular,
  FoodCake24Regular,
  FoodFish24Regular,
  FoodGrains24Regular,
  FoodCarrot24Regular,
  FoodEgg24Regular,
  BowlSalad24Regular,
  DrinkCoffee24Regular,
  DrinkToGo24Regular,
  DrinkBeer24Regular,
  ShoppingBag24Regular,
  Search20Regular,
  Add20Regular,
  Add16Filled,
  Subtract20Regular,
  Delete20Regular,
  Checkmark20Filled,
  Tag20Regular,
  Dismiss16Regular,
  LeafOne20Regular,
  Fire20Regular,
  Star20Regular,
  CheckmarkCircle20Filled,
  Receipt20Regular,
  Dismiss20Regular,
  Money20Regular,
  Payment20Regular,
  Notebook20Regular,
} from '@fluentui/react-icons';
import { posApi, resolveApiUrl } from '@/lib/api';
import { Product, CartLine, Order, Category } from '@shared/types';
import { uid, nowISO } from '@/lib/utils';
import { useAppTheme } from '@/theme/AppProviders';
import { PosCounterSkeleton } from '@/components/skeletons/PageSkeletons';

/* ─── Fluent UI 2 Desktop Design Tokens (Dynamic Light / Dark) ───── */
function getTokens(isDark: boolean) {
  return {
    bgCanvas: isDark ? '#1A1A1A' : '#FAFAFA',      // Soft Mica / Content canvas
    bgCard: isDark ? '#242424' : '#FFFFFF',        // Pure white or elevated dark card surfaces
    bgSubtle: isDark ? '#2D2D2D' : '#F3F3F3',      // Neutral gray segment tracks and soft boxes
    bgHover: isDark ? '#383838' : '#EAEAEA',       // Hover states
    border: isDark ? '#3D3D3D' : '#E5E5E5',        // Crisp 1px desktop borders
    borderSubtle: isDark ? '#333333' : '#ECECEC',  // Interior dividers
    textPrimary: isDark ? '#FFFFFF' : '#1A1A1E',   // High-contrast Windows typography
    textSecondary: isDark ? '#ABABAB' : '#616161', // Secondary labels
    textMuted: isDark ? '#7E7E7E' : '#8C8C8C',     // Muted hints
    accentRed: '#E51937',                          // Strictly reserved red brand accent
    accentRedHover: isDark ? '#EC3953' : '#C6172E',
    accentRedSubtle: isDark ? 'rgba(229, 25, 55, 0.18)' : 'rgba(229, 25, 55, 0.08)',
    accentGreen: isDark ? '#34A853' : '#107C41',   // Fluent status green
    radiusSm: '4px',
    radiusMd: '8px',                              // 8px subtle corner radius on UI cards
    radiusLg: '12px',
    shadowCard: isDark
      ? '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.6)'
      : '0 1px 3px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.08)',
    shadowElevated: isDark
      ? '0 4px 14px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)'
      : '0 4px 14px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable', 'Segoe UI', sans-serif",
  };
}

/* ─── Icon Resolver ────────────────────────────────────────────────── */
function ProductIcon({ name, category, size = 24, color }: { name: string; category?: string; size?: number; color?: string }) {
  const n = (name + ' ' + (category ?? '')).toLowerCase();
  const style = { width: size, height: size, color: color || 'currentColor', flexShrink: 0 };

  if (n.includes('chicken') || n.includes('wing') || n.includes('leg')) return <FoodChickenLeg24Regular style={style} />;
  if (n.includes('pizza')) return <FoodPizza24Regular style={style} />;
  if (n.includes('fish') || n.includes('tuna') || n.includes('salmon')) return <FoodFish24Regular style={style} />;
  if (n.includes('cake') || n.includes('sweet') || n.includes('dessert') || n.includes('mithai')) return <FoodCake24Regular style={style} />;
  if (n.includes('apple') || n.includes('fruit')) return <FoodApple24Regular style={style} />;
  if (n.includes('rice') || n.includes('biryani') || n.includes('grain') || n.includes('wheat')) return <FoodGrains24Regular style={style} />;
  if (n.includes('egg') || n.includes('omelette')) return <FoodEgg24Regular style={style} />;
  if (n.includes('salad') || n.includes('greens') || n.includes('vegan') || n.includes('veg')) return <BowlSalad24Regular style={style} />;
  if (n.includes('carrot') || n.includes('vegetable') || n.includes('sabzi')) return <FoodCarrot24Regular style={style} />;
  if (n.includes('coffee') || n.includes('chai') || n.includes('tea') || n.includes('espresso')) return <DrinkCoffee24Regular style={style} />;
  if (n.includes('juice') || n.includes('shake') || n.includes('smoothie') || n.includes('cola') || n.includes('pepsi') || n.includes('drink')) return <DrinkToGo24Regular style={style} />;
  if (n.includes('beer') || n.includes('fizz') || n.includes('soda')) return <DrinkBeer24Regular style={style} />;
  if (n.includes('bread') || n.includes('roti') || n.includes('naan') || n.includes('toast')) return <FoodGrains24Regular style={style} />;
  if (n.includes('soup') || n.includes('curry') || n.includes('stew') || n.includes('bowl')) return <BowlSalad24Regular style={style} />;
  return <Food24Regular style={style} />;
}

function CategoryIcon({ cat, size = 16 }: { cat: string; size?: number }) {
  const c = cat.toLowerCase();
  const s = { width: size, height: size };
  if (c.includes('vegan') || c.includes('vegetarian')) return <LeafOne20Regular style={s} />;
  if (c.includes('street') || c.includes('snack') || c.includes('fast')) return <Fire20Regular style={s} />;
  if (c.includes('dessert') || c.includes('cake') || c.includes('sweet')) return <Star20Regular style={s} />;
  if (c.includes('drink') || c.includes('beverage')) return <DrinkToGo24Regular style={{ width: size, height: size }} />;
  return <Food24Regular style={{ width: size, height: size }} />;
}

/* ─── Addon Ingredients (Build Your Meal) ──────────────────────────── */
const ADDONS = [
  { icon: <FoodCarrot24Regular style={{ width: 18, height: 18 }} />, label: 'Veggies' },
  { icon: <FoodApple24Regular style={{ width: 18, height: 18 }} />, label: 'Fresh' },
  { icon: <LeafOne20Regular style={{ width: 18, height: 18 }} />, label: 'Herbs' },
  { icon: <FoodEgg24Regular style={{ width: 18, height: 18 }} />, label: 'Extra' },
  { icon: <FoodGrains24Regular style={{ width: 18, height: 18 }} />, label: 'Grains' },
];

interface PosCounterProps {
  module: 'fastfood' | 'minimart';
}

export function PosCounterView({ module }: PosCounterProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const F = React.useMemo(() => getTokens(isDark), [isDark]);

  /* State */
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([0, 2]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'khata'>('cash');
  const [selectedKhataId, setSelectedKhataId] = useState<string>('');

  /* Query Khatas for Credit / Udhaar payment */
  const { data: customerKhatas = [] } = useQuery({
    queryKey: ['khatas'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  /* Query Products */
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products', module],
    queryFn: () => posApi.fetchProducts(module),
  });

  /* Query Categories from Database */
  const { data: dbCategories = [] } = useQuery<Category[]>({
    queryKey: ['categories', module],
    queryFn: () => posApi.fetchCategories(module),
  });

  // Fluent Pivot Category Tabs (Dynamic from Database & Catalog)
  const allCategoryTabs = React.useMemo(() => {
    const fromDb = dbCategories.map((c) => c.name);
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set(['All', ...fromDb, ...fromProducts]));
  }, [dbCategories, products]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset state when switching between Fast Food and Mini Mart
  React.useEffect(() => {
    setSelectedProduct(null);
    setActiveCategory('All');
    setSearchTerm('');
  }, [module]);

  // Auto-select first item as hero in Fast Food mode
  React.useEffect(() => {
    if (module === 'fastfood' && filteredProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [module, filteredProducts.length]);

  /* Cart Operations */
  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.productId === product.id);
      if (exists) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: qty,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  /* Financial Totals */
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = (subtotal * discountPct) / 100;
  const total = Math.max(0, subtotal - discountVal + deliveryFee);

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'SAVE10') {
      setDiscountPct(10);
      setAppliedPromo(promoCode.trim());
    } else if (code === 'SAVE20') {
      setDiscountPct(20);
      setAppliedPromo(promoCode.trim());
    } else {
      setAppliedPromo('');
      setDiscountPct(0);
    }
    setPromoCode('');
  };

  /* Checkout Mutation */
  const { mutate: checkout, isPending } = useMutation({
    mutationFn: async () => {
      const selectedCustomer = customerKhatas.find((k: any) => k.id === selectedKhataId);

      const order: Order = {
        id: uid(),
        module,
        lines: cart,
        discountPercent: discountPct,
        totalAmount: total,
        customerName: paymentMode === 'khata' && selectedCustomer ? selectedCustomer.name : undefined,
        orderType: paymentMode === 'khata' ? 'khata' : 'dine-in',
        stage: 'paid',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await posApi.saveOrder(order);

      // If payment is via Khata, add debit transaction to customer ledger
      if (paymentMode === 'khata' && selectedKhataId) {
        try {
          const base = await resolveApiUrl();
          await fetch(`${base}/api/khata/${selectedKhataId}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'DEBIT',
              amount: total,
              paymentMethod: 'credit',
              description: `POS Bill #${order.id.slice(-6)} (${cart.length} items)`,
            }),
          });
        } catch (e) {
          console.error('[Khata] Failed to record credit transaction:', e);
        }
      }

      return order;
    },
    onSuccess: (savedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
      setLastOrder(savedOrder);
      setCart([]);
      setAppliedPromo('');
      setDiscountPct(0);
      setPaymentMode('cash');
      setSelectedKhataId('');
      setIsSuccess(true);
      setShowReceiptModal(true);
      setTimeout(() => setIsSuccess(false), 3000);
    },
  });

  const featured = selectedProduct ?? filteredProducts[0] ?? null;
  const sizes = ['Small', 'Regular', 'Large'];

  if (isLoadingProducts && products.length === 0) {
    return <PosCounterSkeleton module={module} />;
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: F.bgCanvas, fontFamily: F.font, overflow: 'hidden' }}>

      {/* ════════════════════════════════════════════════════════════════════
          LEFT CATALOG SECTION (Mica Surface & Fluent Pivot Tabs)
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Desktop Header Bar with Fluent Pivot Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            height: '56px',
            backgroundColor: F.bgCard,
            borderBottom: `1px solid ${F.border}`,
            flexShrink: 0,
          }}
        >
          {/* Fluent Pivot Tabs with clean red line indicators */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '4px', overflowX: 'auto' }}>
            {allCategoryTabs.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '100%',
                    padding: '0 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? `2.5px solid ${F.accentRed}` : '2.5px solid transparent',
                    color: isActive ? F.accentRed : F.textSecondary,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13.5px',
                    fontFamily: F.font,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    whiteSpace: 'nowrap',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = F.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = F.textSecondary;
                  }}
                >
                  <CategoryIcon cat={cat} size={15} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Subtle Rounded Desktop Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: F.bgSubtle,
              border: `1px solid ${F.border}`,
              borderRadius: F.radiusMd, // 8px subtle corner radius
              padding: '6px 12px',
              width: '240px',
              gap: '8px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <Search20Regular style={{ color: F.textMuted, width: 16, height: 16 }} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search catalog..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontFamily: F.font,
                fontSize: '13px',
                color: F.textPrimary,
                width: '100%',
              }}
            />
            {searchTerm && (
              <Dismiss16Regular
                style={{ cursor: 'pointer', color: F.textMuted, width: 14, height: 14 }}
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Fluent Hero Highlight Card (Meal Builder - Fast Food Only) ── */}
          {module === 'fastfood' && featured && (
            <div
              style={{
                backgroundColor: F.bgCard,
                borderRadius: F.radiusMd, // 8px radius
                border: `1px solid ${F.border}`,
                boxShadow: F.shadowCard,
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
              }}
            >
              {/* Product Visual Container */}
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: F.radiusMd, // 8px radius
                  backgroundColor: F.bgSubtle,
                  border: `1px solid ${F.borderSubtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {featured.imageUrl ? (
                  <img
                    src={featured.imageUrl}
                    alt={featured.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = (e.currentTarget as HTMLElement).nextElementSibling;
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{ display: featured.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <ProductIcon name={featured.name} category={featured.category} size={64} color={F.textPrimary} />
                </div>
              </div>

              {/* Product Info & Controls */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: F.textPrimary, lineHeight: 1.2 }}>
                      {featured.name}
                    </div>
                    <div style={{ fontSize: '13px', color: F.textSecondary, marginTop: '3px' }}>
                      {featured.category || 'Kitchen Preparation'} • {featured.openingStock ?? 25} in stock
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: F.accentRed }}>
                    PKR {(featured.price * selectedQty).toLocaleString()}
                  </div>
                </div>

                {/* Size Segmented Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Portion Size
                    </div>
                    <div style={{ display: 'flex', backgroundColor: F.bgSubtle, padding: '3px', borderRadius: F.radiusMd, border: `1px solid ${F.border}` }}>
                      {sizes.map((s, i) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(i)}
                          style={{
                            padding: '4px 14px',
                            borderRadius: F.radiusSm,
                            border: 'none',
                            backgroundColor: selectedSize === i ? F.bgCard : 'transparent',
                            color: selectedSize === i ? F.textPrimary : F.textSecondary,
                            fontWeight: selectedSize === i ? 700 : 500,
                            fontSize: '12.5px',
                            fontFamily: F.font,
                            cursor: 'pointer',
                            boxShadow: selectedSize === i ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Addons (Build Your Meal) */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Add-ons & Extras
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {ADDONS.map((addon, i) => {
                        const isSelected = selectedAddons.includes(i);
                        return (
                          <div
                            key={i}
                            onClick={() =>
                              setSelectedAddons((prev) =>
                                prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                              )
                            }
                            style={{
                              padding: '5px 10px',
                              borderRadius: F.radiusMd, // 8px radius
                              backgroundColor: isSelected ? F.accentRedSubtle : F.bgSubtle,
                              border: `1px solid ${isSelected ? F.accentRed : F.border}`,
                              color: isSelected ? F.accentRed : F.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              transition: 'all 0.12s ease',
                            }}
                          >
                            {addon.icon}
                            <span>{addon.label}</span>
                            {isSelected && <Checkmark20Filled style={{ width: 12, height: 12 }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Stepper & Add to Order Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '2px' }}>
                  {/* Fluent Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: F.bgSubtle, borderRadius: F.radiusMd, border: `1px solid ${F.border}` }}>
                    <button
                      onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                      style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.textPrimary }}
                    >
                      <Subtract20Regular style={{ width: 14, height: 14 }} />
                    </button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: F.textPrimary }}>
                      {selectedQty}
                    </span>
                    <button
                      onClick={() => setSelectedQty((q) => q + 1)}
                      style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.textPrimary }}
                    >
                      <Add20Regular style={{ width: 14, height: 14 }} />
                    </button>
                  </div>

                  {/* Add to Order Button */}
                  <button
                    onClick={() => {
                      addToCart(featured, selectedQty);
                      setSelectedQty(1);
                    }}
                    style={{
                      height: '36px',
                      padding: '0 20px',
                      borderRadius: F.radiusMd, // 8px subtle corner radius
                      backgroundColor: isDark ? F.accentRed : '#1A1A1E',
                      color: '#FFFFFF',
                      border: 'none',
                      fontFamily: F.font,
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? F.accentRedHover : '#2D2D35')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? F.accentRed : '#1A1A1E')}
                  >
                    <Add16Filled />
                    <span>Add to Order</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Product Catalog Grid (8px Corner Radius) ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: F.textPrimary }}>
                Menu Items ({filteredProducts.length})
              </div>
              <div style={{ fontSize: '12px', color: F.textMuted }}>
                Showing items in {activeCategory}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 1fr))', gap: '16px' }}>
              {filteredProducts.map((product) => {
                const isOut = product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= 0;
                const isSelected = selectedProduct?.id === product.id;
                const cartItem = cart.find((item) => item.productId === product.id);
                const inCartQty = cartItem ? cartItem.quantity : 0;
                const isLowStock = !isOut && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= (product.minThreshold ?? 10);

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (!isOut) {
                        setSelectedProduct(product);
                        setSelectedQty(1);
                      }
                    }}
                    style={{
                      backgroundColor: F.bgCard,
                      borderRadius: '12px',
                      border: `1px solid ${isSelected ? F.accentRed : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: isOut ? 'default' : 'pointer',
                      opacity: isOut ? 0.6 : 1,
                      boxShadow: isSelected
                        ? '0 0 0 2px #E51937, 0 8px 24px rgba(229, 25, 55, 0.25)'
                        : isDark
                        ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                        : '0 2px 10px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOut) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = isDark
                            ? '0 12px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)'
                            : '0 12px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(229,25,55,0.2)';
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(229,25,55,0.3)';
                        }
                        const img = e.currentTarget.querySelector('img');
                        if (img) img.style.transform = 'scale(1.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOut) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = isDark
                            ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                            : '0 2px 10px rgba(0, 0, 0, 0.04)';
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                        }
                        const img = e.currentTarget.querySelector('img');
                        if (img) img.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {/* ── Top Media Showcase (130px) ── */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '130px',
                        overflow: 'hidden',
                        backgroundColor: isDark ? '#18181B' : '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.35s ease',
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = (e.currentTarget as HTMLElement).nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}

                      {/* Fallback Graphic Pattern */}
                      <div
                        style={{
                          display: product.imageUrl ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          background: isDark
                            ? 'linear-gradient(135deg, #1f1f24 0%, #161619 100%)'
                            : 'linear-gradient(135deg, #F8FAFC 0%, #EDF2F7 100%)',
                        }}
                      >
                        <ProductIcon name={product.name} category={product.category} size={48} color={isSelected ? F.accentRed : F.textPrimary} />
                      </div>

                      {/* Subtle Ambient Dark Gradient on bottom edge of image */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%)',
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Floating Stock Badge (Glassmorphic Top-Right) */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          background: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.85)',
                          backdropFilter: 'blur(8px)',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isOut ? '#EF4444' : isLowStock ? '#F59E0B' : isDark ? '#FFFFFF' : '#111827',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isOut ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981',
                            boxShadow: `0 0 6px ${isOut ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981'}`,
                          }}
                        />
                        <span>{isOut ? 'OUT' : `${product.openingStock ?? '—'} left`}</span>
                      </div>

                      {/* Floating Category Capsule (Bottom-Left on image) */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          backgroundColor: 'rgba(229, 25, 55, 0.9)',
                          backdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {product.category || 'Retail'}
                      </div>

                      {/* In-Cart Glowing Indicator Pill */}
                      {inCartQty > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#107C41',
                            color: '#FFFFFF',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(16, 124, 65, 0.45)',
                          }}
                        >
                          <Checkmark20Filled style={{ width: 12, height: 12 }} />
                          <span>{inCartQty} in cart</span>
                        </div>
                      )}
                    </div>

                    {/* ── Card Content Body ── */}
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                      <div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: F.textPrimary,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '36px',
                          }}
                          title={product.name}
                        >
                          {product.name}
                        </div>
                        {product.skuCode && (
                          <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: F.textMuted, marginTop: '2px' }}>
                            {product.skuCode}
                          </div>
                        )}
                      </div>

                      {/* ── Price and Quick-Add Bar ── */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '4px' }}>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: F.textMuted, letterSpacing: '0.04em' }}>
                            PRICE
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#FF4D64' : F.accentRed, letterSpacing: '-0.01em' }}>
                            PKR {product.price.toLocaleString()}
                          </div>
                        </div>

                        {!isOut && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 1);
                            }}
                            title="Quick Add to Order"
                            style={{
                              height: '32px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              border: `1px solid ${inCartQty > 0 ? F.accentRed : F.border}`,
                              backgroundColor: inCartQty > 0 ? F.accentRed : F.bgSubtle,
                              color: inCartQty > 0 ? '#FFFFFF' : F.textPrimary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '12px',
                              boxShadow: inCartQty > 0 ? '0 2px 8px rgba(229, 25, 55, 0.3)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = F.accentRed;
                              e.currentTarget.style.color = '#FFFFFF';
                              e.currentTarget.style.borderColor = F.accentRed;
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 25, 55, 0.35)';
                              e.currentTarget.style.transform = 'scale(1.04)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = inCartQty > 0 ? F.accentRed : F.bgSubtle;
                              e.currentTarget.style.color = inCartQty > 0 ? '#FFFFFF' : F.textPrimary;
                              e.currentTarget.style.borderColor = inCartQty > 0 ? F.accentRed : F.border;
                              e.currentTarget.style.boxShadow = inCartQty > 0 ? '0 2px 8px rgba(229, 25, 55, 0.3)' : 'none';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <Add16Filled style={{ width: 14, height: 14 }} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DOCKED RIGHT-HAND "MY ORDER" SUMMARY PANEL (Subtle Card Elevation)
      ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '380px',
          height: '100%',
          backgroundColor: F.bgCard,
          borderLeft: `1px solid ${F.border}`,
          boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Docked Panel Header */}
        <div
          style={{
            height: '56px',
            padding: '0 22px',
            borderBottom: `1px solid ${F.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: F.textPrimary, letterSpacing: '-0.2px' }}>
              My Order
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: F.textSecondary,
                backgroundColor: F.bgSubtle,
                padding: '2px 8px',
                borderRadius: F.radiusSm,
              }}
            >
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              style={{
                fontSize: '12px',
                color: F.textMuted,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: F.font,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = F.accentRed)}
              onMouseLeave={(e) => (e.currentTarget.style.color = F.textMuted)}
            >
              Clear
            </button>
          )}
        </div>

        {/* Scrollable Cart Items List (8px radius item cards) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cart.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: F.textMuted, padding: '40px 20px' }}>
              <ShoppingBag24Regular style={{ width: 44, height: 44, color: F.textMuted }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: F.textSecondary }}>Order is Empty</div>
              <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: 1.4 }}>
                Select items from the menu catalog to build customer bill
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: F.radiusMd, // 8px subtle corner radius
                  backgroundColor: F.bgCanvas,
                  border: `1px solid ${F.borderSubtle}`,
                }}
              >
                {/* Item Thumbnail */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: F.radiusSm,
                    backgroundColor: F.bgCard,
                    border: `1px solid ${F.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = (e.currentTarget as HTMLElement).nextElementSibling;
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ display: item.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <ProductIcon name={item.name} size={18} color={F.accentRed} />
                  </div>
                </div>

                {/* Name & Line Price */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: F.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: F.accentRed, marginTop: '2px' }}>
                    PKR {(item.unitPrice * item.quantity).toLocaleString()}
                  </div>
                </div>

                {/* Compact Stepper & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => updateCartQty(item.productId, -1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: F.radiusSm,
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgCard,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: F.textPrimary,
                    }}
                  >
                    <Subtract20Regular style={{ width: 12, height: 12 }} />
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '18px', textAlign: 'center', color: F.textPrimary }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQty(item.productId, 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: F.radiusSm,
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgCard,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: F.textPrimary,
                    }}
                  >
                    <Add20Regular style={{ width: 12, height: 12 }} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: F.radiusSm,
                      border: `1px solid ${F.borderSubtle}`,
                      backgroundColor: F.bgCard,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: F.textMuted,
                      marginLeft: '2px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = F.accentRed;
                      e.currentTarget.style.borderColor = isDark ? 'rgba(229,25,55,0.4)' : '#FEE2E2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = F.textMuted;
                      e.currentTarget.style.borderColor = F.borderSubtle;
                    }}
                  >
                    <Delete20Regular style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Docked Footer (Promocode, Summary & Strictly Reserved #E51937 Confirm Order Button) */}
        <div
          style={{
            padding: '16px 20px 20px',
            borderTop: `1px solid ${F.border}`,
            backgroundColor: F.bgCard,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Promo code field */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: F.radiusMd, // 8px radius
              backgroundColor: F.bgSubtle,
              border: `1px dashed ${F.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag20Regular style={{ width: 14, height: 14, color: F.textMuted }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, letterSpacing: '0.04em' }}>
                PROMOCODE
              </span>
            </div>

            {appliedPromo ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: isDark ? 'rgba(229, 25, 55, 0.2)' : '#FEF2F2',
                  color: F.accentRed,
                  padding: '2px 8px',
                  borderRadius: F.radiusSm,
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <span>{appliedPromo.toUpperCase()}</span>
                <Dismiss16Regular
                  style={{ width: 12, height: 12, cursor: 'pointer' }}
                  onClick={() => {
                    setAppliedPromo('');
                    setDiscountPct(0);
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                  placeholder="Code..."
                  style={{
                    width: '90px',
                    padding: '4px 8px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgSubtle,
                    color: F.textPrimary,
                    fontSize: '12px',
                    fontFamily: F.font,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={applyPromo}
                  style={{
                    padding: '4px 10px',
                    borderRadius: F.radiusSm,
                    border: 'none',
                    backgroundColor: isDark ? F.accentRed : '#1A1A1E',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: F.font,
                  }}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: F.textSecondary }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: F.textPrimary }}>PKR {subtotal.toLocaleString()}</span>
            </div>

            {discountVal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: F.accentRed }}>
                <span>Discount ({discountPct}%)</span>
                <span style={{ fontWeight: 600 }}>-PKR {discountVal.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: F.textSecondary }}>
              <span>Delivery Charges</span>
              <span style={{ fontWeight: 600, color: deliveryFee === 0 ? F.accentGreen : F.textPrimary }}>
                {deliveryFee === 0 ? 'FREE' : `PKR ${deliveryFee}`}
              </span>
            </div>

            <div style={{ height: '1px', backgroundColor: F.borderSubtle, margin: '4px 0' }} />

            {/* Total Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: F.textPrimary }}>TOTAL</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: F.textPrimary }}>
                PKR {total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payment Method
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                style={{
                  padding: '7px 0',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${paymentMode === 'cash' ? F.accentRed : F.border}`,
                  backgroundColor: paymentMode === 'cash' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                  color: paymentMode === 'cash' ? F.accentRed : F.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Money20Regular style={{ width: 16, height: 16 }} />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('card')}
                style={{
                  padding: '7px 0',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${paymentMode === 'card' ? F.accentRed : F.border}`,
                  backgroundColor: paymentMode === 'card' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                  color: paymentMode === 'card' ? F.accentRed : F.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Payment20Regular style={{ width: 16, height: 16 }} />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('khata')}
                style={{
                  padding: '7px 0',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${paymentMode === 'khata' ? F.accentRed : F.border}`,
                  backgroundColor: paymentMode === 'khata' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                  color: paymentMode === 'khata' ? F.accentRed : F.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Notebook20Regular style={{ width: 16, height: 16 }} />
                <span>Khata</span>
              </button>
            </div>

            {/* Khata Customer Selection */}
            {paymentMode === 'khata' && (
              <div style={{ marginTop: '8px' }}>
                <select
                  value={selectedKhataId}
                  onChange={(e) => setSelectedKhataId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgSubtle,
                    color: F.textPrimary,
                    fontSize: '12px',
                    fontFamily: F.font,
                    outline: 'none',
                  }}
                >
                  <option value="">-- Select Khata Customer --</option>
                  {customerKhatas.map((k: any) => (
                    <option key={k.id} value={k.id}>
                      {k.name} (Debt: PKR {k.currentDebt?.toLocaleString()} | Limit: PKR {k.creditLimit?.toLocaleString()})
                    </option>
                  ))}
                </select>
                {paymentMode === 'khata' && !selectedKhataId && (
                  <span style={{ fontSize: '11px', color: F.accentRed, marginTop: '3px', display: 'block' }}>
                    * Please select customer to debit bill
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Primary Interactive Button: Red Brand Accent (#E51937) with 8px Radius */}
          <button
            disabled={cart.length === 0 || isPending || (paymentMode === 'khata' && !selectedKhataId)}
            onClick={() => checkout()}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: F.radiusMd, // 8px subtle corner radius (Desktop UI strategy)
              backgroundColor: cart.length === 0 || isPending ? (isDark ? '#383838' : '#CBD5E1') : F.accentRed,
              color: '#FFFFFF',
              border: 'none',
              fontFamily: F.font,
              fontWeight: 700,
              fontSize: '15px',
              cursor: cart.length === 0 || isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: cart.length === 0 || isPending ? 'none' : '0 4px 12px rgba(229, 25, 55, 0.28)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (cart.length > 0 && !isPending) e.currentTarget.style.backgroundColor = F.accentRedHover;
            }}
            onMouseLeave={(e) => {
              if (cart.length > 0 && !isPending) e.currentTarget.style.backgroundColor = F.accentRed;
            }}
          >
            {isSuccess ? (
              <>
                <CheckmarkCircle20Filled style={{ width: 18, height: 18 }} />
                <span>Order Placed!</span>
              </>
            ) : isPending ? (
              <span>Processing...</span>
            ) : (
              <span>Confirm Order</span>
            )}
          </button>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal (Desktop Style) */}
      {showReceiptModal && lastOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '360px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd, // 8px subtle corner radius
              boxShadow: F.shadowElevated,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${F.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt20Regular style={{ color: F.accentRed }} />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Thermal Receipt Preview</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            <div style={{ padding: '16px 20px', backgroundColor: isDark ? '#1F1F1F' : '#FAFAFA', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.5, color: isDark ? '#EDEDED' : '#333' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: isDark ? '#FFFFFF' : '#111' }}>OMNIPOS COUNTER</div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: isDark ? '#999' : '#666' }}>Order Fresh • Eat Fresh</div>
              <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#999'}` }} />
              <div>Order ID: #{lastOrder.id.slice(-6).toUpperCase()}</div>
              <div>Date: {new Date(lastOrder.createdAt).toLocaleTimeString()}</div>
              <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#999'}` }} />
              {lastOrder.lines.map((line) => (
                <div key={line.productId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{line.quantity}x {line.name}</span>
                  <span>PKR {(line.unitPrice * line.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ margin: '8px 0', borderBottom: '1px dashed #999' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>NET TOTAL:</span>
                <span>PKR {lastOrder.totalAmount?.toLocaleString()}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: '#777' }}>
                Thank you for your visit!
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: `1px solid ${F.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ padding: '6px 14px', borderRadius: F.radiusSm, border: `1px solid ${F.border}`, backgroundColor: F.bgCard, cursor: 'pointer', fontFamily: F.font, fontSize: '12px' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  posApi.printReceipt();
                  setShowReceiptModal(false);
                }}
                style={{ padding: '6px 16px', borderRadius: F.radiusSm, border: 'none', backgroundColor: F.accentRed, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: F.font, fontSize: '12px' }}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
