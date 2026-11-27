import React, { useState, useEffect, useRef } from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { playSuccessChime, playErrorBeep } from '@/lib/soundFx';
import { posApi } from '@/lib/api';
import { uid } from '@/lib/utils';
import { Product } from '@shared/types';
import { vendorStorage } from '@/features/inventory/vendorStorage';
import { DIALOG_SMOKE, DIALOG_SHADOW, useEscapeToClose } from '@/features/pos/posDialog';
import { CustomDateField } from '@/components/ui/CustomDateField';
import {
  Dismiss20Regular,
  AddCircle20Regular,
  Tag20Regular,
  Box20Regular,
  Calendar20Regular,
  NumberSymbol20Regular,
  ArrowSyncCircle20Regular,
  Checkmark20Regular,
  Checkmark16Regular,
  Building20Regular,
  ArrowLeft20Regular,
  ArrowRight20Regular,
  Search20Regular,
  Location20Regular,
  Alert20Regular,
  Sparkle20Regular,
} from '@fluentui/react-icons';

type WizardStep = 1 | 2 | 3;

export function QuickAddProductDialog({ pos }: { pos: PosCounterState }) {
  const { businessProfiles = [] } = useLicense();
  const {
    F,
    isDark,
    module,
    isQuickAddOpen,
    closeQuickAdd,
    quickAddInitialBarcode,
    dbCategories = [],
    queryClient,
    addToCart,
    notifySuccess,
    notifyWarning,
  } = pos;

  const isPharmacy = businessProfiles.includes('pharmacy');

  // Wizard Step
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: Category states
  const [category, setCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryUrdu, setNewCategoryUrdu] = useState('');

  // Step 2: Product & Pricing states
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState(isPharmacy ? 'STRIP' : 'PCS');
  const [customUnit, setCustomUnit] = useState('');
  const [price, setPrice] = useState<string>('1'); // Default retail price: 1
  const [costPrice, setCostPrice] = useState<string>('0');
  const [enableDualUnit, setEnableDualUnit] = useState(false);
  const [primaryUnit, setPrimaryUnit] = useState('BOX');
  const [conversionRate, setConversionRate] = useState('10');
  const [secondaryPrice, setSecondaryPrice] = useState('1');

  // Step 3: Stock & Inventory states
  const [stockQty, setStockQty] = useState<string>('10');
  const [minThreshold, setMinThreshold] = useState<string>('5');
  const [rackLocation, setRackLocation] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [vendorName, setVendorName] = useState('Direct Purchase');
  const [addToBillImmediately, setAddToBillImmediately] = useState(true);
  const [billQty, setBillQty] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const stockInputRef = useRef<HTMLInputElement>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEscapeToClose(isQuickAddOpen, closeQuickAdd);

  // Categories list for this module
  const moduleCategories = React.useMemo(() => {
    return dbCategories
      .filter((c) => !c.module || c.module === module)
      .map((c) => c.name);
  }, [dbCategories, module]);

  // Filtered categories in Step 1
  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return moduleCategories;
    const q = categorySearch.toLowerCase().trim();
    return moduleCategories.filter((c) => c.toLowerCase().includes(q));
  }, [moduleCategories, categorySearch]);

  // Vendors list
  const vendorsList = React.useMemo(() => {
    try {
      const v = vendorStorage.getVendors();
      return v.map((item) => item.name);
    } catch {
      return [];
    }
  }, [isQuickAddOpen]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isQuickAddOpen) {
      setStep(1);
      setCategorySearch('');
      setIsNewCategoryMode(false);
      setNewCategoryName('');
      setNewCategoryUrdu('');
      const defaultCat = moduleCategories[0] || (isPharmacy ? 'Tablets & Capsules' : 'General Items');
      setCategory(defaultCat);
      setName('');
      setGenericName('');
      setBarcode(quickAddInitialBarcode || String(Math.floor(10000000 + Math.random() * 90000000)));
      setUnit(isPharmacy ? 'STRIP' : 'PCS');
      setCustomUnit('');
      setPrice('1'); // Default retail price: 1
      setCostPrice('0');
      setEnableDualUnit(false);
      setPrimaryUnit('BOX');
      setConversionRate('10');
      setSecondaryPrice('1');
      setStockQty('10');
      setMinThreshold('5');
      setRackLocation('');
      setBatchNumber('');
      setExpiryDate('');
      setVendorName(vendorsList[0] || 'Direct Purchase');
      setAddToBillImmediately(true);
      setBillQty('1');
      setIsSubmitting(false);
    }
  }, [isQuickAddOpen, quickAddInitialBarcode, moduleCategories, isPharmacy, vendorsList]);

  // Auto-focus appropriate input on step change
  useEffect(() => {
    if (!isQuickAddOpen) return;
    const t = setTimeout(() => {
      if (step === 1 && isNewCategoryMode) {
        newCatInputRef.current?.focus();
      } else if (step === 2) {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      } else if (step === 3) {
        stockInputRef.current?.focus();
        stockInputRef.current?.select();
      }
    }, 100);
    return () => clearTimeout(t);
  }, [step, isNewCategoryMode, isQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  const handleGenerateBarcode = () => {
    setBarcode(String(Math.floor(10000000 + Math.random() * 90000000)));
  };

  const handleSetQuickExpiry = (monthsToAdd: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToAdd);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    setExpiryDate(`${yr}-${mo}-${da}`);
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = () => {
    const finalCat = isNewCategoryMode ? newCategoryName.trim() : category.trim();
    if (!finalCat) {
      playErrorBeep();
      notifyWarning('Please choose or enter a category');
      return;
    }
    setStep(2);
  };

  // Step 2 Validation -> Proceed to Step 3
  const handleProceedToStep3 = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      playErrorBeep();
      notifyWarning('Product Name is required');
      nameInputRef.current?.focus();
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      playErrorBeep();
      notifyWarning('Retail selling price must be greater than 0');
      return;
    }
    setStep(3);
  };

  // Step 3 Final Save
  const handleFinalSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      playErrorBeep();
      notifyWarning('Product Name is required');
      setStep(2);
      return;
    }

    const finalCategory = isNewCategoryMode ? newCategoryName.trim() : category.trim();
    if (!finalCategory) {
      playErrorBeep();
      notifyWarning('Category is required');
      setStep(1);
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      playErrorBeep();
      notifyWarning('Retail selling price must be greater than 0');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. If new category entered, save to Category table
      if (isNewCategoryMode && newCategoryName.trim()) {
        const catExists = moduleCategories.some(
          (c) => c.toLowerCase() === newCategoryName.trim().toLowerCase()
        );
        if (!catExists) {
          try {
            await posApi.saveCategory({
              id: uid('cat_'),
              name: newCategoryName.trim(),
              module,
              profile: isPharmacy ? 'pharmacy' : 'standard',
            });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          } catch (catErr) {
            console.warn('[QuickAdd] Category creation warning:', catErr);
          }
        }
      }

      const newProdId = uid(module === 'fastfood' ? 'prod_ff_' : 'prod_mm_');
      const finalBarcode = barcode.trim() || String(Math.floor(10000000 + Math.random() * 90000000));
      const finalStockQty = Math.max(0, Number(stockQty) || 0);
      const finalCost = Math.max(0, Number(costPrice) || 0);
      const effectiveUnit = customUnit.trim() ? customUnit.trim().toUpperCase() : unit.trim().toUpperCase() || 'PCS';

      // 2. Build product payload
      const newProduct: Product = {
        id: newProdId,
        name: trimmedName,
        module,
        category: finalCategory,
        price: numPrice,
        costPrice: finalCost > 0 ? finalCost : undefined,
        pricingType: 'fixed',
        itemRole: module === 'fastfood' ? 'food_menu' : 'retail_product',
        unit: effectiveUnit,
        skuCode: finalBarcode,
        barcode: finalBarcode,
        genericName: isPharmacy && genericName.trim() ? genericName.trim() : undefined,
        openingStock: finalStockQty,
        minThreshold: minThreshold ? Number(minThreshold) : undefined,
        rackLocation: rackLocation.trim() || undefined,
        trackBatchExpiry: Boolean(batchNumber.trim() || expiryDate),
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate || undefined,
        primaryUnit: enableDualUnit && primaryUnit ? primaryUnit : undefined,
        secondaryUnit: enableDualUnit ? effectiveUnit : undefined,
        conversionRate: enableDualUnit && Number(conversionRate) > 1 ? Number(conversionRate) : undefined,
        secondaryPrice: enableDualUnit && Number(secondaryPrice) > 0 ? Number(secondaryPrice) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await posApi.saveProduct(newProduct);

      // 3. Record Stock In Movement if initial stock entered
      if (finalStockQty > 0) {
        try {
          await posApi.saveStockMovement({
            module,
            type: 'in',
            productId: newProdId,
            productName: newProduct.name,
            quantity: finalStockQty,
            unitCost: finalCost,
            batchNumber: batchNumber.trim() || undefined,
            expiryDate: expiryDate || undefined,
            vendorName: vendorName.trim() || 'Direct Purchase',
            reason: 'POS Quick Stock In',
            lineTotal: finalStockQty * finalCost,
            date: new Date().toISOString(),
          });
        } catch (mErr) {
          console.warn('[QuickAdd] Stock movement log error:', mErr);
        }
      }

      // 4. Invalidate queries so POS and catalog update in real time
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });

      // 5. If "Add to current bill" is checked, immediately add to active cart
      if (addToBillImmediately) {
        addToCart(newProduct, Math.max(1, Number(billQty) || 1));
      }

      playSuccessChime();
      notifySuccess(`"${newProduct.name}" created with ${finalStockQty} ${newProduct.unit} in stock!`);
      closeQuickAdd();
    } catch (err: any) {
      playErrorBeep();
      notifyWarning(err?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    boxSizing: 'border-box',
    padding: '0 12px',
    borderRadius: '6px',
    border: `1px solid ${F.border}`,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
    color: F.textPrimary,
    fontSize: '13px',
    outline: 'none',
    fontFamily: F.font,
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: F.textSecondary,
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };

  const unitPresets = isPharmacy
    ? ['STRIP', 'BOX', 'TABLET', 'CAPSULE', 'SYRUP', 'VIAL', 'PCS']
    : ['PCS', 'KG', 'PACK', 'BOX', 'DOZEN', 'BOTTLE', 'ROLL'];

  const saltPresets = [
    'Paracetamol',
    'Amoxicillin',
    'Omeprazole',
    'Ibuprofen',
    'Ciprofloxacin',
    'Azithromycin',
    'Metformin',
    'Diclofenac',
  ];

  // Calculated Margin
  const numP = Number(price) || 0;
  const numC = Number(costPrice) || 0;
  const profit = numP - numC;
  const marginPct = numP > 0 ? ((profit / numP) * 100).toFixed(1) : '0';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: DIALOG_SMOKE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuickAdd();
      }}
    >
      <div
        style={{
          width: '820px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: F.bgCard,
          borderRadius: '14px',
          boxShadow: DIALOG_SHADOW,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : F.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: F.font,
        }}
      >
        {/* ── Dialog Header & Stepper Bar ── */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${F.border}`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                  color: isDark ? '#34D399' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AddCircle20Regular style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: F.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Quick Add Product & Stock</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                      color: F.textSecondary,
                    }}
                  >
                    F3
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: F.textSecondary }}>
                  {step === 1 && 'Step 1 of 3: Choose or Create Category'}
                  {step === 2 && 'Step 2 of 3: Product Details & Pricing'}
                  {step === 3 && 'Step 3 of 3: Initial Stock, Vendor & Shelf'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeQuickAdd}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: F.textSecondary,
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close (Esc)"
            >
              <Dismiss20Regular style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '32px',
                borderRadius: '6px',
                border: `1px solid ${step === 1 ? F.accentRed : isDark ? 'rgba(255,255,255,0.08)' : F.border}`,
                backgroundColor:
                  step === 1
                    ? isDark
                      ? 'rgba(229, 25, 55, 0.15)'
                      : '#FEF2F2'
                    : step > 1
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.12)'
                      : '#ECFDF5'
                    : 'transparent',
                color:
                  step === 1
                    ? F.accentRed
                    : step > 1
                    ? isDark
                      ? '#34D399'
                      : '#059669'
                    : F.textSecondary,
                fontSize: '12px',
                fontWeight: step === 1 ? 700 : 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: step > 1 ? (isDark ? '#34D399' : '#059669') : step === 1 ? F.accentRed : isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                  color: step >= 1 ? '#FFFFFF' : F.textSecondary,
                }}
              >
                {step > 1 ? <Checkmark16Regular style={{ width: 12, height: 12 }} /> : '1'}
              </span>
              <span>1. Category</span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (category.trim() || newCategoryName.trim()) setStep(2);
                else notifyWarning('Please choose a category first');
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '32px',
                borderRadius: '6px',
                border: `1px solid ${step === 2 ? F.accentRed : isDark ? 'rgba(255,255,255,0.08)' : F.border}`,
                backgroundColor:
                  step === 2
                    ? isDark
                      ? 'rgba(229, 25, 55, 0.15)'
                      : '#FEF2F2'
                    : step > 2
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.12)'
                      : '#ECFDF5'
                    : 'transparent',
                color:
                  step === 2
                    ? F.accentRed
                    : step > 2
                    ? isDark
                      ? '#34D399'
                      : '#059669'
                    : F.textSecondary,
                fontSize: '12px',
                fontWeight: step === 2 ? 700 : 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: step > 2 ? (isDark ? '#34D399' : '#059669') : step === 2 ? F.accentRed : isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                  color: step >= 2 ? '#FFFFFF' : F.textSecondary,
                }}
              >
                {step > 2 ? <Checkmark16Regular style={{ width: 12, height: 12 }} /> : '2'}
              </span>
              <span>2. Product & Price</span>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => {
                if (!category.trim() && !newCategoryName.trim()) {
                  notifyWarning('Please choose a category first');
                  setStep(1);
                  return;
                }
                if (!name.trim()) {
                  notifyWarning('Please enter Product Name');
                  setStep(2);
                  return;
                }
                setStep(3);
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '32px',
                borderRadius: '6px',
                border: `1px solid ${step === 3 ? F.accentRed : isDark ? 'rgba(255,255,255,0.08)' : F.border}`,
                backgroundColor:
                  step === 3
                    ? isDark
                      ? 'rgba(229, 25, 55, 0.15)'
                      : '#FEF2F2'
                    : 'transparent',
                color: step === 3 ? F.accentRed : F.textSecondary,
                fontSize: '12px',
                fontWeight: step === 3 ? 700 : 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: step === 3 ? F.accentRed : isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                  color: step === 3 ? '#FFFFFF' : F.textSecondary,
                }}
              >
                3
              </span>
              <span>3. Stock In</span>
            </button>
          </div>
        </div>

        {/* ── Dialog Body (Switches with Step) ── */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: '340px' }}>
          {/* ══════════════════════════════════════════════════════════════════════════════
              STEP 1: CATEGORY SELECTION & NEW CATEGORY SETUP
             ══════════════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: F.textPrimary }}>
                  {isNewCategoryMode ? 'Create New Category' : 'Select Existing Category'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: F.accentRed,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {isNewCategoryMode ? '← Pick Existing Category' : '+ Create New Category'}
                </button>
              </div>

              {isNewCategoryMode ? (
                /* New Category Form */
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                    border: `1px solid ${F.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      <Tag20Regular style={{ width: 14, height: 14 }} />
                      <span>Category Name in English *</span>
                    </label>
                    <input
                      ref={newCatInputRef}
                      type="text"
                      placeholder="e.g. Injections, Baby Care, Snacks, Beverages"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleProceedToStep2();
                        }
                      }}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      <span>Category Name in Urdu (اختیاری)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثلاً: ٹیکے، بچوں کی دیکھ بھال، مشروبات"
                      dir="rtl"
                      value={newCategoryUrdu}
                      onChange={(e) => setNewCategoryUrdu(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ fontSize: '11px', color: F.textSecondary, lineHeight: '1.4' }}>
                    Note: Yeh nayi category aap ke store catalog mein hamesha ke liye save ho jaegi aur POS categories bar mein bhi show hogi.
                  </div>
                </div>
              ) : (
                /* Existing Categories Browser */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Category Search Filter */}
                  <div style={{ position: 'relative' }}>
                    <Search20Regular
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: F.textSecondary,
                        width: 16,
                        height: 16,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search category (Press Enter to pick)..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredCategories.length > 0) {
                            setCategory(filteredCategories[0]);
                            setStep(2);
                          } else if (category.trim()) {
                            setStep(2);
                          }
                        }
                      }}
                      style={{ ...inputStyle, paddingLeft: '32px' }}
                    />
                  </div>

                  {/* Categories Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                      gap: '8px',
                      maxHeight: '230px',
                      overflowY: 'auto',
                      padding: '4px 2px',
                    }}
                  >
                    {filteredCategories.map((catName) => {
                      const isSelected = category.toLowerCase() === catName.toLowerCase();
                      return (
                        <div
                          key={catName}
                          onClick={() => setCategory(catName)}
                          onDoubleClick={() => {
                            setCategory(catName);
                            setStep(2);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: `1.5px solid ${isSelected ? F.accentRed : isDark ? 'rgba(255,255,255,0.08)' : F.border}`,
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(229, 25, 55, 0.15)'
                                : '#FEF2F2'
                              : isDark
                              ? 'rgba(255,255,255,0.03)'
                              : '#FFFFFF',
                            color: isSelected ? F.accentRed : F.textPrimary,
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <Tag20Regular style={{ width: 14, height: 14, flexShrink: 0, opacity: isSelected ? 1 : 0.6 }} />
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {catName}
                            </span>
                          </div>
                          {isSelected && <Checkmark20Regular style={{ width: 16, height: 16, color: F.accentRed, flexShrink: 0 }} />}
                        </div>
                      );
                    })}

                    {filteredCategories.length === 0 && (
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          padding: '24px',
                          textAlign: 'center',
                          color: F.textSecondary,
                          fontSize: '12px',
                        }}
                      >
                        No category matching "{categorySearch}".{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCategoryMode(true);
                            setNewCategoryName(categorySearch);
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: F.accentRed,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Create "{categorySearch}" now?
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Selection Indicator */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                      border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0'}`,
                      color: isDark ? '#34D399' : '#065F46',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Selected: <strong>{category || 'None selected'}</strong></span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Double-click category or click Next</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════
              STEP 2: PRODUCT DETAILS & PRICING
             ══════════════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Product Name */}
              <div>
                <label style={labelStyle}>
                  <Box20Regular style={{ width: 14, height: 14 }} />
                  <span>Item / Product Name *</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder={isPharmacy ? 'e.g. Panadol 500mg, Disprin, Augmentin 625mg' : 'e.g. Pepsi 1.5L, Lays Masala, Rice Super'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleProceedToStep3();
                    }
                  }}
                  style={{ ...inputStyle, fontWeight: 600 }}
                />
              </div>

              {/* Pharmacy Generic / Salt Name */}
              {isPharmacy && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      <Sparkle20Regular style={{ width: 14, height: 14, color: '#3B82F6' }} />
                      <span>Generic / Salt Formula (Dawai ka Formula)</span>
                    </label>
                    <span style={{ fontSize: '10px', color: F.textSecondary }}>Pharmacy Only</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol, Amoxicillin, Omeprazole"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    style={inputStyle}
                  />

                  {/* Salt Quick Preset Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {saltPresets.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setGenericName(s)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${genericName === s ? '#3B82F6' : F.border}`,
                          backgroundColor: genericName === s ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                          color: genericName === s ? '#3B82F6' : F.textSecondary,
                          cursor: 'pointer',
                          fontWeight: genericName === s ? 700 : 500,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Barcode & SKU */}
              <div>
                <label style={labelStyle}>
                  <NumberSymbol20Regular style={{ width: 14, height: 14 }} />
                  <span>Barcode / SKU (Scanned or Generated)</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Barcode from scanner or manual code"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    title="Generate new random 8-digit barcode"
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: `1px solid ${F.border}`,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                      color: F.textPrimary,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowSyncCircle20Regular style={{ width: 14, height: 14 }} />
                    <span>Generate Code</span>
                  </button>
                </div>
              </div>

              {/* Unit of Measure */}
              <div>
                <label style={labelStyle}>
                  <span>Unit of Measure</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {unitPresets.map((u) => {
                    const active = unit.toUpperCase() === u && !customUnit;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          setUnit(u);
                          setCustomUnit('');
                        }}
                        style={{
                          height: '28px',
                          padding: '0 10px',
                          borderRadius: '4px',
                          border: `1px solid ${active ? F.accentRed : F.border}`,
                          backgroundColor: active ? (isDark ? 'rgba(229, 25, 55, 0.18)' : '#FEF2F2') : 'transparent',
                          color: active ? F.accentRed : F.textPrimary,
                          fontSize: '11px',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom unit (e.g. Sachet, Tube, Jar)"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  style={{ ...inputStyle, height: '30px', fontSize: '12px' }}
                />
              </div>

              {/* Pricing Grid */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                  border: `1px solid ${F.border}`,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div>
                  <label style={labelStyle}>
                    <span>Retail Selling Price (PKR) *</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleProceedToStep3();
                      }
                    }}
                    style={{ ...inputStyle, fontWeight: 700, fontSize: '15px', color: F.accentRed }}
                  />
                  <div style={{ fontSize: '10px', color: F.textSecondary, marginTop: '2px' }}>
                    Customer sale price (Default: 1)
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    <span>Purchase / Cost Price (PKR)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleProceedToStep3();
                      }
                    }}
                    style={{ ...inputStyle, fontWeight: 600, fontSize: '15px' }}
                  />
                  <div style={{ fontSize: '10px', color: profit >= 0 ? '#10B981' : '#EF4444', marginTop: '2px', fontWeight: 600 }}>
                    {numP > 0 && numC > 0 ? `Margin: ${marginPct}% (Profit: PKR ${profit.toFixed(1)})` : 'Enter cost to see margin'}
                  </div>
                </div>
              </div>

              {/* Optional Dual Packaging Unit Toggle (e.g. Box + Piece/Tablet) */}
              <div style={{ borderTop: `1px dashed ${F.border}`, paddingTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: F.textPrimary }}>
                  <input
                    type="checkbox"
                    checked={enableDualUnit}
                    onChange={(e) => setEnableDualUnit(e.target.checked)}
                    style={{ accentColor: F.accentRed, cursor: 'pointer' }}
                  />
                  <span>Enable Dual Packaging (e.g. Wholesale Box & Retail Pieces)</span>
                </label>

                {enableDualUnit && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      marginTop: '8px',
                      padding: '10px',
                      borderRadius: '6px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F1F5F9',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10px', color: F.textSecondary, fontWeight: 600 }}>Wholesale Unit:</span>
                      <input
                        type="text"
                        value={primaryUnit}
                        onChange={(e) => setPrimaryUnit(e.target.value)}
                        placeholder="e.g. Box, Carton"
                        style={{ ...inputStyle, height: '30px', fontSize: '12px', marginTop: '2px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: F.textSecondary, fontWeight: 600 }}>Units per Box:</span>
                      <input
                        type="number"
                        value={conversionRate}
                        onChange={(e) => setConversionRate(e.target.value)}
                        placeholder="e.g. 10 or 30"
                        style={{ ...inputStyle, height: '30px', fontSize: '12px', marginTop: '2px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: F.textSecondary, fontWeight: 600 }}>Single Piece Price:</span>
                      <input
                        type="number"
                        value={secondaryPrice}
                        onChange={(e) => setSecondaryPrice(e.target.value)}
                        placeholder="e.g. 5"
                        style={{ ...inputStyle, height: '30px', fontSize: '12px', marginTop: '2px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════
              STEP 3: STOCK IN, VENDOR & BILLING
             ══════════════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Summary of what will be added */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9',
                  border: `1px solid ${F.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: F.textSecondary }}>Item Preview</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: F.textPrimary }}>
                    {name || 'Product'}
                  </div>
                  <div style={{ fontSize: '11px', color: F.textSecondary }}>
                    Category: <strong>{isNewCategoryMode ? newCategoryName : category}</strong>
                    {isPharmacy && genericName && ` • Salt: ${genericName}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: F.textSecondary }}>Selling Price</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: F.accentRed }}>
                    PKR {Number(price).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stock Quantity & Min Threshold */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>
                    <Box20Regular style={{ width: 14, height: 14 }} />
                    <span>Initial Stock In Quantity *</span>
                  </label>
                  <input
                    ref={stockInputRef}
                    type="number"
                    step="any"
                    min="0"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFinalSave();
                      }
                    }}
                    style={{ ...inputStyle, fontWeight: 700, fontSize: '15px' }}
                  />

                  {/* Quick Qty Chips */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[5, 10, 20, 50, 100].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setStockQty(String(q))}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${F.border}`,
                          backgroundColor: stockQty === String(q) ? (isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0') : 'transparent',
                          color: F.textPrimary,
                          cursor: 'pointer',
                          fontWeight: stockQty === String(q) ? 700 : 500,
                        }}
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    <Alert20Regular style={{ width: 14, height: 14 }} />
                    <span>Low Stock Alert Limit</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFinalSave();
                      }
                    }}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: '10px', color: F.textSecondary, marginTop: '2px' }}>
                    Alerts POS when stock is below this
                  </div>
                </div>
              </div>

              {/* Supplier / Vendor Selection */}
              <div>
                <label style={labelStyle}>
                  <Building20Regular style={{ width: 14, height: 14 }} />
                  <span>Supplier / Vendor</span>
                </label>
                <select
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="Direct Purchase">Direct Purchase / Local Cash</option>
                  {vendorsList.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rack / Shelf Location */}
              <div>
                <label style={labelStyle}>
                  <Location20Regular style={{ width: 14, height: 14 }} />
                  <span>Rack / Shelf / Fridge Location (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shelf B-2, Counter 1, Chiller #3"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFinalSave();
                    }
                  }}
                  style={inputStyle}
                />
              </div>

              {/* Pharmacy: Batch & Expiry */}
              {isPharmacy && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                    border: `1px solid ${F.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>
                        <NumberSymbol20Regular style={{ width: 14, height: 14 }} />
                        <span>Batch / Lot #</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. B-9981"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>
                        <Calendar20Regular style={{ width: 14, height: 14 }} />
                        <span>Expiry Date</span>
                      </label>
                      <CustomDateField
                        value={expiryDate}
                        onChange={setExpiryDate}
                        placeholder="dd Mon yyyy"
                      />
                    </div>
                  </div>

                  {/* Quick Expiry Helper Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: F.textSecondary }}>Quick Expiry:</span>
                    <button
                      type="button"
                      onClick={() => handleSetQuickExpiry(6)}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${F.border}`,
                        backgroundColor: 'transparent',
                        color: F.textSecondary,
                        cursor: 'pointer',
                      }}
                    >
                      +6 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickExpiry(12)}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${F.border}`,
                        backgroundColor: 'transparent',
                        color: F.textSecondary,
                        cursor: 'pointer',
                      }}
                    >
                      +1 Year
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickExpiry(24)}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${F.border}`,
                        backgroundColor: 'transparent',
                        color: F.textSecondary,
                        cursor: 'pointer',
                      }}
                    >
                      +2 Years
                    </button>
                  </div>
                </div>
              )}

              {/* Add to current bill immediately toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
                  border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0'}`,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: isDark ? '#34D399' : '#065F46' }}>
                  <input
                    type="checkbox"
                    checked={addToBillImmediately}
                    onChange={(e) => setAddToBillImmediately(e.target.checked)}
                    style={{ accentColor: '#10B981', cursor: 'pointer' }}
                  />
                  <span>Add to current customer bill immediately</span>
                </label>

                {addToBillImmediately && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: F.textSecondary }}>Bill Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={billQty}
                      onChange={(e) => setBillQty(e.target.value)}
                      style={{ width: '50px', height: '28px', textAlign: 'center', borderRadius: '4px', border: `1px solid ${F.border}`, fontWeight: 700, backgroundColor: F.bgCard, color: F.textPrimary }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Dialog Footer with Step Navigation ── */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: `1px solid ${F.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
          }}
        >
          {/* Left Action: Cancel or Back */}
          {step === 1 ? (
            <button
              type="button"
              onClick={closeQuickAdd}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '6px',
                border: `1px solid ${F.border}`,
                backgroundColor: 'transparent',
                color: F.textPrimary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel (Esc)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '6px',
                border: `1px solid ${F.border}`,
                backgroundColor: 'transparent',
                color: F.textPrimary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft20Regular style={{ width: 16, height: 16 }} />
              <span>Back</span>
            </button>
          )}

          {/* Right Action: Next or Final Save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {step === 1 && (
              <button
                type="button"
                onClick={handleProceedToStep2}
                style={{
                  height: '36px',
                  padding: '0 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: F.accentRed,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(229, 25, 55, 0.3)',
                }}
              >
                <span>Next: Product Info</span>
                <ArrowRight20Regular style={{ width: 16, height: 16 }} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleProceedToStep3}
                style={{
                  height: '36px',
                  padding: '0 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: F.accentRed,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(229, 25, 55, 0.3)',
                }}
              >
                <span>Next: Stock In</span>
                <ArrowRight20Regular style={{ width: 16, height: 16 }} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => handleFinalSave()}
                disabled={isSubmitting}
                style={{
                  height: '36px',
                  padding: '0 22px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                }}
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Checkmark20Regular style={{ width: 18, height: 18 }} />
                    <span>Save & Add Item (↵)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
