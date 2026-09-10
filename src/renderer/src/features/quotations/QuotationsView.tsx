import React, { useState, useMemo } from 'react';
import {
  makeStyles,
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

const useStyles = makeStyles({
  container: {
    padding: '24px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: 'rgba(229, 25, 55, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  kpiCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    padding: '16px 18px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: tokens.shadow2,
  },
  kpiTitle: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  kpiSub: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
    borderRadius: '8px',
    padding: '0 12px',
    height: '38px',
    flex: '1',
    maxWidth: '380px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    marginLeft: '8px',
    width: '100%',
  },
  statusTabs: {
    display: 'flex',
    gap: '6px',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '4px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
  },
  statusTab: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  statusTabActive: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    ':hover': {
      backgroundColor: '#C4122C',
    },
  },
  tableCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
    overflow: 'hidden',
    boxShadow: tokens.shadow2,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '12px 16px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  td: {
    padding: '14px 16px',
    fontSize: '12.5px',
    color: tokens.colorNeutralForeground1,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  tr: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  actionBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  dialogSurface: {
    maxWidth: '850px',
    width: '100%',
    borderRadius: '14px',
    padding: '24px',
    maxHeight: '92vh',
    overflowY: 'auto',
  },
});

export function QuotationsView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setIsDialogOpen(false);
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const convertToOrderMutation = useMutation({
    mutationFn: (id: string) => posApi.convertQuotationToOrder(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      alert(`Success! Quotation converted to Order #${res.order.id}. Stock updated.`);
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
      alert('Please enter a customer name for the quotation.');
      return;
    }
    if (lines.length === 0) {
      alert('Please add at least one line item to the quotation.');
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
            <Subtitle1 style={{ fontWeight: 800 }}>Quotations & Price Estimates</Subtitle1>
            <div>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                Generate estimates, print formal A4 quotes, and convert to sale with 1-click
              </Caption1>
            </div>
          </div>
        </div>

        <Button
          appearance="primary"
          icon={<Add20Regular />}
          onClick={openNewQuotationModal}
          style={{
            backgroundColor: '#E51937',
            color: '#FFFFFF',
            fontWeight: 700,
            borderRadius: '8px',
          }}
        >
          + Create Quotation
        </Button>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <DocumentBulletList20Filled style={{ color: '#0284C7' }} /> Total Estimates
          </div>
          <div className={styles.kpiValue}>{kpiStats.totalCount}</div>
          <div className={styles.kpiSub}>Total Pipeline: {formatPKR(kpiStats.totalValue)}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <Timer20Regular style={{ color: '#F59E0B' }} /> Pending Quotes
          </div>
          <div className={styles.kpiValue}>{kpiStats.pending}</div>
          <div className={styles.kpiSub}>Awaiting client confirmation</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <CheckmarkCircle20Regular style={{ color: '#10B981' }} /> Converted to Sales
          </div>
          <div className={styles.kpiValue} style={{ color: '#10B981' }}>
            {kpiStats.converted}
          </div>
          <div className={styles.kpiSub}>{kpiStats.conversionRate}% conversion rate</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>
            <Money20Regular style={{ color: '#E51937' }} /> Pipeline Value
          </div>
          <div className={styles.kpiValue} style={{ color: '#E51937' }}>
            {formatPKR(kpiStats.totalValue)}
          </div>
          <div className={styles.kpiSub}>Estimated gross potential</div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search20Regular style={{ color: tokens.colorNeutralForeground4 }} />
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
              <th className={styles.th} style={{ textAlign: 'right' }}>
                Total (PKR)
              </th>
              <th className={styles.th} style={{ textAlign: 'center' }}>
                Status
              </th>
              <th className={styles.th} style={{ textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                  Loading quotations...
                </td>
              </tr>
            ) : filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                  <DocumentBulletList24Regular style={{ fontSize: '36px', color: tokens.colorNeutralForeground4, marginBottom: '8px' }} />
                  <div style={{ fontWeight: 700, fontSize: '14px', color: tokens.colorNeutralForeground2 }}>
                    No quotations found
                  </div>
                  <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground4, marginTop: '2px' }}>
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
                      <span style={{ fontWeight: 800, color: '#E51937' }}>{quote.quoteNumber}</span>
                      <div style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground4 }}>
                        {quote.module === 'fastfood' ? 'Food Menu' : 'Mart / Retail'}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontWeight: 700 }}>{quote.customerName}</div>
                      {quote.customerPhone && (
                        <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                          {quote.customerPhone}
                        </div>
                      )}
                    </td>

                    <td className={styles.td}>
                      <div>{created}</div>
                      <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                        Valid Till: <span style={{ fontWeight: 600 }}>{valid}</span>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div style={{ fontWeight: 600 }}>{quote.lines.length} Item(s)</div>
                      <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground4, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {quote.lines.map((l) => `${l.quantity}x ${l.name}`).join(', ')}
                      </div>
                    </td>

                    <td className={styles.td} style={{ textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>
                      {formatPKR(quote.totalAmount)}
                    </td>

                    <td className={styles.td} style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontWeight: 700,
                          backgroundColor:
                            quote.status === 'converted'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : quote.status === 'sent'
                              ? 'rgba(2, 132, 199, 0.12)'
                              : 'rgba(245, 158, 11, 0.12)',
                          color:
                            quote.status === 'converted'
                              ? '#059669'
                              : quote.status === 'sent'
                              ? '#0284C7'
                              : '#D97706',
                          textTransform: 'uppercase',
                        }}
                      >
                        {quote.status}
                      </span>
                    </td>

                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        {/* Print Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Print A4 Quotation"
                          onClick={() => setPrintingQuotation(quote)}
                        >
                          <Print20Regular style={{ color: '#0284C7' }} />
                        </button>

                        {/* Convert to Sale Button */}
                        {quote.status !== 'converted' && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            title="Convert to Sale Bill"
                            onClick={() => {
                              if (confirm(`Convert ${quote.quoteNumber} directly into a confirmed POS Sale?`)) {
                                convertToOrderMutation.mutate(quote.id);
                              }
                            }}
                          >
                            <CheckmarkCircle20Regular style={{ color: '#10B981' }} />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Edit Quotation"
                          onClick={() => openEditModal(quote)}
                        >
                          <Edit20Regular style={{ color: tokens.colorNeutralForeground3 }} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${quote.quoteNumber}?`)) {
                              deleteQuotationMutation.mutate(quote.id);
                            }
                          }}
                        >
                          <Delete20Regular style={{ color: '#EF4444' }} />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(229, 25, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E51937',
                }}
              >
                <DocumentBulletList24Regular />
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                  {editingQuotation ? `Edit Quotation (${editingQuotation.quoteNumber})` : 'Create New Price Estimate'}
                </div>
                <div style={{ fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
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
          <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 800, fontSize: '13.5px', color: tokens.colorNeutralForeground1 }}>
                Quotation Line Items ({lines.length})
              </div>
              <Button size="small" appearance="subtle" onClick={addCustomLine} style={{ color: '#E51937', fontWeight: 700 }}>
                + Add Custom Service / Job
              </Button>
            </div>

            {/* Rapid Search from Catalog */}
            <div style={{ marginBottom: '14px' }}>
              <ProductAutocomplete
                placeholder="Search catalog by product name, SKU or barcode to add to quotation..."
                onSelectProduct={addProductToLines}
                filterModule={targetModule === 'fastfood' ? 'fastfood' : 'minimart'}
                onChange={() => {}}
              />
            </div>

            {/* Line Items Table */}
            <div style={{ border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: tokens.colorNeutralBackground3, color: tokens.colorNeutralForeground2 }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', width: '130px' }}>Spec / Unit</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Unit Rate</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px' }}>Line Total</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: tokens.colorNeutralForeground4 }}>
                        Search and select products above, or click "+ Add Custom Service" to build quote
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, idx) => (
                      <tr key={`${line.productId}_${idx}`} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                        <td style={{ padding: '6px 12px' }}>
                          <input
                            type="text"
                            value={line.name}
                            onChange={(e) => updateLineName(idx, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              fontSize: '12px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="text"
                            placeholder="e.g. 4ch / PCS"
                            value={line.variantLabel || ''}
                            onChange={(e) => updateLineVariant(idx, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              fontSize: '12px',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 1)}
                            style={{
                              width: '60px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              textAlign: 'center',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => updateLinePrice(idx, parseFloat(e.target.value) || 0)}
                            style={{
                              width: '100px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              textAlign: 'right',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800, color: '#E51937' }}>
                          {formatPKR(line.quantity * line.unitPrice)}
                        </td>
                        <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
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
          <div
            style={{
              backgroundColor: tokens.colorNeutralBackground2,
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px',
              marginBottom: '18px',
            }}
          >
            {/* Notes & Terms input */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Client Note (e.g. Includes 1-year CCTV onsite service warranty)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  fontSize: '11.5px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="text"
                placeholder="Payment terms & conditions..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  fontSize: '11.5px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Calculations Box */}
            <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: tokens.colorNeutralForeground3 }}>Subtotal:</span>
                <span style={{ fontWeight: 700 }}>{formatPKR(subtotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: tokens.colorNeutralForeground3 }}>Discount %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  style={{
                    width: '60px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  borderTop: `1.5px solid ${tokens.colorNeutralStroke2}`,
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#E51937',
                }}
              >
                <span>GRAND TOTAL:</span>
                <span>{formatPKR(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
              style={{ backgroundColor: '#E51937', color: '#FFFFFF', fontWeight: 700 }}
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
