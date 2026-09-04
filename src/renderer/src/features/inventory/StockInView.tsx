import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
  Badge,
  Button,
    Select,
      Checkbox,
  Tooltip,
  Label,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Search20Regular,
  Delete20Regular,
  Edit20Regular,
  Print20Regular,
  Dismiss20Regular,
  Receipt20Regular,
  Checkmark20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl, posApi } from '@/lib/api';
import { StockMovement, Product } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { vendorStorage } from './vendorStorage';
import { CustomInput, CustomSelect } from '@/components/ui';

const stockInSchema = z.object({
  selectedProductId: z.string().optional(),
  productName: z.string().min(1, 'Please select or enter an item name'),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Qty must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.coerce.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional(),
});

type StockInFormData = z.infer<typeof stockInSchema>;

const editSchema = z.object({
  id: z.string(),
  productName: z.string().min(1, 'Product name is required'),
  vendorName: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Qty must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  note: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  card: {
    padding: '20px 24px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
    letterSpacing: '-0.2px',
  },
  row1: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  productDetailCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  productDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  productDetailLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productThumb: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productDetailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  detailStatBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailStatLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.4px',
  },
  detailStatVal: {
    fontSize: '14px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1.6fr',
    gap: '14px',
    alignItems: 'flex-end',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '6px',
    display: 'block',
  },
  lineTotalBox: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'rgba(16, 124, 65, 0.12)',
    border: '1.5px solid rgba(16, 124, 65, 0.35)',
    boxSizing: 'border-box',
  },
  lineTotalValue: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#107C41',
  },
  saveBtn: {
    height: '36px',
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 700,
    fontSize: '13px',
    border: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.35)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '12px',
  },
  th: {
    padding: '12px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground1,
    fontSize: '12.5px',
    verticalAlign: 'middle',
  },
  tableRow: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },

  /* Right-Side Slide-Over Drawer */
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(3px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawerPanel: {
    width: '460px',
    maxWidth: '92vw',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow64,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    animationName: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
    animationDuration: '0.2s',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  drawerHeader: {
    padding: '20px 24px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  drawerBody: {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  drawerFooter: {
    padding: '16px 24px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    backgroundColor: tokens.colorNeutralBackground3,
  },

  /* Print Voucher Slip */
  voucherSlip: {
    padding: '24px',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderRadius: '8px',
    fontFamily: 'monospace',
  },
});

