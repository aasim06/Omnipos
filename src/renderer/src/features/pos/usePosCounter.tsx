import { CustomerOption, FastFoodOrderType, ParkedOrder, PosCounterProps } from '@/features/pos/posTypes';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppToast } from '@/context/AppNotificationContext';
import { useAppTheme } from '@/theme/AppProviders';
import React, { useState } from 'react';
import { getTokens } from '@/features/pos/posTokens';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { CartLine, Category, Order, Product } from '@shared/types';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { KEYS, storage } from '@/lib/storage';
import { generateQrDataUrl } from '@/lib/qrCode';
import { posApi, resolveApiUrl } from '@/lib/api';
import { playBeep, playErrorBeep, playSuccessChime } from '@/lib/soundFx';
import { nowISO, uid } from '@/lib/utils';
import { printKitchenKot } from '@/lib/kotPrinter';
import { printCustomerReceipt } from '@/lib/receiptPrinter';

/**
 * All state, data loading, effects and handlers of the POS counter screen.
 * Moved verbatim from PosCounterView (P3 split) — hook order is unchanged.
 */
export type PosViewMode = 'grid' | 'table' | 'tiles';
// v2: the tile board became the default for both terminals, so older saved choices start fresh.
const VIEW_MODE_KEY = 'omnipos_pos_view_mode_v2';

function readViewMode(module: string): PosViewMode {
  const fallback: PosViewMode = 'tiles';
  try {
    const saved = JSON.parse(localStorage.getItem(VIEW_MODE_KEY) || '{}')[module];
    if (saved === 'tiles' || saved === 'grid' || (saved === 'table' && module !== 'fastfood')) return saved;
  } catch {
    /* storage unavailable or corrupt */
  }
  return fallback;
}

function writeViewMode(module: string, mode: PosViewMode) {
  try {
    const all = JSON.parse(localStorage.getItem(VIEW_MODE_KEY) || '{}');
    localStorage.setItem(VIEW_MODE_KEY, JSON.stringify({ ...all, [module]: mode }));
  } catch {
    /* storage unavailable */
  }
}

