import React, { useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import {
  Button,
  Badge,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  mergeClasses,
} from '@fluentui/react-components';
import {
  ArrowLeft20Regular,
  Edit20Regular,
  Delete20Regular,
  BarcodeScanner20Regular,
  Money20Regular,
  Box20Regular,
  Tag20Regular,
  ArrowTrending20Regular,
  Food24Regular,
  BuildingShop24Regular,
  Timer20Regular,
  Save20Regular,
  ShoppingBag20Regular,
  Calendar20Regular,
  Receipt20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { offlineDb } from '@/lib/offlineDb';
import { Product, ProductVariant } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { useAppToast } from '../../context/AppNotificationContext';
import { useProductDetailsStyles } from './productDetails.styles';

export function ProductDetailsView(): React.JSX.Element {
  const styles = useProductDetailsStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useAppToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 1. Fetch all products to find target or allow fallback
  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        return await posApi.fetchProducts();
      } catch {
        return await offlineDb.products.toArray();
      }
    },
  });

  // 2. Fetch orders to calculate product sales analytics
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        return await posApi.fetchOrders();
      } catch {
        return await offlineDb.orders.toArray();
      }
    },
  });

  const productId = params.id || (products.length > 0 ? products[0].id : '');
  const product: Product | null = products.find((p: Product) => p.id === productId) || null;

  const fromState = (location.state as any)?.from as string | undefined;
  const searchParams = new URLSearchParams(location.search);
  const returnUrlParam = searchParams.get('returnUrl');

  const handleBack = () => {
    if (fromState) {
      navigate(fromState);
    } else if (returnUrlParam) {
      navigate(returnUrlParam);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else if (product?.module === 'fastfood') {
      navigate('/catalog/fastfood');
    } else if (product?.module === 'minimart') {
      navigate('/catalog/omnimart');
    } else {
      navigate('/catalog');
    }
  };

  const backLabel = React.useMemo(() => {
    const target = fromState || returnUrlParam;
    if (target) {
      if (target.includes('/catalog/fastfood')) return 'Back to Fast Food Menu';
      if (target.includes('/catalog/omnimart')) return 'Back to Mart Items';
      if (target.includes('/inventory')) return 'Back to Inventory';
      if (target.includes('/catalog')) return 'Back to Catalog';
    }
    if (product?.module === 'fastfood') return 'Back to Fast Food Menu';
    if (product?.module === 'minimart') return 'Back to Mart Items';
    return 'Back';
  }, [fromState, returnUrlParam, product]);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editCategory, setEditCategory] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPrimaryUnit, setEditPrimaryUnit] = useState('');
  const [editSecondaryUnit, setEditSecondaryUnit] = useState('');
  const [editConversionRate, setEditConversionRate] = useState<number | ''>('');
  const [editSecondaryPrice, setEditSecondaryPrice] = useState<number | ''>('');
  const [editTrackBatchExpiry, setEditTrackBatchExpiry] = useState(false);
  const [editBatchNumber, setEditBatchNumber] = useState('');
  const [editMfgDate, setEditMfgDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');

  const openEditModal = () => {
    if (!product) return;
    setEditName(product.name);
    setEditPrice(product.price);
    setEditCostPrice(product.costPrice || 0);
    setEditStock(product.openingStock ?? 0);
    setEditCategory(product.category || '');
    setEditSku(product.skuCode || '');
    setEditUnit(product.unit || 'PCS');
    setEditPrimaryUnit(product.primaryUnit || '');
    setEditSecondaryUnit(product.secondaryUnit || '');
    setEditConversionRate(product.conversionRate ?? '');
    setEditSecondaryPrice(product.secondaryPrice ?? '');
    setEditTrackBatchExpiry(product.trackBatchExpiry ?? false);
    setEditBatchNumber(product.batchNumber || '');
    setEditMfgDate(product.mfgDate || '');
    setEditExpiryDate(product.expiryDate || '');
    setIsEditDialogOpen(true);
  };

  // Mutation: Save Edited Product
  const { mutate: handleSaveEdit, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!product) return;
      const updated: Product = {
        ...product,
        name: editName.trim() || product.name,
        price: Number(editPrice) || 0,
        costPrice: Number(editCostPrice) || 0,
        openingStock: Number(editStock) || 0,
        category: editCategory.trim() || product.category,
        skuCode: editSku.trim() || product.skuCode,
        unit: editUnit || product.unit || 'PCS',
        primaryUnit: editPrimaryUnit.trim() || undefined,
        secondaryUnit: editSecondaryUnit.trim() || undefined,
        conversionRate: editConversionRate !== '' ? Number(editConversionRate) : undefined,
        secondaryPrice: editSecondaryPrice !== '' ? Number(editSecondaryPrice) : undefined,
        trackBatchExpiry: editTrackBatchExpiry,
        batchNumber: editBatchNumber.trim() || undefined,
        mfgDate: editMfgDate || undefined,
        expiryDate: editExpiryDate || undefined,
        updatedAt: new Date().toISOString(),
      };
      await posApi.saveProduct(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditDialogOpen(false);
      notifySuccess('Product updated successfully!');
    },
    onError: (err: any) => {
      notifyError(err?.message || 'Failed to update product');
    },
  });

  // Mutation: Delete Product
  const { mutate: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!product) return;
      await posApi.deleteProduct(product.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDeleteDialogOpen(false);
      notifySuccess('Product deleted successfully');
      handleBack();
    },
    onError: (err: any) => {
      notifyError(err?.message || 'Failed to delete product');
    },
  });

  // Sales Analytics for this product
  const salesStats = React.useMemo(() => {
    if (!product) return { unitsSold: 0, totalRevenue: 0, recentOrders: [] };
    let unitsSold = 0;
    let totalRevenue = 0;
    const recentOrders: Array<{ id: string; date: string; qty: number; total: number; orderType?: string }> = [];

    orders.forEach((o: any) => {
      const matchLines = (o.lines || []).filter(
        (l: any) => l.productId === product.id || l.name?.toLowerCase() === product.name.toLowerCase()
      );
      if (matchLines.length > 0) {
        const lineQty = matchLines.reduce((s: number, l: any) => s + (l.quantity || 1), 0);
        const lineRev = matchLines.reduce((s: number, l: any) => s + (l.unitPrice || 0) * (l.quantity || 1), 0);
        unitsSold += lineQty;
        totalRevenue += lineRev;
        recentOrders.push({
          id: o.id,
          date: o.createdAt,
          qty: lineQty,
          total: lineRev,
          orderType: o.orderType,
        });
      }
    });

    return {
      unitsSold,
      totalRevenue,
      recentOrders: recentOrders.slice(-5).reverse(),
    };
  }, [orders, product]);

  if (isProductsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.topBar}>
          <button
            type="button"
            onClick={handleBack}
            className={styles.backButton}
          >
            <ArrowLeft20Regular /> {backLabel}
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <h3>Product Not Found</h3>
          <p>The product you are looking for does not exist or has been removed.</p>
          <Button appearance="primary" onClick={handleBack}>{backLabel}</Button>
        </div>
      </div>
    );
  }

  const cost = product.costPrice || 0;
  const price = product.price || 0;
  const stock = product.openingStock ?? 0;
  const profitMargin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
  const totalStockValueCost = stock * cost;
  const totalStockValueRetail = stock * price;
  const img = product.imageBase64 || product.imageUrl;

  const isLowStock = stock > 0 && stock <= (product.minThreshold || 5);
  const isOutOfStock = stock <= 0;

  return (
    <div className={styles.container}>
      {/* Top Header & Actions Bar */}
      <div className={styles.topBar}>
        <button
          type="button"
          onClick={handleBack}
          className={styles.backButton}
        >
          <ArrowLeft20Regular /> {backLabel}
        </button>

        <div className={styles.actionsGroup}>
          <Button
            appearance="primary"
            icon={<Edit20Regular />}
            onClick={openEditModal}
          >
            Edit Product
          </Button>

          <Button
            appearance="secondary"
            icon={<BarcodeScanner20Regular />}
            onClick={() => navigate(`/catalog/barcode-labels?sku=${product.skuCode || ''}`)}
          >
            Print Barcode Labels
          </Button>

          <Button
            appearance="secondary"
            icon={<Box20Regular />}
            onClick={() => navigate('/inventory/stock-in')}
          >
            Restock
          </Button>

          <Button
            appearance="subtle"
            icon={<Delete20Regular style={{ color: '#EF4444' }} />}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Product Card */}
      <div className={styles.heroCard}>
        {/* Left: Product Image Box */}
        <div className={styles.imageBox}>
          {img ? (
            <img src={img} alt={product.name} className={styles.productImg} />
          ) : (
            <div className={styles.noPhotoBox}>
              {product.module === 'fastfood' ? (
                <Food24Regular style={{ width: 48, height: 48 }} />
              ) : (
                <BuildingShop24Regular style={{ width: 48, height: 48 }} />
              )}
              <span>No image provided</span>
            </div>
          )}
        </div>

        {/* Right: Product Identification Details */}
        <div className={styles.heroInfo}>
          <div className={styles.titleHeader}>
            <div className={styles.badgeRow}>
              <Badge appearance="filled" color="brand">
                {product.module === 'fastfood' ? 'Fast Food Restaurant' : 'Retail Mini Mart'}
              </Badge>
              <Badge appearance="tint" color="informative">
                {product.category || 'General'}
              </Badge>
              <Badge
                appearance="filled"
                color={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
              >
                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock Warning' : 'In Stock'}
              </Badge>
            </div>

            <h1 className={styles.productTitle}>{product.name}</h1>
            {product.description && (
              <p className={styles.productDesc}>{product.description}</p>
            )}
          </div>

          <div className={styles.skuBarcodeRow}>
            <div className={styles.skuPill}>
              <span className={styles.skuLabel}>SKU Barcode</span>
              <span className={styles.skuValue}>{product.skuCode || 'NO-BARCODE'}</span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#CBD5E1' }} />
            <div className={styles.skuPill}>
              <span className={styles.skuLabel}>Base Unit</span>
              <span className={styles.skuValue}>{product.unit || 'PCS'}</span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#CBD5E1' }} />
            <div className={styles.skuPill}>
              <span className={styles.skuLabel}>Product ID</span>
              <span className={styles.skuValue}>{product.id.slice(0, 10)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Financial & Inventory KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Retail Price */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopStripeBlue} />
          <div className={styles.kpiLabel}>
            <Money20Regular /> Retail Selling Price
          </div>
          <div className={styles.kpiValue}>{formatPKR(price)}</div>
          <div className={styles.kpiSubtext}>Customer checkout rate per {product.unit || 'PCS'}</div>
        </div>

        {/* Card 2: Cost Price & Margin */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopStripeGreen} />
          <div className={styles.kpiLabel}>
            <Tag20Regular /> Wholesale Cost &amp; Margin
          </div>
          <div className={styles.kpiValue}>{cost > 0 ? formatPKR(cost) : '—'}</div>
          <div className={styles.kpiSubtext}>
            {cost > 0 ? `${profitMargin}% Gross Profit Margin` : 'Cost price not configured'}
          </div>
        </div>

        {/* Card 3: Stock on Hand */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopStripeAmber} />
          <div className={styles.kpiLabel}>
            <Box20Regular /> Stock on Hand
          </div>
          <div className={styles.kpiValue}>
            {stock} <span style={{ fontSize: '14px', fontWeight: 600 }}>{product.unit || 'PCS'}</span>
          </div>
          <div className={styles.kpiSubtext}>
            Total Value: {formatPKR(totalStockValueRetail)}
          </div>
        </div>

        {/* Card 4: Total Sold Volume */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopStripeRed} />
          <div className={styles.kpiLabel}>
            <ArrowTrending20Regular /> Units Sold &amp; Revenue
          </div>
          <div className={styles.kpiValue}>{salesStats.unitsSold} units</div>
          <div className={styles.kpiSubtext}>
            Lifetime Sales: {formatPKR(salesStats.totalRevenue)}
          </div>
        </div>
      </div>

      {/* Content Columns (Variants / Kitchen vs Recent Orders) */}
      <div className={styles.contentGrid}>
        {/* Left Column: Variants or Specifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Variants Table if applicable */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <Box20Regular /> Product Options &amp; Variants ({product.variants.length})
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Option / Size</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Price Delta</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Final Price</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Stock</th>
                    <th className={styles.th}>Barcode / SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v: ProductVariant) => {
                    const finalVariantPrice = v.price !== undefined ? v.price : price + (v.priceDelta || 0);
                    return (
                      <tr key={v.id}>
                        <td className={styles.td} style={{ fontWeight: 700 }}>
                          {v.label}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right', color: '#64748B' }}>
                          {v.priceDelta > 0 ? `+${formatPKR(v.priceDelta)}` : 'Base'}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right', fontWeight: 700, color: '#E51937' }}>
                          {formatPKR(finalVariantPrice)}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          {v.stock !== undefined ? `${v.stock} units` : '—'}
                        </td>
                        <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                          {v.skuCode || product.skuCode || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Kitchen / Restaurant Attributes */}
          {product.module === 'fastfood' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <Food24Regular style={{ width: 18, height: 18 }} /> Kitchen &amp; Restaurant Operations
              </div>

              <div className={styles.kitchenInfoGrid}>
                <div className={styles.kitchenInfoBox}>
                  <span className={styles.kitchenLabel}>Preparation Time</span>
                  <span className={styles.kitchenValue}>
                    <Timer20Regular style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {product.prepTime ? `${product.prepTime} Minutes` : 'Standard (10m)'}
                  </span>
                </div>

                <div className={styles.kitchenInfoBox}>
                  <span className={styles.kitchenLabel}>Kitchen Screen (KDS)</span>
                  <span className={styles.kitchenValue}>
                    {product.isAvailable !== false ? 'Active & Dispatched' : 'Hidden from KDS'}
                  </span>
                </div>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px' }}>
                    MENU TAGS
                  </span>
                  <div className={styles.tagList}>
                    {product.tags.map((t: string) => (
                      <span key={t} className={styles.tagItem}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.allergens && product.allergens.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', display: 'block', marginBottom: '6px' }}>
                    ALLERGEN WARNINGS
                  </span>
                  <div className={styles.tagList}>
                    {product.allergens.map((a: string) => (
                      <span key={a} className={styles.tagItem} style={{ color: '#DC2626', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dual Units / Wholesale Packaging Card */}
          {(product.primaryUnit || product.conversionRate) && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <Box20Regular style={{ width: 18, height: 18, color: '#0078D4' }} /> Wholesale Packaging &amp; Dual Unit Conversion
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '8px' }}>
                <div style={{ backgroundColor: '#F8F9FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EDEBE9' }}>
                  <span style={{ fontSize: '11px', color: '#605E5C', fontWeight: 600, display: 'block' }}>WHOLESALE UNIT</span>
                  <strong style={{ fontSize: '15px', color: '#0078D4' }}>{product.primaryUnit || 'BOX'}</strong>
                </div>
                <div style={{ backgroundColor: '#F8F9FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EDEBE9' }}>
                  <span style={{ fontSize: '11px', color: '#605E5C', fontWeight: 600, display: 'block' }}>RETAIL UNIT</span>
                  <strong style={{ fontSize: '15px', color: '#107C41' }}>{product.secondaryUnit || product.unit || 'PCS'}</strong>
                </div>
                <div style={{ backgroundColor: '#F8F9FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EDEBE9' }}>
                  <span style={{ fontSize: '11px', color: '#605E5C', fontWeight: 600, display: 'block' }}>CONVERSION RATIO</span>
                  <strong style={{ fontSize: '15px' }}>1 {product.primaryUnit || 'BOX'} = {product.conversionRate || 1} {product.secondaryUnit || 'PCS'}</strong>
                </div>
                {product.secondaryPrice !== undefined && (
                  <div style={{ backgroundColor: '#F8F9FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EDEBE9' }}>
                    <span style={{ fontSize: '11px', color: '#605E5C', fontWeight: 600, display: 'block' }}>RETAIL PIECE PRICE</span>
                    <strong style={{ fontSize: '15px', color: '#D13438' }}>{formatPKR(product.secondaryPrice)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Number & Expiry Tracking Card */}
          {(product.trackBatchExpiry || product.batchNumber || product.expiryDate) && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar20Regular style={{ width: 18, height: 18, color: '#D97706' }} /> Batch &amp; Expiry Information
                </div>
                {product.expiryDate && (() => {
                  const diff = Math.ceil((new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (diff < 0) return <Badge appearance="filled" color="danger">EXPIRED ({Math.abs(diff)} days ago)</Badge>;
                  if (diff <= 30) return <Badge appearance="filled" color="warning">EXPIRING SOON ({diff} days left)</Badge>;
                  return <Badge appearance="tint" color="success">ACTIVE ({diff} days left)</Badge>;
                })()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '8px' }}>
                <div style={{ backgroundColor: '#FDFCF7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F2E8A2' }}>
                  <span style={{ fontSize: '11px', color: '#605E5C', fontWeight: 600, display: 'block' }}>BATCH / LOT #</span>
                  <strong style={{ fontSize: '14px', fontFamily: 'monospace' }}>{product.batchNumber || '—'}</strong>
                </div>
                <div style={{ backgroundColor: '#FDFCF7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F2E8A2' }}>
                  <span style={{ fontSize: '11px', color: '#605E5C', fontWeight: 600, display: 'block' }}>MFG DATE</span>
                  <strong style={{ fontSize: '14px' }}>{product.mfgDate ? new Date(product.mfgDate).toLocaleDateString() : '—'}</strong>
                </div>
                <div style={{ backgroundColor: '#FDFCF7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F2E8A2' }}>
                  <span style={{ fontSize: '11px', color: '#605E5C', fontWeight: 600, display: 'block' }}>EXPIRY DATE</span>
                  <strong style={{ fontSize: '14px', color: '#D97706' }}>{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '—'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Sales Activity */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            <ShoppingBag20Regular /> Recent Sales Orders
          </div>

          {salesStats.recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8', fontSize: '13px' }}>
              No recorded orders for this item yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {salesStats.recentOrders.map((ord, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      Order #{ord.id.slice(-6).toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {new Date(ord.date).toLocaleDateString()} • {ord.orderType || 'Takeaway'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>
                      {formatPKR(ord.total)}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                      {ord.qty} {product.unit || 'units'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={(_, data) => setIsEditDialogOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '480px', width: '90%' }}>
          <DialogTitle>Quick Edit: {product.name}</DialogTitle>
          <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <CustomInput
              label="Product Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Product Name"
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <CustomInput
                label="Retail Price (PKR)"
                type="number"
                value={String(editPrice)}
                onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
              />
              <CustomInput
                label="Cost Price (PKR)"
                type="number"
                value={String(editCostPrice)}
                onChange={(e) => setEditCostPrice(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <CustomInput
                label="Current Stock"
                type="number"
                value={String(editStock)}
                onChange={(e) => setEditStock(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <CustomInput
                label="Unit (e.g. PCS, KG)"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                placeholder="PCS"
              />
            </div>
            <CustomInput
              label="SKU / Barcode"
              value={editSku}
              onChange={(e) => setEditSku(e.target.value)}
              placeholder="Barcode"
            />
            <CustomInput
              label="Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              placeholder="Category"
            />

            {/* Dual Units Edit Fields */}
            <div style={{ borderTop: '1px solid #E1DFDD', paddingTop: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0078D4', display: 'block', marginBottom: '6px' }}>
                Dual Units (Wholesale / Retail)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <CustomInput
                  label="Wholesale Unit (e.g. BOX)"
                  value={editPrimaryUnit}
                  onChange={(e) => setEditPrimaryUnit(e.target.value)}
                  placeholder="BOX"
                />
                <CustomInput
                  label="Retail Unit (e.g. PCS)"
                  value={editSecondaryUnit}
                  onChange={(e) => setEditSecondaryUnit(e.target.value)}
                  placeholder="PCS"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <CustomInput
                  label="Conversion Rate (1 Box = X Pcs)"
                  type="number"
                  value={editConversionRate !== '' ? String(editConversionRate) : ''}
                  onChange={(e) => setEditConversionRate(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="12"
                />
                <CustomInput
                  label="Retail Piece Price (PKR)"
                  type="number"
                  value={editSecondaryPrice !== '' ? String(editSecondaryPrice) : ''}
                  onChange={(e) => setEditSecondaryPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50"
                />
              </div>
            </div>

            {/* Batch & Expiry Edit Fields */}
            <div style={{ borderTop: '1px solid #E1DFDD', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#D97706' }}>
                  Batch &amp; Expiry Tracking
                </span>
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editTrackBatchExpiry}
                    onChange={(e) => setEditTrackBatchExpiry(e.target.checked)}
                  />
                  Enable
                </label>
              </div>
              {editTrackBatchExpiry && (
                <>
                  <CustomInput
                    label="Batch / Lot Number"
                    value={editBatchNumber}
                    onChange={(e) => setEditBatchNumber(e.target.value)}
                    placeholder="BATCH-2026"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                    <CustomInput
                      label="MFG Date"
                      type="date"
                      value={editMfgDate}
                      onChange={(e) => setEditMfgDate(e.target.value)}
                    />
                    <CustomInput
                      label="Expiry Date"
                      type="date"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </DialogBody>
          <DialogActions style={{ marginTop: '16px' }}>
            <Button appearance="secondary" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              icon={<Save20Regular />}
              onClick={() => handleSaveEdit()}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(_, data) => setIsDeleteDialogOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '400px' }}>
          <DialogTitle>Delete Product?</DialogTitle>
          <DialogBody>
            Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
          </DialogBody>
          <DialogActions style={{ marginTop: '16px' }}>
            <Button appearance="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              style={{ backgroundColor: '#EF4444', color: '#FFF' }}
              onClick={() => handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