export function StockInView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Right Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingMovement, setPrintingMovement] = useState<StockMovement | null>(null);

  const vendors = vendorStorage.getVendors();
  const location = useLocation();

  // Fetch Stock Movements
  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/stock-movements`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Products for Live Stock Inspection
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    staleTime: 60000,
  });

  // Top Card Create Form
  const form = useForm<StockInFormData>({
    resolver: zodResolver(stockInSchema) as any,
    defaultValues: {
      selectedProductId: '',
      productName: '',
      vendorId: '',
      vendorName: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
    },
  });

  // Prefill from Navigation State (e.g. from Dashboard or Vendors)
  useEffect(() => {
    const s = location.state as any;
    if (s?.productName) {
      form.setValue('productName', s.productName);
      if (s.productId) form.setValue('selectedProductId', s.productId);
      if (s.costPrice) form.setValue('unitPrice', s.costPrice);
    }
    if (s?.vendorName) {
      form.setValue('vendorName', s.vendorName);
      if (s.vendorId) form.setValue('vendorId', s.vendorId);
    }
  }, [location.state]);

  // Right Drawer Edit Form
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      id: '',
      productName: '',
      vendorName: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      note: '',
    },
  });

  const watchedQty = form.watch('quantity') || 0;
  const watchedPrice = form.watch('unitPrice') || 0;
  const watchedDiscountPercent = form.watch('discountPercent') || 0;
  const watchedProductId = form.watch('selectedProductId');
  const watchedProductName = form.watch('productName');

  const selectedProduct = React.useMemo(() => {
    if (watchedProductId) {
      const byId = allProducts.find((p) => p.id === watchedProductId);
      if (byId) return byId;
    }
    if (watchedProductName?.trim()) {
      const q = watchedProductName.trim().toLowerCase();
      return (
        allProducts.find(
          (p) =>
            p.name.toLowerCase() === q ||
            (p.skuCode && p.skuCode.toLowerCase() === q)
        ) || null
      );
    }
    return null;
  }, [watchedProductId, watchedProductName, allProducts]);

  const subTotal = watchedQty * watchedPrice;
  const discountAmount = Math.round((subTotal * watchedDiscountPercent) / 100);
  const lineTotal = Math.max(0, subTotal - discountAmount);

  // Edit Drawer calculated line total
  const editWatchedQty = editForm.watch('quantity') || 0;
  const editWatchedPrice = editForm.watch('unitPrice') || 0;
  const editWatchedDiscount = editForm.watch('discountPercent') || 0;
  const editSubTotal = editWatchedQty * editWatchedPrice;
  const editDiscountAmount = Math.round((editSubTotal * editWatchedDiscount) / 100);
  const editLineTotal = Math.max(0, editSubTotal - editDiscountAmount);

  // Mutation to Save Stock In Invoice
  const saveMutation = useMutation({
    mutationFn: async (data: StockInFormData) => {
      const base = await resolveApiUrl();
      const unitCost = data.unitPrice;
      const sub = data.quantity * unitCost;
      const discAmt = Math.round((sub * (data.discountPercent || 0)) / 100);
      const calcTotal = Math.max(0, sub - discAmt);

      const noteDetails = [
        data.vendorName ? `Vendor: ${data.vendorName}` : null,
        data.discountPercent && data.discountPercent > 0 ? `Discount: ${data.discountPercent}% (-PKR ${discAmt.toLocaleString()})` : null,
        `Line Total: PKR ${calcTotal.toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(' • ');

      await fetch(`${base}/api/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'minimart',
          type: 'in',
          productId: data.selectedProductId || uid('prod_'),
          productName: data.productName,
          quantity: data.quantity,
          unitCost: unitCost,
          unitPrice: null,
          reason: data.vendorName || 'Supplier Purchase',
          note: noteDetails,
        }),
      });

      // Update Vendor Payable Balance in real-time
      if (data.vendorName) {
        const vName = data.vendorName.trim().toLowerCase();
        const allVendors = vendorStorage.getVendors();
        const matched = allVendors.find(
          (v) =>
            (v.companyName || v.name).trim().toLowerCase() === vName ||
            (data.vendorId && v.id === data.vendorId)
        );
        if (matched) {
          vendorStorage.saveVendor({
            ...matched,
            openingBalance: (matched.openingBalance || 0) + calcTotal,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      form.reset({
        selectedProductId: '',
        productName: '',
        vendorId: '',
        vendorName: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
      });
    },
  });

  // Mutation to Update via Right Drawer
  const updateMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const base = await resolveApiUrl();
      const sub = data.quantity * data.unitPrice;
      const discAmt = Math.round((sub * (data.discountPercent || 0)) / 100);
      const calcTotal = Math.max(0, sub - discAmt);

      const noteDetails = [
        data.vendorName ? `Vendor: ${data.vendorName}` : null,
        data.discountPercent && data.discountPercent > 0 ? `Discount: ${data.discountPercent}% (-PKR ${discAmt.toLocaleString()})` : null,
        `Line Total: PKR ${calcTotal.toLocaleString()}`,
        data.note ? data.note : null,
      ]
        .filter(Boolean)
        .join(' • ');

      await fetch(`${base}/api/stock-movements/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: data.productName,
          quantity: data.quantity,
          unitCost: data.unitPrice,
          reason: data.vendorName || 'Supplier Purchase',
          note: noteDetails,
        }),
      });

      // Update Vendor Payable Balance difference
      if (data.vendorName) {
        const vName = data.vendorName.trim().toLowerCase();
        const prev = editingMovement;
        const allVendors = vendorStorage.getVendors();
        const matched = allVendors.find(
          (v) => (v.companyName || v.name).trim().toLowerCase() === vName
        );
        if (matched) {
          const prevCost = prev ? (prev.quantity || 0) * (prev.unitCost || 0) : 0;
          const diff = calcTotal - prevCost;
          vendorStorage.saveVendor({
            ...matched,
            openingBalance: Math.max(0, (matched.openingBalance || 0) + diff),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      setIsDrawerOpen(false);
      setEditingMovement(null);
    },
  });

  // Mutation to Delete Stock In Entry
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const target = movements.find((m) => m.id === id);
      const base = await resolveApiUrl();
      await fetch(`${base}/api/stock-movements/${id}`, {
        method: 'DELETE',
      });

      // Revert vendor payable balance if linked
      if (target && target.reason && target.reason !== 'Supplier Purchase') {
        const allVendors = vendorStorage.getVendors();
        const matched = allVendors.find(
          (v) => (v.companyName || v.name).trim().toLowerCase() === target.reason?.trim().toLowerCase()
        );
        if (matched) {
          const lineCost = (target.quantity || 0) * (target.unitCost || 0);
          vendorStorage.saveVendor({
            ...matched,
            openingBalance: Math.max(0, (matched.openingBalance || 0) - lineCost),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      setSelectedIds([]);
    },
  });

  const onSave = (data: StockInFormData) => {
    saveMutation.mutate(data);
  };

  const onUpdate = (data: EditFormData) => {
    updateMutation.mutate(data);
  };

  // Open Edit Drawer
  const handleOpenEdit = (mov: StockMovement) => {
    setEditingMovement(mov);
    // Parse discount percent from note if present
    let parsedDiscount = 0;
    if (mov.note) {
      const match = mov.note.match(/Discount:\s*(\d+)%/i);
      if (match && match[1]) parsedDiscount = Number(match[1]);
    }

    editForm.reset({
      id: mov.id,
      productName: mov.productName,
      vendorName: mov.reason || '',
      quantity: mov.quantity,
      unitPrice: mov.unitCost || 0,
      discountPercent: parsedDiscount,
      note: mov.note || '',
    });
    setIsDrawerOpen(true);
  };

  // Open Print Modal
  const handleOpenPrint = (mov: StockMovement) => {
    setPrintingMovement(mov);
    setIsPrintModalOpen(true);
  };

  // Current Vendor & Invoice calculations for printing
  const currentPrintVendor = printingMovement
    ? vendors.find(
        (v) =>
          v.name.toLowerCase() === (printingMovement.reason || '').toLowerCase() ||
          v.companyName?.toLowerCase() === (printingMovement.reason || '').toLowerCase()
      )
    : undefined;

  const printUnitCost = printingMovement?.unitCost || 0;
  const printQty = printingMovement?.quantity || 0;
  const printGrossTotal = printUnitCost * printQty;
  const printDiscountPercent = printingMovement?.note?.includes('%')
    ? parseFloat(printingMovement.note.match(/(\d+(\.\d+)?)%/)?.[1] || '0')
    : 0;
  const printDiscountAmount = (printGrossTotal * printDiscountPercent) / 100;
  const printNetTotal = printGrossTotal - printDiscountAmount;
  const printVendorBalance = currentPrintVendor?.openingBalance || printNetTotal;
  const printPrevBalance = Math.max(0, printVendorBalance - printNetTotal);
  const printDocNo = printingMovement
    ? `PINV-${new Date(printingMovement.date).toISOString().slice(0, 10).replace(/-/g, '')}-${printingMovement.id.slice(-6).toUpperCase()}`
    : '';
  const printDate = printingMovement
    ? new Date(printingMovement.date).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const printTime = printingMovement
    ? new Date(printingMovement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handlePrint = () => {
    if (!printingMovement) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Purchase Receiving Invoice - ${printDocNo}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 14mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            padding: 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .inv-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #E51937;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .brand-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-badge {
            width: 40px;
            height: 40px;
            background: #E51937;
            color: #ffffff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 18px;
            letter-spacing: -0.5px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #111827;
            letter-spacing: -0.02em;
            line-height: 1.1;
          }
          .brand-sub {
            font-size: 10.5px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
            margin-top: 2px;
          }
          .inv-meta {
            text-align: right;
          }
          .inv-meta h2 {
            font-size: 17px;
            font-weight: 800;
            color: #E51937;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .inv-meta p {
            font-size: 11px;
            color: #475569;
            margin-top: 3px;
          }
          .parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
          }
          .party-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            background: #f8fafc;
          }
          .party-card .party-role {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #E51937;
            margin-bottom: 6px;
          }
          .party-card .party-name {
            font-size: 14.5px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .party-card .party-detail {
            font-size: 11px;
            color: #475569;
            line-height: 1.4;
          }
          .vendor-bal-badge {
            margin-top: 8px;
            display: inline-block;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 5px;
            padding: 4px 10px;
            font-size: 11px;
            color: #991b1b;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #94a3b8;
            padding: 8px 12px;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #334155;
            letter-spacing: 0.4px;
          }
          td {
            padding: 9px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11.5px;
            color: #1e293b;
          }
          .calc-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .calc-box {
            width: 320px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
            padding: 12px 16px;
          }
          .calc-line {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            color: #475569;
            margin-bottom: 6px;
          }
          .calc-line.total {
            border-top: 1.5px solid #0f172a;
            border-bottom: 1.5px solid #0f172a;
            padding: 6px 0;
            margin: 6px 0;
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
          }
          .calc-line.vendor-net {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 6px 8px;
            margin-top: 8px;
            font-size: 12px;
            font-weight: 800;
            color: #991b1b;
          }
          .footer-sign {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 30px;
            padding-top: 14px;
            border-top: 1px dashed #cbd5e1;
            page-break-inside: avoid;
          }
          .sign-block {
            text-align: center;
            width: 170px;
          }
          .sign-line {
            border-top: 1px solid #475569;
            margin-bottom: 4px;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
          }
          .disclaimer {
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="inv-header">
          <div class="brand-wrap">
            <div class="logo-badge">OP</div>
            <div>
              <div class="brand-title">OmniPos</div>
              <div class="brand-sub">Enterprise POS &amp; Inventory Receiving</div>
            </div>
          </div>
          <div class="inv-meta">
            <h2>PURCHASE RECEIVING INVOICE</h2>
            <p><strong>Invoice No:</strong> ${printDocNo}</p>
            <p><strong>Date &amp; Time:</strong> ${printDate} ${printTime}</p>
          </div>
        </div>

        <!-- Parties Grid -->
        <div class="parties-grid">
          <!-- Vendor / Supplier Details -->
          <div class="party-card">
            <div class="party-role">Supplier / Vendor Details</div>
            <div class="party-name">${currentPrintVendor?.name || printingMovement.reason || 'Vendor / Supplier'}</div>
            <div class="party-detail"><strong>Contact Rep:</strong> ${currentPrintVendor?.contactPerson || 'Authorized Agent'}</div>
            <div class="party-detail"><strong>Phone / Mobile:</strong> ${currentPrintVendor?.phone || 'N/A'}</div>
            <div class="party-detail"><strong>Address:</strong> ${currentPrintVendor?.address || 'Local Wholesale Supply'}</div>
            <div class="vendor-bal-badge">
              Vendor Payable Balance: Rs. ${printVendorBalance.toLocaleString()} PKR
            </div>
          </div>

          <!-- Receiving Store / Warehouse Details -->
          <div class="party-card">
            <div class="party-role">Delivered To / Receiving Facility</div>
            <div class="party-name">OmniPos Central Branch &amp; Store</div>
            <div class="party-detail"><strong>Facility:</strong> Main Inward Logistics Bay #1</div>
            <div class="party-detail"><strong>Received By:</strong> Store Manager (Admin)</div>
            <div class="party-detail"><strong>Account Type:</strong> Commercial Inventory (Trade Credit)</div>
            <div style="margin-top: 8px; font-size: 10.5px; color: #15803d; font-weight: 700;">
              ✓ Goods Verified &amp; Added to System Stock
            </div>
          </div>
        </div>

        <!-- Itemized Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th style="text-align: left;">Item Description / Food Product</th>
              <th style="width: 100px; text-align: right;">Unit Rate (PKR)</th>
              <th style="width: 80px; text-align: center;">Quantity</th>
              <th style="width: 80px; text-align: right;">Discount</th>
              <th style="width: 110px; text-align: right;">Line Total (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; color: #64748b;">1</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${printingMovement.productName}</div>
                ${printingMovement.note ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">Note: ${printingMovement.note}</div>` : ''}
              </td>
              <td style="text-align: right; font-weight: 600;">${formatPKR(printUnitCost)}</td>
              <td style="text-align: center; font-weight: 800; color: #15803d;">+${printQty} units</td>
              <td style="text-align: right; color: #64748b;">${printDiscountPercent > 0 ? `${printDiscountPercent}%` : '—'}</td>
              <td style="text-align: right; font-weight: 800; color: #0f172a;">${formatPKR(printNetTotal)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Calculation & Vendor Balance Reconciliation Box -->
        <div class="calc-row">
          <div class="calc-box">
            <div class="calc-line">
              <span>Gross Total:</span>
              <span style="font-weight: 600;">${formatPKR(printGrossTotal)}</span>
            </div>
            ${printDiscountAmount > 0 ? `
              <div class="calc-line">
                <span>Discount (${printDiscountPercent}%):</span>
                <span style="color: #15803d;">- ${formatPKR(printDiscountAmount)}</span>
              </div>
            ` : ''}
            <div class="calc-line total">
              <span>This Invoice Total:</span>
              <span style="color: #E51937;">${formatPKR(printNetTotal)}</span>
            </div>
            <div class="calc-line" style="margin-top: 6px;">
              <span>Previous Vendor Balance:</span>
              <span>${formatPKR(printPrevBalance)}</span>
            </div>
            <div class="calc-line">
              <span>This Bill Added:</span>
              <span style="color: #15803d;">+ ${formatPKR(printNetTotal)}</span>
            </div>
            <div class="calc-line vendor-net">
              <span>Total Balance Due:</span>
              <span>${formatPKR(printVendorBalance)}</span>
            </div>
          </div>
        </div>

        <!-- Formal Signatures -->
        <div class="footer-sign">
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Vendor / Delivery Person</div>
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Received By (Store Incharge)</div>
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Authorized Store Seal</div>
          </div>
        </div>

        <div class="disclaimer">
          OmniPos Enterprise Cloud &amp; Local Node Sync · Computer-generated Purchase Receiving Invoice · Valid for Accounts Settlement
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    // Dedicated invisible iframe
    let printFrame = document.getElementById('stock-in-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'stock-in-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
    } else {
      const printWindow = window.open('', '_blank', 'width=950,height=800');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this stock in shipment record?')) {
      deleteMutation.mutate(id);
    }
  };

  // Only Inflow Movements
  const stockInMovements = movements.filter((m) => m.type === 'in');

  // Filtered List
  const filteredMovements = stockInMovements.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.productName.toLowerCase().includes(q) ||
      (m.reason && m.reason.toLowerCase().includes(q)) ||
      (m.note && m.note.toLowerCase().includes(q))
    );
  });

  const isAllSelected = filteredMovements.length > 0 && selectedIds.length === filteredMovements.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMovements.map((m) => m.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  if (isLoading && movements.length === 0) {
    return <TablePageSkeleton title="Stock In" hasMetrics={false} />;
  }

  return (
    <div className={styles.container}>
      {/* ── CARD 1: Record Stock In (Receiving Invoice) ── */}
      <div className={styles.card}>
        <span className={styles.cardTitle}>Record Stock In (Receiving Invoice)</span>

        <form onSubmit={form.handleSubmit(onSave)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Row 1: Vendor & Product Select */}
          <div className={styles.row1}>
            <div>
              <Controller
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <CustomSelect
                    label="SELECT VENDOR / SUPPLIER"
                    placeholder="Select Vendor / Supplier"
                    value={field.value || ''}
                    options={[
                      { value: '', label: 'Direct Supplier / Purchase' },
                      ...vendors.map((v) => ({ value: v.name, label: v.name }))
                    ]}
                    onChange={(val) => {
                      field.onChange(val);
                      const matched = vendors.find((v) => v.name === val || v.companyName === val);
                      if (matched) form.setValue('vendorId', matched.id);
                    }}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <ProductAutocomplete
                    id="stockInItemSelect"
                    label="ITEM SELECT"
                    required
                    placeholder="Search by product name, SKU or barcode..."
                    value={field.value || ''}
                    onChange={(name, prod) => {
                      field.onChange(name);
                      if (prod) {
                        form.setValue('selectedProductId', prod.id);
                        if (prod.costPrice !== undefined && prod.costPrice !== null) {
                          form.setValue('unitPrice', prod.costPrice);
                        } else if (prod.price) {
                          form.setValue('unitPrice', prod.price);
                        }
                      } else {
                        form.setValue('selectedProductId', '');
                      }
                    }}
                    error={form.formState.errors.productName?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Selected Product Live Stock & Details Card */}
          {selectedProduct && (
            <div className={styles.productDetailCard}>
              <div className={styles.productDetailHeader}>
                <div className={styles.productDetailLeft}>
                  <div className={styles.productThumb}>
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '20px' }}>📦</span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        {selectedProduct.name}
                      </span>
                      <Badge
                        appearance="filled"
                        color={
                          (selectedProduct.openingStock ?? 0) <= 0
                            ? 'danger'
                            : (selectedProduct.openingStock ?? 0) <= (selectedProduct.minThreshold ?? 10)
                            ? 'warning'
                            : 'success'
                        }
                        size="small"
                      >
                        {(selectedProduct.openingStock ?? 0) <= 0
                          ? 'Out of Stock'
                          : (selectedProduct.openingStock ?? 0) <= (selectedProduct.minThreshold ?? 10)
                          ? 'Low Stock Alert'
                          : 'In Stock'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '11.5px', color: tokens.colorNeutralForeground3, display: 'flex', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span>📁 {selectedProduct.category || 'General'}</span>
                      {selectedProduct.skuCode && (
                        <span>🏷️ SKU: <code style={{ color: tokens.colorNeutralForeground1, fontWeight: 700 }}>{selectedProduct.skuCode}</code></span>
                      )}
                      {selectedProduct.rackLocation && (
                        <span>📍 Rack: {selectedProduct.rackLocation}</span>
                      )}
                      <span>📏 Unit: {selectedProduct.unit || 'PCS'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Dismiss20Regular />}
                    onClick={() => {
                      form.setValue('selectedProductId', '');
                      form.setValue('productName', '');
                    }}
                    title="Clear selected product"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              {/* 4-stat Stock & Valuation Matrix */}
              <div className={styles.productDetailGrid}>
                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Current Inventory</span>
                  <span
                    className={styles.detailStatVal}
                    style={{ color: (selectedProduct.openingStock ?? 0) <= 0 ? '#E51937' : tokens.colorNeutralForeground1 }}
                  >
                    {selectedProduct.openingStock ?? 0} {selectedProduct.unit || 'PCS'}
                  </span>
                </div>

                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Stock In Addition</span>
                  <span className={styles.detailStatVal} style={{ color: '#0F6CBD' }}>
                    +{watchedQty} {selectedProduct.unit || 'PCS'}
                  </span>
                </div>

                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Projected New Stock</span>
                  <span className={styles.detailStatVal} style={{ color: '#107C41' }}>
                    {(selectedProduct.openingStock ?? 0) + (Number(watchedQty) || 0)} {selectedProduct.unit || 'PCS'}
                  </span>
                </div>

                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Cost vs Selling</span>
                  <span className={styles.detailStatVal}>
                    PKR {(watchedPrice || selectedProduct.costPrice || 0).toLocaleString()}{' '}
                    <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, fontWeight: 500 }}>
                      / {selectedProduct.price ? `Sale: PKR ${selectedProduct.price.toLocaleString()}` : ''}
                    </span>
                  </span>
                </div>
              </div>

              {/* Portion Sizes / Variants details if configured */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div style={{ paddingTop: '8px', borderTop: `1px dashed ${tokens.colorNeutralStroke2}` }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: tokens.colorNeutralForeground3,
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      letterSpacing: '0.4px',
                    }}
                  >
                    Configured Portion Sizes / Variants ({selectedProduct.variants.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedProduct.variants.map((v) => (
                      <div
                        key={v.id}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: tokens.colorNeutralBackground1,
                          border: `1px solid ${tokens.colorNeutralStroke1}`,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <strong style={{ color: tokens.colorBrandForeground1 }}>{v.label}</strong>
                        <span style={{ color: tokens.colorNeutralForeground3 }}>
                          Stock: <strong style={{ color: tokens.colorNeutralForeground1 }}>{v.stock ?? 0}</strong>
                        </span>
                        <span style={{ color: tokens.colorNeutralForeground2 }}>
                          Price:{' '}
                          <strong>
                            PKR{' '}
                            {(v.price !== undefined && v.price > 0
                              ? v.price
                              : selectedProduct.price + (v.priceDelta || 0)
                            ).toLocaleString()}
                          </strong>
                        </span>
                        {v.skuCode && (
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '10.5px',
                              color: tokens.colorNeutralForeground3,
                              backgroundColor: tokens.colorNeutralBackground3,
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                          >
                            {v.skuCode}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 2: QTY, Unit Price, Discount (%), Line Total, Save Button */}
          <div className={styles.row2}>
            <div>
              <Controller
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <CustomInput
                    label="QTY *"
                    required
                    type="number"
                    placeholder="1"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    error={form.formState.errors.quantity?.message}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <CustomInput
                    label="UNIT PRICE (PKR)"
                    type="number"
                    placeholder="0"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <CustomInput
                    label="DISCOUNT (%)"
                    type="number"
                    placeholder="0"
                    min={0}
                    max={100}
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    rightElement={<span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, fontWeight: 700, paddingRight: '4px' }}>%</span>}
                  />
                )}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>LINE TOTAL (PKR)</label>
              <div className={styles.lineTotalBox}>
                <span className={styles.lineTotalValue}>Rs. {lineTotal.toLocaleString()}</span>
                {discountAmount > 0 && (
                  <span style={{ fontSize: '11px', color: '#107C41', marginLeft: '6px', fontWeight: 600 }}>
                    (-{discountAmount.toLocaleString()})
                  </span>
                )}
              </div>
            </div>

            <div>
              <Button
                appearance="primary"
                type="submit"
                disabled={saveMutation.isPending}
                className={styles.saveBtn}
                style={{ width: '100%' }}
              >
                <Add20Regular style={{ width: 18, height: 18 }} />
                <span>{saveMutation.isPending ? 'Saving...' : 'Save Stock In Invoice'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── CARD 2: Stock In (Receiving Logs) ── */}
      <div className={styles.card}>
        <span className={styles.cardTitle}>Stock In (Receiving Logs)</span>

        <div className={styles.filterBar}>
          <div style={{ minWidth: '280px', maxWidth: '420px', width: '100%' }}>
            <CustomInput
              label="Search Stock In Logs"
              placeholder="Search by product, reason, note..."
              icon={<Search20Regular />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={searchQuery ? () => setSearchQuery('') : undefined}
            />
          </div>

          <Caption1 style={{ color: tokens.colorNeutralForeground3, fontWeight: 600 }}>
            Total {filteredMovements.length} Stock In Records
          </Caption1>
        </div>

        {/* Table with Checkbox, Item, Qty, Unit Price, Line Total, Vendor, Date, and Actions */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: '36px', textAlign: 'center' }}>
                  <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className={styles.th}>ITEM SELECT</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>QTY</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>UNIT PRICE</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>LINE TOTAL</th>
                <th className={styles.th}>VENDOR / SUPPLIER</th>
                <th className={styles.th}>DATE &amp; TIME</th>
                <th className={styles.th} style={{ textAlign: 'center', minWidth: '100px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No Stock In shipment records found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isChecked = selectedIds.includes(mov.id);
                  const dt = new Date(mov.date);
                  const totalLine = (mov.unitCost || 0) * (mov.quantity || 0);

                  return (
                    <tr key={mov.id} className={styles.tableRow}>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <Checkbox checked={isChecked} onChange={() => toggleSelectRow(mov.id)} />
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>
                          {mov.productName}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <Badge appearance="tint" color="success" style={{ fontWeight: 700 }}>
                          +{mov.quantity}
                        </Badge>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 600 }}>
                        {mov.unitCost !== null && mov.unitCost !== undefined ? formatPKR(mov.unitCost) : '—'}
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 700, color: '#107C41' }}>
                        {totalLine > 0 ? formatPKR(totalLine) : '—'}
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground1 }}>
                          {mov.reason || 'Supplier Purchase'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground2, fontSize: '12px' }}>
                          {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        {/* ── ACTION ICONS: Print, Edit (Right Drawer), Delete ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Tooltip content="Print Receiving Slip" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Print20Regular style={{ color: '#0078D4', width: 16, height: 16 }} />}
                              onClick={() => handleOpenPrint(mov)}
                              style={{
                                width: '30px',
                                height: '30px',
                                minWidth: '30px',
                                padding: 0,
                                borderRadius: '6px',
                                backgroundColor: 'rgba(0, 120, 212, 0.12)',
                                border: '1px solid rgba(0, 120, 212, 0.25)',
                              }}
                            />
                          </Tooltip>

                          <Tooltip content="Edit Invoice (Right Drawer)" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Edit20Regular style={{ color: '#107C41', width: 16, height: 16 }} />}
                              onClick={() => handleOpenEdit(mov)}
                              style={{
                                width: '30px',
                                height: '30px',
                                minWidth: '30px',
                                padding: 0,
                                borderRadius: '6px',
                                backgroundColor: 'rgba(16, 124, 65, 0.12)',
                                border: '1px solid rgba(16, 124, 65, 0.25)',
                              }}
                            />
                          </Tooltip>

                          <Tooltip content="Delete Record" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Delete20Regular style={{ color: '#D13438', width: 16, height: 16 }} />}
                              onClick={() => handleDelete(mov.id)}
                              style={{
                                width: '30px',
                                height: '30px',
                                minWidth: '30px',
                                padding: 0,
                                borderRadius: '6px',
                                backgroundColor: 'rgba(209, 52, 56, 0.12)',
                                border: '1px solid rgba(209, 52, 56, 0.25)',
                              }}
                            />
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER (Edit Stock In) ── */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 124, 65, 0.12)',
                    color: '#107C41',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                  }}
                >
                  <Edit20Regular />
                </span>
                <div>
                  <Subtitle2 style={{ fontWeight: 800, color: tokens.colorNeutralForeground1, display: 'block' }}>
                    Edit Stock In Invoice
                  </Subtitle2>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Record #{editingMovement?.id.slice(-6).toUpperCase()}
                  </Caption1>
                </div>
              </div>

              <Button
                appearance="subtle"
                icon={<Dismiss20Regular />}
                onClick={() => setIsDrawerOpen(false)}
                style={{ minWidth: '28px', width: '28px', height: '28px', padding: 0 }}
              />
            </div>

            {/* Drawer Form Body */}
            <form id="editDrawerForm" onSubmit={editForm.handleSubmit(onUpdate)} className={styles.drawerBody}>
              {/* Product Name */}
              <div>
                <Controller
                  control={editForm.control}
                  name="productName"
                  render={({ field }) => (
                    <CustomInput
                      label="Item / Product Name"
                      required
                      placeholder="Product name"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Vendor / Supplier */}
              <div>
                <Controller
                  control={editForm.control}
                  name="vendorName"
                  render={({ field }) => (
                    <CustomSelect
                      label="Vendor / Supplier"
                      value={field.value || ''}
                      placeholder="Direct Supplier / Purchase"
                      options={[
                        { value: '', label: 'Direct Supplier / Purchase' },
                        ...vendors.map((v) => ({ value: v.name, label: v.name }))
                      ]}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              </div>

              {/* Quantity & Unit Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Controller
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <CustomInput
                        label="Quantity (Units)"
                        required
                        type="number"
                        placeholder="1"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    control={editForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <CustomInput
                        label="Unit Price (PKR)"
                        type="number"
                        placeholder="0"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Discount (%) */}
              <div>
                <Controller
                  control={editForm.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <CustomInput
                      label="Discount (%)"
                      type="number"
                      placeholder="0"
                      min={0}
                      max={100}
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      rightElement={<span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, fontWeight: 700, paddingRight: '4px' }}>%</span>}
                    />
                  )}
                />
              </div>

              {/* Line Total Display Box */}
              <div>
                <div className={styles.lineTotalBox}>
                  <span className={styles.lineTotalValue}>Rs. {editLineTotal.toLocaleString()}</span>
                  {editDiscountAmount > 0 && (
                    <span style={{ fontSize: '11px', color: '#107C41', marginLeft: '6px', fontWeight: 600 }}>
                      (-{editDiscountAmount.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              {/* Reference Note */}
              <div>
                <Controller
                  control={editForm.control}
                  name="note"
                  render={({ field }) => (
                    <CustomInput
                      label="Note / Remarks"
                      placeholder="Batch #, invoice notes, etc."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </form>

            {/* Drawer Footer */}
            <div className={styles.drawerFooter}>
              <Button
                appearance="subtle"
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                form="editDrawerForm"
                disabled={updateMutation.isPending}
                style={{
                  backgroundColor: '#E51937',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT RECEIVING INVOICE MODAL ── */}
      <Dialog open={isPrintModalOpen} onOpenChange={(_, d) => setIsPrintModalOpen(d.open)}>
        <DialogSurface style={{ borderRadius: '14px', width: '680px', maxWidth: '96vw', padding: '24px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Subtitle2 style={{ fontWeight: 800, color: tokens.colorNeutralForeground1, margin: 0, fontSize: '18px' }}>
              Purchase Receiving Invoice
            </Subtitle2>
            <Button
              appearance="subtle"
              icon={<Dismiss20Regular />}
              onClick={() => setIsPrintModalOpen(false)}
              style={{ minWidth: '32px', width: '32px', height: '32px', padding: 0 }}
            />
          </div>

          <div>
            {printingMovement && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  padding: '20px 22px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {/* Invoice Top Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E51937', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: '#E51937',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '15px',
                      }}
                    >
                      OP
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827', lineHeight: 1.1 }}>OmniPos</div>
                      <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Enterprise POS &amp; Inventory
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#E51937', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      RECEIVING INVOICE
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '2px' }}>
                      <strong>Inv #:</strong> {printDocNo}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#475569' }}>
                      <strong>Date:</strong> {printDate} {printTime}
                    </div>
                  </div>
                </div>

                {/* Parties Information (Vendor & Store) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Vendor / Supplier Box */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#E51937', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      Supplier / Vendor Details
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '3px' }}>
                      {currentPrintVendor?.name || printingMovement.reason || 'Vendor / Supplier'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.35 }}>
                      <div><strong>Rep:</strong> {currentPrintVendor?.contactPerson || 'Authorized Agent'}</div>
                      <div><strong>Phone:</strong> {currentPrintVendor?.phone || 'N/A'}</div>
                      <div><strong>Address:</strong> {currentPrintVendor?.address || 'Local Supply'}</div>
                    </div>
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'inline-block',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#991B1B',
                      }}
                    >
                      Vendor Balance: Rs. {printVendorBalance.toLocaleString()} PKR
                    </div>
                  </div>

                  {/* Store / Destination Box */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      Receiving Facility / Store
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginBottom: '3px' }}>
                      OmniPos Central Branch &amp; Store
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.35 }}>
                      <div><strong>Warehouse:</strong> Inward Logistics Bay #1</div>
                      <div><strong>Received By:</strong> Store Manager (Admin)</div>
                      <div><strong>Account:</strong> Inventory Trade Payable</div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#15803D', fontWeight: 700 }}>
                      ✓ Stock Count Verified &amp; Added
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderTop: '1px solid #CBD5E1', borderBottom: '2px solid #94A3B8' }}>
                      <th style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', color: '#334155', width: '32px' }}>#</th>
                      <th style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left', color: '#334155' }}>Item Description</th>
                      <th style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right', color: '#334155', width: '90px' }}>Unit Rate</th>
                      <th style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', color: '#334155', width: '80px' }}>Quantity</th>
                      <th style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right', color: '#334155', width: '70px' }}>Discount</th>
                      <th style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right', color: '#334155', width: '110px' }}>Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', fontSize: '11px', textAlign: 'center', color: '#64748B' }}>1</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', fontSize: '11.5px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{printingMovement.productName}</div>
                        {printingMovement.note && <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Note: {printingMovement.note}</div>}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', fontSize: '11.5px', textAlign: 'right', fontWeight: 600 }}>{formatPKR(printUnitCost)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', fontSize: '11.5px', textAlign: 'center', fontWeight: 800, color: '#15803D' }}>+{printQty} units</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', fontSize: '11.5px', textAlign: 'right', color: '#64748B' }}>{printDiscountPercent > 0 ? `${printDiscountPercent}%` : '—'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0', fontSize: '11.5px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>{formatPKR(printNetTotal)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Calculation & Vendor Balance Breakdown */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <div style={{ width: '280px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>
                      <span>Gross Total:</span>
                      <span style={{ fontWeight: 600 }}>{formatPKR(printGrossTotal)}</span>
                    </div>
                    {printDiscountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#15803D', marginBottom: '4px' }}>
                        <span>Discount ({printDiscountPercent}%):</span>
                        <span>- {formatPKR(printDiscountAmount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', borderTop: '1px solid #0F172A', borderBottom: '1px solid #0F172A', padding: '5px 0', margin: '5px 0' }}>
                      <span>This Invoice Total:</span>
                      <span style={{ color: '#E51937' }}>{formatPKR(printNetTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '3px' }}>
                      <span>Previous Vendor Balance:</span>
                      <span>{formatPKR(printPrevBalance)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#15803D', marginBottom: '4px' }}>
                      <span>This Bill Added:</span>
                      <span>+ {formatPKR(printNetTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', padding: '4px 6px', marginTop: '4px' }}>
                      <span>Total Balance Due:</span>
                      <span>{formatPKR(printVendorBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1', fontSize: '10px', color: '#64748B' }}>
                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ borderTop: '1px solid #64748B', marginBottom: '3px' }}></div>
                    <div>Vendor / Delivery Sign</div>
                  </div>
                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ borderTop: '1px solid #64748B', marginBottom: '3px' }}></div>
                    <div>Storekeeper Received</div>
                  </div>
                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ borderTop: '1px solid #64748B', marginBottom: '3px' }}></div>
                    <div>Authorized Seal</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '18px', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button
              appearance="secondary"
              onClick={() => setIsPrintModalOpen(false)}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '8px',
                fontWeight: 600,
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                backgroundColor: tokens.colorNeutralBackground3,
                color: tokens.colorNeutralForeground1,
                cursor: 'pointer',
              }}
            >
              Close
            </Button>
            <Button
              appearance="primary"
              icon={<Print20Regular style={{ width: 18, height: 18 }} />}
              onClick={handlePrint}
              style={{
                height: '38px',
                padding: '0 22px',
                backgroundColor: '#E51937',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(229, 25, 55, 0.35)',
              }}
            >
              Print Invoice
            </Button>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