export function usePosCounter({ module, modeType }: PosCounterProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning } = useAppToast();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const F = React.useMemo(() => getTokens(isDark), [isDark]);
  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');
  /* State */
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [discountMode, setDiscountMode] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showA4Invoice, setShowA4Invoice] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'khata' | 'split'>('cash');
  const [splitCashAmount, setSplitCashAmount] = useState<number | ''>('');
  const [splitOnlineAmount, setSplitOnlineAmount] = useState<number | ''>('');
  const [splitKhataAmount, setSplitKhataAmount] = useState<number | ''>('');
  const [selectedKhataId, setSelectedKhataId] = useState<string>('');
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    return storage.getItem<StoreSettings>(KEYS.storeSettings, {
      storeName: module === 'fastfood' ? 'OMNIPOS RESTAURANT' : 'OMNIPOS RETAIL',
      phone: '+92 300 1234567',
      address: '',
      headerNote: 'Order Fresh • Eat Fresh',
      footerNote: 'Thank you for shopping with us!',
      paperWidth: '80mm',
      autoCut: true,
      drawerKick: true,
      currency: 'PKR',
      taxPercent: 0,
      receiptLanguage: 'english',
    });
  });
  const [modalReceiptLang, setModalReceiptLang] = useState<'english' | 'urdu' | 'bilingual'>('english');
  const [modalGoogleQrDataUrl, setModalGoogleQrDataUrl] = useState<string>('');
  React.useEffect(() => {
    if (storeSettings.showGoogleMapQrOnReceipt !== false && storeSettings.googleMapsUrl) {
      generateQrDataUrl(storeSettings.googleMapsUrl, { width: 100, margin: 1 })
        .then(setModalGoogleQrDataUrl)
        .catch(() => setModalGoogleQrDataUrl(''));
    } else {
      setModalGoogleQrDataUrl('');
    }
  }, [storeSettings.showGoogleMapQrOnReceipt, storeSettings.googleMapsUrl]);
  const refreshStoreSettings = React.useCallback(() => {
    const updated = storage.getItem<StoreSettings>(KEYS.storeSettings, {
      storeName: module === 'fastfood' ? 'OMNIPOS RESTAURANT' : 'OMNIPOS RETAIL',
      phone: '+92 300 1234567',
      address: '',
      headerNote: 'Order Fresh • Eat Fresh',
      footerNote: 'Thank you for shopping with us!',
      paperWidth: '80mm',
      autoCut: true,
      drawerKick: true,
      currency: 'PKR',
      taxPercent: 0,
      receiptLanguage: 'english',
    });
    setStoreSettings(updated);
    return updated;
  }, [module]);
  // Sync settings when window regains focus or when receipt modal opens
  React.useEffect(() => {
    const handleFocus = () => refreshStoreSettings();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshStoreSettings]);
  React.useEffect(() => {
    if (showReceiptModal) {
      const fresh = refreshStoreSettings();
      setModalReceiptLang(fresh.receiptLanguage || 'english');
    }
  }, [showReceiptModal, refreshStoreSettings]);
  /* Fast Food Specific: Order Type & Routing */
  const [orderType, setOrderType] = useState<FastFoodOrderType>('dine-in');
  const [tableNo, setTableNo] = useState<string>('Table 1');
  const [tokenNo, setTokenNo] = useState<number>(() => {
    const saved = localStorage.getItem('pos_token_seq');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [deliveryDetails, setDeliveryDetails] = useState({
    customerName: '',
    phone: '',
    address: '',
    fee: 100,
  });
  /* Parked / Held Orders */
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('pos_parked_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showParkedModal, setShowParkedModal] = useState(false);
  /* Quick Cash Tender & Change Due */
  const [tenderedAmount, setTenderedAmount] = useState<number | ''>('');
  /* Line Item Kitchen Prep Notes */
  const [editingNoteItem, setEditingNoteItem] = useState<{ productId: string; variantLabel?: string; currentNote: string } | null>(null);
  /* Mini Mart Specific: Barcode Scanner, Dual View Mode & Scale Calculator */
  // Catalog view per module, remembered on this terminal. Fast food defaults to the touch tile board.
  const [viewMode, setViewModeState] = useState<PosViewMode>(() => readViewMode(module));
  React.useEffect(() => {
    setViewModeState(readViewMode(module));
  }, [module]);
  const setViewMode = React.useCallback(
    (mode: PosViewMode) => {
      setViewModeState(mode);
      writeViewMode(module, mode);
    },
    [module],
  );
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{ isSuccess: boolean; text: string } | null>(null);
  const scannerInputRef = React.useRef<HTMLInputElement>(null);
  /* Loose / Weight Scale Calculator */
  const [weighingProduct, setWeighingProduct] = useState<Product | null>(null);
  const [weightAmount, setWeightAmount] = useState<number>(1.0);
  const [weightCalcMode, setWeightCalcMode] = useState<'weight' | 'rupees'>('weight');
  const [targetRupees, setTargetRupees] = useState<number>(50);
  /* Quick Quantity Numpad / Multiplier Popover */
  const [editingQtyItem, setEditingQtyItem] = useState<{
    productId: string;
    variantLabel?: string;
    currentQty: number;
    name: string;
  } | null>(null);
  const [customQtyInput, setCustomQtyInput] = useState<string>('');
  /* Minimart Customer Phone & Loyalty Lookup */
  const [customerPhone, setCustomerPhone] = useState('');
  /* Collapsible Sections (for maximizing cart item room) */
  const [isTopSectionCollapsed, setIsTopSectionCollapsed] = useState(false);
  const [isDiscountCollapsed, setIsDiscountCollapsed] = useState(true);

  /* Customer Autocomplete (MUI floating-label outline style matching reference screenshot) */
  const defaultGuestCustomer: CustomerOption = {
    id: '',
    name: 'Guest',
    currentDebt: 0,
  };
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption>(defaultGuestCustomer);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = React.useRef<HTMLDivElement>(null);
  const customerInputRef = React.useRef<HTMLInputElement>(null);
  const formatCustomerBalance = (cust: CustomerOption | null | undefined) => {
    if (!cust) return '0.00';
    if (cust.currentDebt === undefined || cust.currentDebt === null) return '0.00';
    if (cust.currentDebt === 0) return '0.00';
    return cust.currentDebt > 0 ? `-${cust.currentDebt.toFixed(2)}` : `${Math.abs(cust.currentDebt).toFixed(2)}`;
  };
  /* Close customer dropdown when clicking outside */
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  /* Quick Size / Variant Picker for Apparel, Shoes & Products with Variants */
  const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);
  /* Query Khatas for Credit / Udhaar payment */
  const { data: customerKhatas = [] } = useQuery({
    queryKey: ['khatas'],
    queryFn: () => posApi.fetchKhatas(),
  });
  /* Auto-sync selected customer with Khatas when loaded */
  React.useEffect(() => {
    if (customerKhatas.length > 0) {
      if (selectedCustomer.id) {
        const found = customerKhatas.find((k: any) => k.id === selectedCustomer.id);
        if (found) setSelectedCustomer(found);
      } else if (selectedCustomer.name.toLowerCase() === 'guest') {
        const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
        if (guestInDb) setSelectedCustomer(guestInDb);
      }
    }
  }, [customerKhatas]);
  /* Auto-load Quotation if transferred from Quotations view */
  React.useEffect(() => {
    try {
      const pendingRaw = localStorage.getItem('pos_pending_quotation_load');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        if (pending && Array.isArray(pending.lines) && pending.lines.length > 0) {
          setCart(pending.lines);
          if (pending.customerName) {
            setSelectedCustomer({
              name: pending.customerName,
              phone: pending.customerPhone || '',
            });
            if (pending.customerPhone) {
              setCustomerPhone(pending.customerPhone);
            }
          }
          if (typeof pending.discountPercent === 'number' && pending.discountPercent > 0) {
            setDiscountMode('percent');
            setDiscountValue(pending.discountPercent);
          }
          notifySuccess(`Loaded ${pending.lines.length} item(s) from Quotation #${pending.quoteNumber || ''}`);
          playSuccessChime();
        }
        localStorage.removeItem('pos_pending_quotation_load');
      }
    } catch (e) {
      console.warn('Error loading pending quotation into POS cart:', e);
    }
  }, []);
  const handleSelectCustomer = (cust: CustomerOption) => {
    setSelectedCustomer(cust);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    if (cust.id) {
      setSelectedKhataId(cust.id);
    } else {
      setSelectedKhataId('');
    }
    if (cust.phone) {
      setCustomerPhone(cust.phone);
      if (orderType === 'delivery') {
        setDeliveryDetails((prev) => ({
          ...prev,
          customerName: cust.name,
          phone: cust.phone || prev.phone,
        }));
      }
    } else if (orderType === 'delivery' && cust.name !== 'Guest') {
      setDeliveryDetails((prev) => ({
        ...prev,
        customerName: cust.name,
      }));
    }
    playBeep();
  };
  const handleClearCustomer = () => {
    const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
    setSelectedCustomer(guestInDb || defaultGuestCustomer);
    setCustomerSearchQuery('');
    setSelectedKhataId(guestInDb?.id || '');
    setIsCustomerDropdownOpen(false);
    playBeep();
  };
  const filteredCustomerOptions = React.useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    const list: CustomerOption[] = [];
    const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
    list.push(guestInDb || defaultGuestCustomer);

    customerKhatas.forEach((k: any) => {
      if (k.name.toLowerCase() !== 'guest') {
        list.push(k);
      }
    });

    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [customerSearchQuery, customerKhatas, defaultGuestCustomer]);
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
  // Fluent Pivot Category Tabs (Dynamic from Database & Catalog filtered by Module)
  const allCategoryTabs = React.useMemo(() => {
    const fromDb = dbCategories.filter((c) => !c.module || c.module === module).map((c) => c.name);
    const fromProducts = products.filter((p) => !p.module || p.module === module).map((p) => p.category).filter(Boolean);

    return Array.from(new Set(['All', ...fromDb, ...fromProducts]));
  }, [dbCategories, products, module]);
  // Count items per category for visual badge in Fast Food sidebar
  const categoryCounts = React.useMemo(() => {
    const moduleProducts = products.filter((p) => !p.module || p.module === module);
    const counts: Record<string, number> = { All: moduleProducts.length };
    moduleProducts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products, module]);
  // Scrollable Category Tabs controller (MUI / Fluent UI Pivot style with Chevrons)
  const tabScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const checkScrollButtons = React.useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  React.useEffect(() => {
    const timer = setTimeout(checkScrollButtons, 120);
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [allCategoryTabs, checkScrollButtons]);
  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (!tabScrollRef.current) return;
    const delta = direction === 'left' ? -220 : 220;
    tabScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };
  // Auto-scroll active category into view
  React.useEffect(() => {
    if (tabScrollRef.current) {
      const activeEl = tabScrollRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    checkScrollButtons();
  }, [activeCategory, checkScrollButtons]);
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      // Role separation: Fast Food counter sells food menus, Mini Mart sells retail goods. Raw ingredients are hidden from POS selling.
      if (module === 'fastfood') {
        if (p.itemRole === 'retail_product' || p.itemRole === 'raw_ingredient') return false;
      } else if (module === 'minimart') {
        if (p.itemRole === 'food_menu' || p.itemRole === 'raw_ingredient') return false;
      }

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.variants &&
          p.variants.some(
            (v) =>
              (v.skuCode && v.skuCode.toLowerCase().includes(q)) ||
              ((v as any).barcode && (v as any).barcode.toLowerCase().includes(q)) ||
              (v.label && v.label.toLowerCase().includes(q))
          ));
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, module, searchTerm, activeCategory]);
  // Reset state when switching between Fast Food and Mini Mart
  React.useEffect(() => {
    setSelectedProduct(null);
    setActiveCategory('All');
    setSearchTerm('');
    const timer = setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [module]);
  // Auto-select first item as hero in Fast Food mode
  React.useEffect(() => {
    if (module === 'fastfood' && filteredProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [module, filteredProducts.length]);
  /* Matched Khata customer if phone matches */
  const matchedCustomer = React.useMemo(() => {
    if (!customerPhone.trim()) return null;
    const q = customerPhone.trim().toLowerCase();
    return (
      customerKhatas.find(
        (k: any) =>
          (k.phone && k.phone.toLowerCase().includes(q)) ||
          k.name.toLowerCase().includes(q)
      ) || null
    );
  }, [customerPhone, customerKhatas]);
  /* Helper: Check if product unit is sold by weight (kg/g) or volume (liter/ml) */
  const isWeightUnit = (unit?: string | null) => {
    if (!unit) return false;
    return ['kg', 'g', 'gram', 'kilogram'].includes(unit.toLowerCase().trim());
  };
  const isLiquidUnit = (unit?: string | null) => {
    if (!unit) return false;
    return ['liter', 'litre', 'l', 'ltr', 'ml'].includes(unit.toLowerCase().trim());
  };
  const isWeighableOrLiquid = (unit?: string | null) => {
    return isWeightUnit(unit) || isLiquidUnit(unit);
  };
  /* Barcode Scanner Logic (Hardware Gun & Fast Keyboard Input) */
  const handleBarcodeScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    let qty = 1;
    let lookupTerm = raw;
    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseInt(parts[0], 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        lookupTerm = parts.slice(1).join('*').trim();
      }
    }

    const termLower = lookupTerm.toLowerCase();
    let matchedVariant: any = null;
    const found = products.find((p) => {
      if (p.skuCode && p.skuCode.toLowerCase() === termLower) return true;
      if (p.barcode && p.barcode.toLowerCase() === termLower) return true;
      if (p.id.toLowerCase() === termLower) return true;
      if (`sku-${p.id.slice(-6)}`.toLowerCase() === termLower) return true;
      const vMatch = p.variants?.find((v) => 
        (v.skuCode && v.skuCode.toLowerCase() === termLower) ||
        ((v as any).barcode && (v as any).barcode.toLowerCase() === termLower)
      );
      if (vMatch) {
        matchedVariant = vMatch;
        return true;
      }
      return p.name.toLowerCase() === termLower || p.name.toLowerCase().includes(termLower);
    });

    if (found) {
      setSelectedProduct(found);

      const isProductOutOfStock =
        found.openingStock !== null && found.openingStock !== undefined && found.openingStock <= 0;

      if (matchedVariant) {
        const isVariantOutOfStock =
          matchedVariant.stock !== undefined && matchedVariant.stock !== null
            ? matchedVariant.stock <= 0
            : isProductOutOfStock;

        if (isVariantOutOfStock) {
          playErrorBeep();
          setLastScannedFeedback({
            isSuccess: false,
            text: `"${found.name} (${matchedVariant.label})" is OUT OF STOCK!`
          });
          setBarcodeInput('');
          setTimeout(() => setLastScannedFeedback(null), 3500);
          return;
        }

        const maxStock =
          matchedVariant.stock !== undefined && matchedVariant.stock !== null
            ? matchedVariant.stock
            : found.openingStock;

        const currentInCart = inCartMap[`${found.id}__${matchedVariant.label}`] || 0;
        if (maxStock !== undefined && maxStock !== null && currentInCart + qty > maxStock) {
          playErrorBeep();
          setLastScannedFeedback({
            isSuccess: false,
            text: `Stock limit reached! Only ${maxStock} available (${currentInCart} in cart)`
          });
          setBarcodeInput('');
          setTimeout(() => setLastScannedFeedback(null), 3500);
          return;
        }

        const vPrice =
          matchedVariant.price !== undefined && matchedVariant.price > 0
            ? matchedVariant.price
            : found.price + (matchedVariant.priceDelta || 0);
        addToCart(found, qty, matchedVariant.label, vPrice);
        setLastScannedFeedback({
          isSuccess: true,
          text: `Added ${qty}x ${found.name} (${matchedVariant.label}) (PKR ${(vPrice * qty).toLocaleString()})`
        });
        setBarcodeInput('');
        setTimeout(() => setLastScannedFeedback(null), 3500);
        return;
      }

      // Check if product is out of stock when no specific variant matched
      if (isProductOutOfStock) {
        const hasAvailableVariant =
          found.variants &&
          found.variants.length > 0 &&
          found.variants.some((v) => (v.stock !== undefined && v.stock !== null ? v.stock > 0 : false));

        if (!hasAvailableVariant) {
          playErrorBeep();
          setLastScannedFeedback({
            isSuccess: false,
            text: `"${found.name}" is OUT OF STOCK! (0 Available)`
          });
          setBarcodeInput('');
          setTimeout(() => setLastScannedFeedback(null), 3500);
          return;
        }
      }

      // Check available quantity limit if stock is tracked
      const currentInCart = inCartMap[found.id] || 0;
      if (
        found.openingStock !== undefined &&
        found.openingStock !== null &&
        (!found.variants || found.variants.length === 0)
      ) {
        if (currentInCart + qty > found.openingStock) {
          playErrorBeep();
          setLastScannedFeedback({
            isSuccess: false,
            text: `Stock limit reached! Only ${found.openingStock} available (${currentInCart} in cart)`
          });
          setBarcodeInput('');
          setTimeout(() => setLastScannedFeedback(null), 3500);
          return;
        }
      }

      if (found.variants && found.variants.length > 0) {
        setVariantPickerProduct(found);
        setBarcodeInput('');
        playBeep();
        return;
      }

      const isWeightItem = isWeighableOrLiquid(found.unit);
      if (isWeightItem) {
        setWeighingProduct(found);
        setWeightAmount(1.0);
        setBarcodeInput('');
        playBeep();
        return;
      }

      addToCart(found, qty);
      setLastScannedFeedback({
        isSuccess: true,
        text: `Added ${qty}x ${found.name} (PKR ${(found.price * qty).toLocaleString()})`
      });
      setBarcodeInput('');
      setTimeout(() => setLastScannedFeedback(null), 3500);
    } else {
      playErrorBeep();
      setLastScannedFeedback({
        isSuccess: false,
        text: `"${lookupTerm}" not found in catalog`
      });
      setTimeout(() => setLastScannedFeedback(null), 3500);
    }
  };
  /* Scale / Loose Weight & Liquid Volume Calculator Confirmation */
  const handleConfirmWeight = () => {
    if (!weighingProduct) return;
    if (
      weighingProduct.openingStock !== null &&
      weighingProduct.openingStock !== undefined &&
      weighingProduct.openingStock <= 0
    ) {
      playErrorBeep();
      setLastScannedFeedback({
        isSuccess: false,
        text: `"${weighingProduct.name}" is OUT OF STOCK!`
      });
      setTimeout(() => setLastScannedFeedback(null), 3500);
      setWeighingProduct(null);
      return;
    }
    const finalQty = Number(weightAmount.toFixed(3));
    const calcPrice = Math.round(weighingProduct.price * finalQty);
    const unitName = weighingProduct.unit || 'kg';
    const variantLabel = `${finalQty} ${unitName} @ PKR ${weighingProduct.price}/${unitName}`;
    addToCart(weighingProduct, finalQty, variantLabel, weighingProduct.price);
    setWeighingProduct(null);
    setLastScannedFeedback({
      isSuccess: true,
      text: `Added ${finalQty} ${unitName} of ${weighingProduct.name} (PKR ${calcPrice.toLocaleString()})`
    });
    setTimeout(() => setLastScannedFeedback(null), 3500);
  };
  /* Quick Quantity Numpad / Multiplier Apply */
  const handleApplyCustomQty = (newQty: number) => {
    if (!editingQtyItem || newQty <= 0) return;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === editingQtyItem.productId && item.variantLabel === editingQtyItem.variantLabel
          ? { ...item, quantity: newQty }
          : item
      )
    );
    setEditingQtyItem(null);
    playBeep();
  };
  // Fast O(1) in-cart lookup map to avoid scanning cart repeatedly.
  // Per-product totals are in stock (base) units, so a Carton line counts as e.g. 24 pieces.
  const inCartMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      const key = `${item.productId}__${item.variantLabel || ''}`;
      map[key] = (map[key] || 0) + item.quantity;
      map[item.productId] = (map[item.productId] || 0) + cartLineBaseQty(item);
    }
    return map;
  }, [cart]);
  /* Cart Operations */
  const addToCart = React.useCallback((
    product: Product,
    qty = 1,
    variantLabel?: string,
    customUnitPrice?: number,
    notes?: string
  ) => {
    // Prevent adding out-of-stock items (food items are made-to-order and not blocked by stock)
    const isFood = product.module === 'fastfood';
    const isOut = !isFood && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= 0;
    if (isOut && !variantLabel) {
      playErrorBeep();
      return;
    }

    if (variantLabel && product.variants) {
      const v = product.variants.find((item) => item.label === variantLabel);
      if (v && v.stock !== undefined && v.stock !== null && v.stock <= 0) {
        playErrorBeep();
        return;
      }
      if ((!v || v.stock === undefined || v.stock === null) && isOut) {
        playErrorBeep();
        return;
      }
    }

    // Products with a wholesale unit (Carton) are added as retail pieces at the piece price;
    // the cart line can then be switched to Carton.
    const conv = !variantLabel && customUnitPrice === undefined ? getUnitConversion(product) : null;
    const unitPrice = customUnitPrice !== undefined ? customUnitPrice : conv ? conv.retailPrice : product.price;
    setCart((prev) => {
      const existsIndex = prev.findIndex(
        (item) => item.productId === product.id && item.variantLabel === variantLabel
      );
      if (existsIndex > -1) {
        const lineFactor = prev[existsIndex].unitFactor || 1;
        if (!isFood && (!variantLabel || prev[existsIndex].selectedUnit === 'primary') && product.openingStock !== undefined && product.openingStock !== null) {
          const inCartBase = prev.filter((i) => i.productId === product.id).reduce((s, i) => s + cartLineBaseQty(i), 0);
          if (inCartBase + qty * lineFactor > product.openingStock) {
            playErrorBeep();
            return prev;
          }
        }
        return prev.map((item, idx) =>
          idx === existsIndex ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          nameUrdu: product.nameUrdu,
          unitPrice,
          quantity: qty,
          variantLabel,
          costPrice: product.costPrice,
          batchNumber: product.batchNumber,
          expiryDate: product.expiryDate,
          unitLabel: conv ? conv.retail : product.unit,
          ...(conv ? { selectedUnit: 'secondary' } : {}),
          notes,
          imageUrl: product.imageUrl,
        },
      ];
    });
    playBeep();
  }, []);
  const removeFromCart = React.useCallback((productId: string, variantLabel?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantLabel === variantLabel))
    );
    playBeep();
  }, []);
  const updateCartQty = React.useCallback((productId: string, delta: number, variantLabel?: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId && i.variantLabel === variantLabel);
      if (!item) return prev;
      if (delta > 0) {
        const prod = products.find((p) => p.id === productId);
        const tracksStock = prod && prod.openingStock !== null && prod.openingStock !== undefined;
        if (tracksStock && (!variantLabel || item.selectedUnit === 'primary')) {
          const inCartBase = prev.filter((i) => i.productId === productId).reduce((s, i) => s + cartLineBaseQty(i), 0);
          if (inCartBase + delta * (item.unitFactor || 1) > (prod!.openingStock as number)) {
            playErrorBeep();
            return prev;
          }
        }
      }
      return prev.map((i) =>
        i.productId === productId && i.variantLabel === variantLabel
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      );
    });
    playBeep();
  }, [products]);
  /**
   * Switch a cart line between the retail piece and the wholesale unit (e.g. Carton).
   * Carton lines are priced at the product's Selling Price, piece lines at the Retail Piece
   * Price; stock is always checked and deducted in pieces.
   */
  const switchCartLineUnit = React.useCallback((productId: string, variantLabel: string | undefined, to: 'primary' | 'secondary') => {
    const prod = products.find((p) => p.id === productId);
    const conv = getUnitConversion(prod);
    if (!prod || !conv) return;
    setCart((prev) => {
      const line = prev.find((i) => i.productId === productId && i.variantLabel === variantLabel);
      if (!line || (line.selectedUnit === 'primary') === (to === 'primary')) return prev;
      const next: CartLine =
        to === 'primary'
          ? { ...line, variantLabel: conv.wholesale, selectedUnit: 'primary', unitFactor: conv.rate, unitPrice: conv.wholesalePrice, unitLabel: conv.wholesale }
          : { ...line, variantLabel: undefined, selectedUnit: 'secondary', unitFactor: undefined, unitPrice: conv.retailPrice, unitLabel: conv.retail };
      const others = prev.filter((i) => i !== line);
      const merged = others.find((i) => i.productId === productId && i.variantLabel === next.variantLabel);
      const result = merged
        ? others.map((i) => (i === merged ? { ...i, quantity: i.quantity + next.quantity } : i))
        : prev.map((i) => (i === line ? next : i));
      if (prod.openingStock !== null && prod.openingStock !== undefined) {
        const totalBase = result.filter((i) => i.productId === productId).reduce((s, i) => s + cartLineBaseQty(i), 0);
        if (totalBase > prod.openingStock) {
          playErrorBeep();
          return prev;
        }
      }
      return result;
    });
    playBeep();
  }, [products]);

  /* Hold / Park Order (Queue Management) */
  const handleParkOrder = () => {
    if (cart.length === 0) return;
    const label =
      orderType === 'dine-in'
        ? tableNo || 'Dine-In'
        : orderType === 'takeaway'
        ? `Token #${String(tokenNo).padStart(2, '0')}`
        : `Delivery (${deliveryDetails.customerName || 'Cust'})`;

    const newParked: ParkedOrder = {
      id: uid(),
      parkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label,
      orderType,
      tableOrToken: orderType === 'dine-in' ? tableNo : String(tokenNo),
      lines: [...cart],
      subtotal: total,
    };

    const updated = [newParked, ...parkedOrders];
    setParkedOrders(updated);
    try {
      localStorage.setItem('pos_parked_orders', JSON.stringify(updated));
    } catch {}

    setCart([]);
    setTenderedAmount('');
    if (orderType === 'takeaway') {
      setTokenNo((t) => {
        const next = t + 1;
        try {
          localStorage.setItem('pos_token_seq', String(next));
        } catch {}
        return next;
      });
    }

    // In fast food mode, automatically route KOT to Kitchen display & print thermal receipt
    if (module === 'fastfood') {
      try {
        resolveApiUrl().then((base) => {
          fetch(`${base}/api/kitchen/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: label,
              orderType: orderType.toUpperCase(),
              lines: cart.map((l) => ({
                id: l.productId,
                name: l.name,
                quantity: l.quantity,
                variantLabel: l.variantLabel || '',
                notes: l.notes || '',
              })),
            }),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
          }).catch(() => {});
        }).catch(() => {});

        void printKitchenKot(
          {
            id: newParked.id,
            module: 'fastfood',
            lines: newParked.lines,
            discountPercent: 0,
            stage: 'kot',
            createdAt: nowISO(),
            updatedAt: nowISO(),
            orderType: newParked.orderType,
          },
          {
            tableOrToken: newParked.tableOrToken,
          }
        );
      } catch {}
    }

    playBeep();
  };
  const handleResumeParkedOrder = (parked: ParkedOrder) => {
    setCart(parked.lines);
    setOrderType(parked.orderType);
    if (parked.orderType === 'dine-in') setTableNo(parked.tableOrToken);
    const remaining = parkedOrders.filter((p) => p.id !== parked.id);
    setParkedOrders(remaining);
    try {
      localStorage.setItem('pos_parked_orders', JSON.stringify(remaining));
    } catch {}
    setShowParkedModal(false);
    playBeep();
  };
  const handleDiscardParkedOrder = (id: string) => {
    const remaining = parkedOrders.filter((p) => p.id !== id);
    setParkedOrders(remaining);
    try {
      localStorage.setItem('pos_parked_orders', JSON.stringify(remaining));
    } catch {}
  };
  /* Financial Totals & Discount */
  const effectiveDeliveryFee = orderType === 'delivery' ? deliveryDetails.fee : deliveryFee;
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = discountMode === 'percent'
    ? Math.round((subtotal * (discountValue || 0)) / 100)
    : Math.min(subtotal, Math.max(0, discountValue || 0));
  const effectiveDiscountPct = subtotal > 0
    ? discountMode === 'percent'
      ? discountValue
      : Math.round(((discountVal / subtotal) * 100) * 10) / 10
    : 0;
  const total = Math.max(0, subtotal - discountVal + effectiveDeliveryFee);
  const handleClearDiscount = () => {
    setDiscountValue(0);
    setDiscountInput('');
  };
  const handleApplyPreset = (val: number) => {
    setDiscountValue(val);
    setDiscountInput(val > 0 ? String(val) : '');
  };
  /* Checkout Mutation */
  const { mutate: checkout, isPending } = useMutation({
    mutationFn: async () => {
      const hasCustomCust = selectedCustomer.name && selectedCustomer.name !== 'Guest';
      let assignedCustomerName: string | undefined;
      let assignedOrderType: 'dine-in' | 'takeaway' | 'delivery' | 'khata' = orderType;

      if (paymentMode === 'khata') {
        assignedOrderType = 'khata';
        assignedCustomerName = selectedCustomer?.name || 'Khata Customer';
      } else if (module === 'minimart') {
        if (hasCustomCust) {
          assignedCustomerName = `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}`;
        } else if (matchedCustomer) {
          assignedCustomerName = `${matchedCustomer.name} (${matchedCustomer.phone || customerPhone})`;
        } else if (customerPhone.trim()) {
          assignedCustomerName = `Customer (${customerPhone.trim()})`;
        } else {
          assignedCustomerName = 'Walk-In Customer';
        }
        assignedOrderType = 'takeaway';
      } else if (orderType === 'dine-in') {
        assignedCustomerName = hasCustomCust
          ? `${selectedCustomer.name} · Dine-In (${tableNo || 'Table 1'})`
          : `Dine-In (${tableNo || 'Table 1'})`;
      } else if (orderType === 'takeaway') {
        assignedCustomerName = hasCustomCust
          ? `${selectedCustomer.name} · Takeaway (Token #${String(tokenNo).padStart(2, '0')})`
          : `Takeaway (Token #${String(tokenNo).padStart(2, '0')})`;
      } else if (orderType === 'delivery') {
        assignedCustomerName = `Delivery (${deliveryDetails.customerName || selectedCustomer.name || 'Customer'} · ${deliveryDetails.phone || selectedCustomer.phone || 'No phone'})`;
      }

      const order: Order = {
        id: uid(),
        module,
        lines: cart,
        discountPercent: effectiveDiscountPct,
        totalAmount: total,
        customerName: assignedCustomerName,
        customerPhone: customerPhone.trim() || undefined,
        paymentMode,
        splitPayments:
          paymentMode === 'split'
            ? {
                cash: Number(splitCashAmount) || 0,
                online: Number(splitOnlineAmount) || 0,
                khata: Number(splitKhataAmount) || 0,
              }
            : undefined,
        orderType: assignedOrderType,
        stage: 'paid',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await posApi.saveOrder(order);

      // If payment is via Khata or Split Khata, add debit transaction to customer ledger offline-first
      if (
        (paymentMode === 'khata' || (paymentMode === 'split' && (Number(splitKhataAmount) || 0) > 0)) &&
        selectedKhataId
      ) {
        const debitAmt = paymentMode === 'split' ? (Number(splitKhataAmount) || 0) : total;
        if (debitAmt > 0) {
          try {
            await posApi.addKhataTransaction({
              khataId: selectedKhataId,
              type: 'DEBIT',
              amount: debitAmt,
              paymentMethod: 'credit',
              description: `POS Bill #${order.id.slice(-6)} (${cart.length} items)`,
            });
          } catch (e) {
            console.error('[Khata] Failed to record credit transaction:', e);
          }
        }
      }

      return order;
    },
    onSuccess: (savedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', module] });
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
      setLastOrder(savedOrder);
      setCart([]);
      handleClearDiscount();
      setPaymentMode('cash');
      setSplitCashAmount('');
      setSplitOnlineAmount('');
      setSplitKhataAmount('');
      setSelectedKhataId('');
      const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
      setSelectedCustomer(guestInDb || defaultGuestCustomer);
      setCustomerSearchQuery('');
      setTenderedAmount('');
      setCustomerPhone('');
      if (orderType === 'takeaway') {
        setTokenNo((t) => {
          const next = t + 1;
          try {
            localStorage.setItem('pos_token_seq', String(next));
          } catch {}
          return next;
        });
      }
      setIsSuccess(true);
      setShowReceiptModal(true);
      playSuccessChime();
      setTimeout(() => setIsSuccess(false), 3000);

      // ── Auto-print receipt immediately on Confirm Order ──
      try {
        const freshSettings = refreshStoreSettings();
        const currentLang = modalReceiptLang || freshSettings.receiptLanguage || 'english';
        const isUrduLang = currentLang === 'urdu';
        const isBilingualLang = currentLang === 'bilingual';
        const currentToken = orderType === 'takeaway' ? tokenNo : undefined;
        const tableOrToken =
          savedOrder.orderType === 'dine-in'
            ? (isUrduLang ? `میز نمبر: ${tableNo}` : isBilingualLang ? `Table / میز: ${tableNo}` : `TABLE: ${tableNo}`)
            : savedOrder.orderType === 'takeaway'
            ? (isUrduLang ? `ٹوکن نمبر: #${currentToken || 1}` : isBilingualLang ? `Token / ٹوکن: #${currentToken || 1}` : `TOKEN: #${currentToken || 1}`)
            : (isUrduLang ? 'ڈیلیوری (DELIVERY)' : isBilingualLang ? 'Delivery / ڈیلیوری' : 'DELIVERY');

        void printCustomerReceipt(savedOrder, {
          tableOrToken,
          storeSettings: freshSettings,
          paymentMode: savedOrder.paymentMode || paymentMode,
          tenderedAmount: typeof tenderedAmount === 'number' ? tenderedAmount : undefined,
          language: currentLang,
        });
      } catch (printErr) {
        console.warn('[Auto-Print] Error during auto print on confirm:', printErr);
      }
    },
  });
  /* Cashier Keyboard Shortcuts (F2: Barcode Scan, F4: Hold, F9: Checkout) */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      if (e.key === 'F2') {
        e.preventDefault();
        scannerInputRef.current?.focus();
        scannerInputRef.current?.select();
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        handleParkOrder();
        return;
      }

      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0 && !isPending && !(paymentMode === 'khata' && !selectedKhataId)) {
          checkout();
        }
        return;
      }

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        scannerInputRef.current?.focus();
        return;
      }

      // If user triggers a barcode gun anywhere on the page without focusing first
      if (!isInput && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        scannerInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPending, paymentMode, selectedKhataId, orderType, tableNo, tokenNo, deliveryDetails, module, customerPhone, matchedCustomer]);
  const featured = selectedProduct ?? null;

  return {
    module,
    modeType,
    navigate,
    queryClient,
    notifySuccess,
    notifyWarning,
    mode,
    isDark,
    F,
    can,
    hasFastFood,
    hasOmnimart,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    selectedProduct,
    setSelectedProduct,
    selectedQty,
    setSelectedQty,
    cart,
    setCart,
    isCartExpanded,
    setIsCartExpanded,
    discountMode,
    setDiscountMode,
    discountValue,
    setDiscountValue,
    discountInput,
    setDiscountInput,
    deliveryFee,
    setDeliveryFee,
    isSuccess,
    setIsSuccess,
    lastOrder,
    setLastOrder,
    showReceiptModal,
    setShowReceiptModal,
    showA4Invoice,
    setShowA4Invoice,
    paymentMode,
    setPaymentMode,
    splitCashAmount,
    setSplitCashAmount,
    splitOnlineAmount,
    setSplitOnlineAmount,
    splitKhataAmount,
    setSplitKhataAmount,
    selectedKhataId,
    setSelectedKhataId,
    storeSettings,
    setStoreSettings,
    modalReceiptLang,
    setModalReceiptLang,
    modalGoogleQrDataUrl,
    setModalGoogleQrDataUrl,
    refreshStoreSettings,
    orderType,
    setOrderType,
    tableNo,
    setTableNo,
    tokenNo,
    setTokenNo,
    deliveryDetails,
    setDeliveryDetails,
    parkedOrders,
    setParkedOrders,
    showParkedModal,
    setShowParkedModal,
    tenderedAmount,
    setTenderedAmount,
    editingNoteItem,
    setEditingNoteItem,
    viewMode,
    setViewMode,
    barcodeInput,
    setBarcodeInput,
    lastScannedFeedback,
    setLastScannedFeedback,
    scannerInputRef,
    weighingProduct,
    setWeighingProduct,
    weightAmount,
    setWeightAmount,
    weightCalcMode,
    setWeightCalcMode,
    targetRupees,
    setTargetRupees,
    editingQtyItem,
    setEditingQtyItem,
    customQtyInput,
    setCustomQtyInput,
    customerPhone,
    setCustomerPhone,
    isTopSectionCollapsed,
    setIsTopSectionCollapsed,
    isDiscountCollapsed,
    setIsDiscountCollapsed,
    defaultGuestCustomer,
    selectedCustomer,
    setSelectedCustomer,
    customerSearchQuery,
    setCustomerSearchQuery,
    isCustomerDropdownOpen,
    setIsCustomerDropdownOpen,
    customerDropdownRef,
    customerInputRef,
    formatCustomerBalance,
    variantPickerProduct,
    setVariantPickerProduct,
    customerKhatas,
    handleSelectCustomer,
    handleClearCustomer,
    filteredCustomerOptions,
    products,
    isLoadingProducts,
    dbCategories,
    allCategoryTabs,
    categoryCounts,
    tabScrollRef,
    canScrollLeft,
    setCanScrollLeft,
    canScrollRight,
    setCanScrollRight,
    checkScrollButtons,
    handleScrollTabs,
    filteredProducts,
    matchedCustomer,
    isWeightUnit,
    isLiquidUnit,
    isWeighableOrLiquid,
    handleBarcodeScan,
    handleConfirmWeight,
    handleApplyCustomQty,
    inCartMap,
    addToCart,
    removeFromCart,
    updateCartQty,
    switchCartLineUnit,
    getUnitConversion,
    handleParkOrder,
    handleResumeParkedOrder,
    handleDiscardParkedOrder,
    effectiveDeliveryFee,
    subtotal,
    discountVal,
    effectiveDiscountPct,
    total,
    handleClearDiscount,
    handleApplyPreset,
    checkout,
    isPending,
    featured,
  };
}

