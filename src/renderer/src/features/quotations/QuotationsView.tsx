import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Button,
  Subtitle1,
  Body1,
  Caption1,
  Dialog,
  DialogSurface,
  Badge,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Search20Regular,
  Delete20Regular,
  Edit20Regular,
  Print20Regular,
  Dismiss16Regular,
  CheckmarkCircle20Regular,
  DocumentBulletList24Regular,
  DocumentBulletList20Filled,
  ArrowRepeatAll20Regular,
  Timer20Regular,
  Money20Regular,
  BarcodeScanner20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Quotation, Product, ModuleKey, CartLine } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { storage, KEYS } from '@/lib/storage';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { CustomInput, CustomSelect } from '@/components/ui';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { QuotationPrintTemplate } from '@/components/print/QuotationPrintTemplate';
import { useAppToast, useConfirmDialog } from '../../context/AppNotificationContext';

import { useQuotationsStyles, useStyles } from './quotations.styles';

export function QuotationsView(): React.JSX.Element {
  const styles = useQuotationsStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();
  const confirmModal = useConfirmDialog();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'sent' | 'converted' | 'expired'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);

  // Form State
  const [quoteNumber, setQuoteNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [targetModule, setTargetModule] = useState<ModuleKey>('minimart');
  const [validDays, setValidDays] = useState(7);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment terms: 50% advance on order confirmation, 50% upon delivery.');
  const [barcodeToast, setBarcodeToast] = useState<{ isSuccess: boolean; text: string } | null>(null);

  const storeSettings = useMemo(() => {
    return storage.getItem<StoreSettings>(KEYS.storeSettings, {
      storeName: 'OmniPos Retail & Solutions',
      phone: '+92 300 1234567',
      address: 'Main Commercial Area',
      headerNote: 'Quality Products • Professional Service',
      footerNote: 'Thank you for your business!',
      paperWidth: '80mm',
      autoCut: true,
      drawerKick: true,
      currency: 'PKR',
      taxPercent: 0,
    });
  }, []);

  // Fetch Quotations
  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['quotations'],
    queryFn: () => posApi.fetchQuotations(),
  });

  // Fetch Products for autocomplete
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  // Mutations
  const saveQuotationMutation = useMutation({
    mutationFn: (quote: Quotation) => posApi.saveQuotation(quote),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotations'] });
      await queryClient.refetchQueries({ queryKey: ['quotations'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_quotations_updated'));
      }
      setIsDialogOpen(false);
      notifySuccess('Quotation saved successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to save quotation');
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteQuotation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotations'] });
      await queryClient.refetchQueries({ queryKey: ['quotations'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_quotations_updated'));
      }
      notifySuccess('Quotation deleted successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to delete quotation');
    },
  });

  const convertToOrderMutation = useMutation({
    mutationFn: (id: string) => posApi.convertQuotationToOrder(id),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['quotations'] });
      await queryClient.refetchQueries({ queryKey: ['quotations'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.refetchQueries({ queryKey: ['orders'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_quotations_updated'));
        window.dispatchEvent(new CustomEvent('pos_orders_updated'));
      }
      notifySuccess(`Success! Quotation converted to Order #${res.order.id}. Stock updated.`);
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to convert quotation to order');
    },
  });

  // Calculate live totals for the active form
  const subtotal = useMemo(() => {
    return lines.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [lines]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Open modal for new quotation
  const openNewQuotationModal = () => {
    const nextNum = `EST-${1000 + quotations.length + 1}`;
    setEditingQuotation(null);
    setQuoteNumber(nextNum);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setTargetModule('minimart');
    setValidDays(7);
    setLines([]);
    setDiscountPercent(0);
    setNotes('');
    setTerms('Payment terms: 50% advance on order confirmation, 50% upon delivery.');
    setIsDialogOpen(true);
  };

  // Open modal for editing
  const openEditModal = (q: Quotation) => {
    setEditingQuotation(q);
    setQuoteNumber(q.quoteNumber);
    setCustomerName(q.customerName);
    setCustomerPhone(q.customerPhone || '');
    setCustomerAddress(q.customerAddress || '');
    setTargetModule(q.module);
    setLines([...q.lines]);
    setDiscountPercent(q.discountPercent);
    setNotes(q.notes || '');
    setTerms(q.terms || '');
    setIsDialogOpen(true);
  };

  // Line helpers
  const addProductToLines = (prod: Product) => {
    setLines((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === prod.id && !item.variantLabel);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          unitPrice: prod.price,
          quantity: 1,
          variantLabel: prod.unit || undefined,
        },
      ];
    });
  };

  // Hardware Barcode Scanner Listener for Quotation Dialog
  React.useEffect(() => {
    if (!isDialogOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // If user is typing in notes/terms/phone, don't intercept unless it's a barcode burst
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        const candidate = buffer.trim().toLowerCase();
        if (candidate.length >= 2) {
          const match = products.find((p) => {
            if (p.barcode && p.barcode.toLowerCase() === candidate) return true;
            if (p.skuCode && p.skuCode.toLowerCase() === candidate) return true;
            if (p.id.toLowerCase() === candidate) return true;
            if (`sku-${p.id.slice(-6)}`.toLowerCase() === candidate) return true;
            return (
              p.variants &&
              p.variants.some(
                (v) =>
                  (v.skuCode && v.skuCode.toLowerCase() === candidate) ||
                  ((v as any).barcode && (v as any).barcode.toLowerCase() === candidate)
              )
            );
          });

          if (match) {
            e.preventDefault();
            addProductToLines(match);
            setBarcodeToast({ isSuccess: true, text: `Scanned: ${match.name} (PKR ${match.price})` });
            setTimeout(() => setBarcodeToast(null), 3500);
            buffer = '';
            return;
          }
        }
        buffer = '';
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 120) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDialogOpen, products]);

  const addCustomLine = () => {
    setLines((prev) => [
      ...prev,
      {
        productId: uid('custom_'),
        name: 'Installation / Custom Service',
        unitPrice: 1000,
        quantity: 1,
        variantLabel: 'JOB',
      },
    ]);
  };

  const updateLineQty = (index: number, qty: number) => {
    setLines((prev) => {
      const next = [...prev];
      next[index].quantity = Math.max(1, qty);
      return next;
    });
  };

  const updateLinePrice = (index: number, price: number) => {
    setLines((prev) => {
      const next = [...prev];
      next[index].unitPrice = Math.max(0, price);
      return next;
    });
  };

  const updateLineName = (index: number, name: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index].name = name;
      return next;
    });
  };

  const updateLineVariant = (index: number, spec: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index].variantLabel = spec;
      return next;
    });
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit quotation form
  const handleSaveQuotation = (status: 'draft' | 'sent' = 'draft') => {
    if (!customerName.trim()) {
      notifyWarning('Please enter a customer name for the quotation.');
      return;
    }
    if (lines.length === 0) {
      notifyWarning('Please add at least one line item to the quotation.');
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validDays);

    const quote: Quotation = {
      id: editingQuotation ? editingQuotation.id : uid('quote_'),
      quoteNumber: quoteNumber.trim() || `EST-${Date.now().toString().slice(-4)}`,
      module: targetModule,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      lines,
      subtotal,
      discountPercent,
      discountAmount,
      totalAmount,
      validUntil: expiryDate.toISOString(),
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      status: editingQuotation ? editingQuotation.status : status,
      createdAt: editingQuotation ? editingQuotation.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveQuotationMutation.mutate(quote);
  };

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const totalCount = quotations.length;
    const totalValue = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
    const converted = quotations.filter((q) => q.status === 'converted').length;
    const pending = quotations.filter((q) => q.status === 'draft' || q.status === 'sent').length;
    const conversionRate = totalCount > 0 ? Math.round((converted / totalCount) * 100) : 0;
    return { totalCount, totalValue, converted, pending, conversionRate };
  }, [quotations]);

  // Filtered list
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesSearch =
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.customerPhone && q.customerPhone.includes(searchTerm));

      const matchesStatus = selectedStatus === 'all' || q.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, selectedStatus]);

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <DocumentBulletList24Regular />
          </div>
          <div>
            <Subtitle1 className={styles.titleBold}>Quotations & Price Estimates</Subtitle1>
            <div>
              <Caption1 className={styles.captionMuted}>
                Generate estimates, print formal A4 quotes, and convert to sale with 1-click
              </Caption1>
            </div>
          </div>
        </div>

        <Button
          appearance="primary"
          icon={<Add20Regular />}
          onClick={openNewQuotationModal}
          className={styles.btnPrimaryRed}
        >
          + Create Quotation
        </Button>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <DocumentBulletList20Filled className={styles.iconSky} /> Total Estimates
          </div>
          <div className={styles.kpiValue}>{kpiStats.totalCount}</div>
          <div className={styles.kpiSub}>Total Pipeline: {formatPKR(kpiStats.totalValue)}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <Timer20Regular className={styles.iconAmber} /> Pending Quotes
          </div>
          <div className={styles.kpiValue}>{kpiStats.pending}</div>
          <div className={styles.kpiSub}>Awaiting client confirmation</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <CheckmarkCircle20Regular className={styles.iconEmerald} /> Converted to Sales
          </div>
          <div className={mergeClasses(styles.kpiValue, styles.kpiValueEmerald)}>
            {kpiStats.converted}
          </div>
          <div className={styles.kpiSub}>{kpiStats.conversionRate}% conversion rate</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <Money20Regular className={styles.iconRed} /> Pipeline Value
          </div>
          <div className={mergeClasses(styles.kpiValue, styles.kpiValueRed)}>
            {formatPKR(kpiStats.totalValue)}
          </div>
          <div className={styles.kpiSub}>Estimated gross potential</div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search20Regular className={styles.iconMuted} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by quote #, customer, mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.statusTabs}>
          {(['all', 'draft', 'sent', 'converted', 'expired'] as const).map((st) => (
            <button
              key={st}
              type="button"
              className={`${styles.statusTab} ${selectedStatus === st ? styles.statusTabActive : ''}`}
              onClick={() => setSelectedStatus(st)}
            >
              {st === 'all' ? 'All Estimates' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quotations Table ── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Quote #</th>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Date & Validity</th>
              <th className={styles.th}>Items Overview</th>
              <th className={mergeClasses(styles.th, styles.thRight)}>
                Total (PKR)
              </th>
              <th className={mergeClasses(styles.th, styles.thCenter)}>
                Status
              </th>
              <th className={mergeClasses(styles.th, styles.thRight)}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className={styles.loadingTd}>
                  Loading quotations...
                </td>
              </tr>
            ) : filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyTd}>
                  <DocumentBulletList24Regular className={styles.emptyIcon} />
                  <div className={styles.emptyTitle}>
                    No quotations found
                  </div>
                  <div className={styles.emptySub}>
                    Click "+ Create Quotation" above to prepare your first client price estimate
                  </div>
                </td>
              </tr>
            ) : (
              filteredQuotations.map((quote) => {
                const created = new Date(quote.createdAt).toLocaleDateString('en-PK', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const valid = quote.validUntil
                  ? new Date(quote.validUntil).toLocaleDateString('en-PK', {
                      day: '2-digit',
                      month: 'short',
                    })
                  : 'N/A';

                return (
                  <tr key={quote.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.quoteNumberText}>{quote.quoteNumber}</span>
                      <div className={styles.moduleMuted}>
                        {quote.module === 'fastfood' ? 'Food Menu' : 'Mart / Retail'}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div className={styles.customerNameBold}>{quote.customerName}</div>
                      {quote.customerPhone && (
                        <div className={styles.customerPhoneMuted}>
                          {quote.customerPhone}
                        </div>
                      )}
                    </td>

                    <td className={styles.td}>
                      <div>{created}</div>
                      <div className={styles.validityText}>
                        Valid Till: <span className={styles.fontSemiBold}>{valid}</span>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div className={styles.fontSemiBold}>{quote.lines.length} Item(s)</div>
                      <div className={styles.lineOverviewText}>
                        {quote.lines.map((l) => `${l.quantity}x ${l.name}`).join(', ')}
                      </div>
                    </td>

                    <td className={mergeClasses(styles.td, styles.totalPriceCell)}>
                      {formatPKR(quote.totalAmount)}
                    </td>

                    <td className={mergeClasses(styles.td, styles.thCenter)}>
                      <span
                        className={mergeClasses(
                          styles.statusPill,
                          quote.status === 'converted' && styles.statusConverted,
                          quote.status === 'sent' && styles.statusSent,
                          quote.status !== 'converted' && quote.status !== 'sent' && styles.statusPending
                        )}
                      >
                        {quote.status}
                      </span>
                    </td>

                    <td className={mergeClasses(styles.td, styles.thRight)}>
                      <div className={styles.actionGroup}>
                        {/* Print Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Print A4 Quotation"
                          onClick={() => setPrintingQuotation(quote)}
                        >
                          <Print20Regular className={styles.printIcon} />
                        </button>

                        {/* Convert to Sale Button */}
                        {quote.status !== 'converted' && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Convert to Sale Bill"
                            onClick={async () => {
                              const ok = await confirmModal({
                                title: 'Convert to POS Sale',
                                message: `Convert quotation ${quote.quoteNumber} directly into a confirmed POS Sale? Stock will be deducted immediately.`,
                                confirmLabel: 'Convert to Sale',
                              });
                              if (ok) {
                                convertToOrderMutation.mutate(quote.id);
                              }
                            }}
                          >
                            <CheckmarkCircle20Regular className={styles.convertIcon} />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Edit Quotation"
                          onClick={() => openEditModal(quote)}
                        >
                          <Edit20Regular className={styles.editIcon} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Delete"
                          onClick={async () => {
                            const ok = await confirmModal({
                              title: 'Delete Quotation',
                              message: `Are you sure you want to delete quotation ${quote.quoteNumber}? This action cannot be undone.`,
                              confirmLabel: 'Delete Quotation',
                              intent: 'danger',
                            });
                            if (ok) {
                              deleteQuotationMutation.mutate(quote.id);
                            }
                          }}
                        >
                          <Delete20Regular className={styles.deleteIcon} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Dialog: Create / Edit Quotation Modal ── */}
      <Dialog open={isDialogOpen} onOpenChange={(_, d) => setIsDialogOpen(d.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <div className={styles.dialogHeader}>
            <div className={styles.dialogHeaderLeft}>
              <div className={styles.dialogHeaderIconBox}>
                <DocumentBulletList24Regular />
              </div>
              <div>
                <div className={styles.dialogTitleText}>
                  {editingQuotation ? `Edit Quotation (${editingQuotation.quoteNumber})` : 'Create New Price Estimate'}
                </div>
                <div className={styles.dialogSubText}>
                  Prepare itemized commercial quotation for client
                </div>
              </div>
            </div>

            <Button
              size="small"
              appearance="subtle"
              icon={<Dismiss16Regular />}
              onClick={() => setIsDialogOpen(false)}
            />
          </div>

          {/* Form Top Section: Customer & Meta */}
          <div className={styles.dialogFormGrid}>
            <CustomInput
              label="Customer / Company Name"
              required
              placeholder="e.g. Ali Traders / Usman Khan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <CustomInput
              label="Mobile / Phone"
              placeholder="e.g. 0300 1234567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />

            <CustomInput
              label="Quote Number"
              required
              placeholder="e.g. EST-1001"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
            />

            <CustomSelect
              label="Target Store Module"
              value={targetModule}
              options={[
                { value: 'minimart', label: 'Mart / Retail & Solutions' },
                { value: 'fastfood', label: 'Food & Catering' },
              ]}
              onChange={(val) => setTargetModule(val as ModuleKey)}
            />

            <CustomInput
              label="Validity Duration (Days)"
              type="number"
              value={validDays.toString()}
              onChange={(e) => setValidDays(Math.max(1, parseInt(e.target.value) || 7))}
            />

            <CustomInput
              label="Customer Address / Site"
              placeholder="e.g. Gulberg III, Lahore"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </div>

          {/* Item Picker & Line Items Header */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeaderRow}>
              <div className={styles.itemsSectionTitle}>
                Quotation Line Items ({lines.length})
              </div>
              <Button size="small" appearance="subtle" onClick={addCustomLine} className={styles.addCustomBtn}>
                + Add Custom Service / Job
              </Button>
            </div>

            {/* Rapid Search from Catalog with Barcode Gun support */}
            <div className={styles.searchScannerContainer}>
              <div className={styles.searchScannerRow}>
                <div className={styles.flex1}>
                  <ProductAutocomplete
                    placeholder="Search catalog by product name, SKU or barcode to add to quotation..."
                    onSelectProduct={addProductToLines}
                    filterModule="all"
                    clearOnSelect={true}
                    onChange={() => {}}
                  />
                </div>
                <div
                  className={styles.scannerBadge}
                  title="Barcode gun is active. You can scan barcodes directly anytime."
                >
                  <BarcodeScanner20Regular className={styles.scannerIcon} />
                  <span>Scanner Gun Ready</span>
                </div>
              </div>

              {/* Barcode Scanner Feedback Toast */}
              {barcodeToast && (
                <div
                  className={mergeClasses(
                    styles.scannerToast,
                    barcodeToast.isSuccess ? styles.scannerToastSuccess : styles.scannerToastError
                  )}
                >
                  {barcodeToast.isSuccess ? (
                    <CheckmarkCircle20Regular className={styles.scannerToastIcon} />
                  ) : (
                    <Dismiss16Regular className={styles.scannerToastIcon} />
                  )}
                  <span>{barcodeToast.text}</span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className={styles.lineItemsTableWrap}>
              <table className={styles.lineItemsTable}>
                <thead>
                  <tr className={styles.lineItemsTheadTr}>
                    <th className={styles.thItemName}>Item Name</th>
                    <th className={styles.thSpecUnit}>Spec / Unit</th>
                    <th className={styles.thQty}>Qty</th>
                    <th className={styles.thRate}>Unit Rate</th>
                    <th className={styles.thLineTotal}>Line Total</th>
                    <th className={styles.thDeleteCol} />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyLinesTd}>
                        Search and select products above, or click "+ Add Custom Service" to build quote
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, idx) => (
                      <tr key={`${line.productId}_${idx}`} className={styles.lineItemTr}>
                        <td className={styles.tdItemName}>
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => updateLineName(idx, e.target.value)}
                            className={styles.inputItemName}
                          />
                        </td>
                        <td className={styles.tdSpecUnit}>
                          <input
                            type="text"
                            placeholder="e.g. 4ch / PCS"
                            value={line.variantLabel || ''}
                            onChange={(e) => updateLineVariant(idx, e.target.value)}
                            className={styles.inputSpecUnit}
                          />
                        </td>
                        <td className={styles.tdQty}>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 1)}
                            className={styles.inputQty}
                          />
                        </td>
                        <td className={styles.tdRate}>
                          <input
                            type="number"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => updateLinePrice(idx, parseFloat(e.target.value) || 0)}
                            className={styles.inputRate}
                          />
                        </td>
                        <td className={styles.tdLineTotal}>
                          {formatPKR(line.quantity * line.unitPrice)}
                        </td>
                        <td className={styles.tdDeleteCol}>
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className={styles.deleteLineBtn}
                          >
                            <Delete20Regular />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Totals Bar */}
          <div className={styles.bottomTotalsBar}>
            {/* Notes & Terms input */}
            <div className={styles.notesCol}>
              <input
                type="text"
                placeholder="Client Note (e.g. Includes 1-year CCTV onsite service warranty)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.noteInput}
              />
              <input
                type="text"
                placeholder="Payment terms & conditions..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className={styles.noteInput}
              />
            </div>

            {/* Calculations Box */}
            <div className={styles.calcBox}>
              <div className={styles.calcRow}>
                <span className={styles.colorMuted3}>Subtotal:</span>
                <span className={styles.fontSemiBold}>{formatPKR(subtotal)}</span>
              </div>

              <div className={styles.calcRowCenter}>
                <span className={styles.colorMuted3}>Discount %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className={styles.discountInput}
                />
              </div>

              <div className={styles.grandTotalRow}>
                <span>GRAND TOTAL:</span>
                <span>{formatPKR(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className={styles.dialogActionsRow}>
            <Button appearance="subtle" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              appearance="secondary"
              onClick={() => handleSaveQuotation('draft')}
              disabled={saveQuotationMutation.isPending}
            >
              Save as Draft
            </Button>
            <Button
              appearance="primary"
              onClick={() => handleSaveQuotation('sent')}
              disabled={saveQuotationMutation.isPending}
              className={styles.btnSaveFinalize}
            >
              Save & Finalize Quote
            </Button>
          </div>
        </DialogSurface>
      </Dialog>

      {/* ── Quotation Print Modal ── */}
      {printingQuotation && (
        <QuotationPrintTemplate
          quotation={printingQuotation}
          storeSettings={storeSettings}
          onClose={() => setPrintingQuotation(null)}
        />
      )}
    </div>
  );
}