export type PosCounterState = ReturnType<typeof usePosCounter>;

/**
 * Wholesale ↔ retail unit setup of a product (e.g. 1 Carton = 24 Pieces), or null.
 * Selling Price is the wholesale (Carton) price; Retail Piece Price is the per-piece price
 * (falls back to Selling Price ÷ rate). Products with sizes/variants are not converted.
 */
export function getUnitConversion(p?: Product | null) {
  const rate = Number(p?.conversionRate || 0);
  if (!p || !p.primaryUnit || rate <= 1 || (p.variants && p.variants.length > 0)) return null;
  const wholesalePrice = Number(p.price) || 0;
  const piece = Number(p.secondaryPrice);
  return {
    rate,
    wholesale: p.primaryUnit,
    retail: p.secondaryUnit || p.unit || 'PCS',
    wholesalePrice,
    retailPrice: piece > 0 ? piece : Math.round((wholesalePrice / rate) * 100) / 100,
  };
}

/** Stock (base) units a cart line will deduct. */
export function cartLineBaseQty(line: Pick<CartLine, 'quantity' | 'unitFactor' | 'selectedUnit'>): number {
  const factor = line.selectedUnit === 'primary' ? Number(line.unitFactor || 1) : 1;
  return Math.round(Number(line.quantity || 0) * factor * 1000) / 1000;
}
