import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Button,
  Label,
  Subtitle1,
  Caption1,
  Textarea,
  Dialog,
  DialogSurface,
} from '@fluentui/react-components';
import {
  ArrowLeft20Regular,
  Save20Regular,
  Image20Regular,
  Dismiss16Regular,
  Add20Regular,
  Tag20Regular,
  Delete20Regular,
  Food24Regular,
  ShoppingBag24Regular,
  CheckmarkCircle20Filled,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Product, Category, ModuleKey, ProductVariant } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { CATEGORY_PROFILES, detectCategoryProfile } from '@/lib/categoryProfiles';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { CustomInput, CustomSelect } from '@/components/ui';
import {
  Tag,
  Circle,
  PieChart,
  BarChart2,
  IndianRupee,
  Hash,
  SlidersHorizontal,
  CupSoda,
  Droplets,
  Shirt,
  Footprints,
  Sparkles,
  Palette,
  Package,
  PaintBucket,
  Wrench,
  Hammer,
  Coins,
} from 'lucide-react';
import { setLocalVariantRegistry } from '@/lib/variants';

export const PRICING_TYPES_FASTFOOD = [
  {
    id: 'fixed',
    label: 'Fixed Price',
    icon: Tag,
    desc: 'Single flat price (Burger, Roll, Shawarma, etc.)',
    suggestedUnit: 'PCS',
    defaultSizes: [] as string[],
  },
  {
    id: 'smlxl',
    label: 'Pizza Sizes (S / M / L / XL)',
    icon: Circle,
    desc: 'Pizza sizes (Small, Medium, Large, X-Large)',
    suggestedUnit: 'PCS',
    defaultSizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'halffull',
    label: 'Half / Full',
    icon: PieChart,
    desc: 'Half and Full portions (Karahi, Handi, Biryani, etc.)',
    suggestedUnit: 'SERVING',
    defaultSizes: ['Half', 'Full'],
  },
  {
    id: 'drinks',
    label: 'Cold Drink (Can / 500ml / 1L / 1.5L)',
    icon: CupSoda,
    desc: 'Cans and bottles (Can 250ml, 500ml, 1.0L, 1.5L)',
    suggestedUnit: 'PCS',
    defaultSizes: ['Can (250ml)', '500ml', '1.0L', '1.5L'],
  },
  {
    id: 'water',
    label: 'Mineral Water (Small / Large)',
    icon: Droplets,
    desc: 'Bottled water (Small 500ml, Large 1.5L)',
    suggestedUnit: 'PCS',
    defaultSizes: ['Small (500ml)', 'Large (1.5L)'],
  },
  {
    id: 'perkg',
    label: 'Per KG',
    icon: BarChart2,
    desc: 'Weighed items (Fruits, Vegetables, Meat, etc.)',
    suggestedUnit: 'KG',
    defaultSizes: ['250g', '500g', '1 KG'],
  },
  {
    id: 'custom',
    label: 'Custom Variants',
    icon: SlidersHorizontal,
    desc: 'Custom sizes, flavors, or combo deals',
    suggestedUnit: 'PCS',
    defaultSizes: [] as string[],
  },
];

export const PRICING_TYPES_MINIMART = [
  {
    id: 'fixed',
    label: 'Fixed Price',
    icon: Tag,
    desc: 'Single flat price (Creams, Lotions, Toys, Powders, Bags)',
    suggestedUnit: 'PCS',
    defaultSizes: [] as string[],
  },
  {
    id: 'retail_garments',
    label: 'Kapray / Sizes (S, M, L, XL)',
    icon: Shirt,
    desc: 'Kurtas, Shalwar Kameez, Shirts, Pants (S, M, L, XL)',
    suggestedUnit: 'PCS',
    defaultSizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'retail_shoes',
    label: 'Shoes / Footwear (40 - 44)',
    icon: Footprints,
    desc: 'Shoes, Joggers, Peshawari Chappal, Loafers (40, 41, 42, 43, 44)',
    suggestedUnit: 'PAIR',
    defaultSizes: ['40', '41', '42', '43', '44'],
  },
  {
    id: 'retail_shades',
    label: 'Shades & Colors',
    icon: Palette,
    desc: 'Nail polish & lipstick shades (#01, #08, #14, #22)',
    suggestedUnit: 'PCS',
    defaultSizes: ['#01 Red', '#08 Nude', '#14 Maroon', '#22 Gold'],
  },
  {
    id: 'retail_volumes',
    label: 'Packs / Volumes',
    icon: Package,
    desc: 'Lotions, powders, bottle sizes (125ml, 250ml, 400ml)',
    suggestedUnit: 'PCS',
    defaultSizes: ['125ml', '250ml', '400ml'],
  },
  {
    id: 'paint_packs',
    label: 'Paint (Quarter / Gallon / Balti)',
    icon: PaintBucket,
    desc: 'Quarter (1L), Gallon (4L), Balti / Drum (14-16L)',
    suggestedUnit: 'GALLON',
    defaultSizes: ['Quarter (1L)', 'Gallon (4L)', 'Balti (16L)'],
  },
  {
    id: 'sanitary_fittings',
    label: 'Sanitary Taps (Tootian / Nalke)',
    icon: Wrench,
    desc: 'Bib Cock, Pillar Cock, Wall Mixer, Muslim Shower',
    suggestedUnit: 'PCS',
    defaultSizes: ['Bib Cock', 'Pillar Cock', 'Wall Mixer', 'Muslim Shower'],
  },
  {
    id: 'hardware_fasteners',
    label: 'Kill / Kable / Screws',
    icon: Hammer,
    desc: 'Nails (Kill), Bolts (Kable), Screws (Kg, Pkt, Box)',
    suggestedUnit: 'KG',
    defaultSizes: ['0.5 KG', '1.0 KG', 'Packet', 'Box'],
  },
  {
    id: 'custom',
    label: 'Custom Sizes',
    icon: SlidersHorizontal,
    desc: 'Add custom sizes or variations',
    suggestedUnit: 'PCS',
    defaultSizes: [] as string[],
  },
];

export const PRICING_TYPES_PAINT_HARDWARE = [
  {
    id: 'paint_packs',
    label: 'Paint (Quarter / Gallon / Balti)',
    icon: PaintBucket,
    desc: 'Quarter (1L), Gallon (4L), Balti / Drum (14-16L)',
    suggestedUnit: 'GALLON',
    defaultSizes: ['Quarter (1L)', 'Gallon (4L)', 'Balti (16L)'],
  },
  {
    id: 'sanitary_fittings',
    label: 'Sanitary Taps (Tootian / Nalke)',
    icon: Wrench,
    desc: 'Bib Cock, Pillar Cock, Wall Mixer, Muslim Shower',
    suggestedUnit: 'PCS',
    defaultSizes: ['Bib Cock', 'Pillar Cock', 'Wall Mixer', 'Muslim Shower'],
  },
  {
    id: 'hardware_fasteners',
    label: 'Kill / Kable / Screws',
    icon: Hammer,
    desc: 'Nails (Kill), Bolts (Kable), Screws (Kg, Pkt, Box)',
    suggestedUnit: 'KG',
    defaultSizes: ['0.5 KG', '1.0 KG', 'Packet', 'Box'],
  },
  {
    id: 'fixed',
    label: 'Fixed Price',
    icon: Tag,
    desc: 'Single flat price (Paint Brush, Roller, Thinner, Tape, Wire)',
    suggestedUnit: 'PCS',
    defaultSizes: [] as string[],
  },
  {
    id: 'perkg',
    label: 'Per KG (Loose Item)',
    icon: BarChart2,
    desc: 'Weighed item (Sariya, Wire, Keel, Cement, Sand)',
    suggestedUnit: 'KG',
    defaultSizes: ['250g', '500g', '1 KG'],
  },
  {
    id: 'custom',
    label: 'Custom Sizes',
    icon: SlidersHorizontal,
    desc: 'Add custom sizes or variations',
    suggestedUnit: 'PCS',
    defaultSizes: [] as string[],
  },
];

export const PRICING_TYPES = PRICING_TYPES_FASTFOOD;

const UNIT_OPTIONS = [
  { value: 'PCS', label: 'Piece (PCS)' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'Gram', label: 'Gram (g)' },
  { value: 'Liter', label: 'Liter (L)' },
  { value: 'ML', label: 'Milliliter (ml)' },
  { value: 'PACK', label: 'Pack' },
  { value: 'BOX', label: 'Box' },
  { value: 'DOZEN', label: 'Dozen' },
  { value: 'FEET', label: 'Feet (ft)' },
  { value: 'METER', label: 'Meter (m)' },
  { value: 'GALLON', label: 'Gallon' },
  { value: 'BAG', label: 'Bag' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'PAIR', label: 'Pair' },
];

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  module: z.enum(['fastfood', 'minimart']),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Retail price must be greater than 0'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional(),
  pricingType: z.string().default('fixed'),
  unit: z.string().default('PCS'),
  skuCode: z.string().optional(),
  rackLocation: z.string().optional(),
  prepTime: z.coerce.number().min(0).optional(),
  openingStock: z.coerce.number().min(0, 'Stock cannot be negative').default(50),
  minThreshold: z.coerce.number().min(0).default(10),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});
type ProductFormData = z.infer<typeof productSchema>;

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  module: z.enum(['fastfood', 'minimart']),
});
type CategoryFormData = z.infer<typeof categorySchema>;

const useStyles = makeStyles({
  container: {
    padding: '20px 24px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerBackBtn: {
    borderRadius: '8px',
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    marginTop: '2px',
    display: 'block',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  btnCancel: {
    borderRadius: '8px',
    fontWeight: 600,
  },
  btnPrimarySave: {
    backgroundColor: '#E51937',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    ':hover': {
      backgroundColor: '#be123c',
    },
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '24px',
    alignItems: 'stretch',
  },
  cardSurface: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  cardSurfaceRight: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    height: '100%',
    boxSizing: 'border-box',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  threeColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  fieldLabel: {
    fontWeight: 600,
    display: 'block',
    marginBottom: '6px',
  },
  fieldHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#E51937',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 2px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  newCategoryLink: {
    fontSize: '12px',
    color: '#E51937',
    fontWeight: 700,
    cursor: 'pointer',
  },
  fullWidth: {
    width: '100%',
  },
  errorCaption: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: '4px',
    display: 'block',
  },
  descTextarea: {
    width: '100%',
    minHeight: '70px',
  },

  // Presets Bar
  presetsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: '2px',
    marginBottom: '6px',
  },
  presetsTitle: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  presetsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  presetChip: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Pricing Type Section
  pricingTypeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
    marginBottom: '6px',
  },
  pricingTypeLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  pricingTypeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  pricingTypeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    outline: 'none',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground1,
    },
  },
  pricingTypeBtnActive: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    fontWeight: 700,
    borderTopColor: '#E51937',
    borderBottomColor: '#E51937',
    borderLeftColor: '#E51937',
    borderRightColor: '#E51937',
    boxShadow: '0 2px 10px rgba(229, 25, 55, 0.35)',
    ':hover': {
      backgroundColor: '#be123c',
      color: '#FFFFFF',
    },
  },
  pricingTypeDesc: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 500,
    marginTop: '2px',
  },

  // Variants Section
  variantSectionBox: {
    padding: '16px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  variantHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variantHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  variantProfileTag: {
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 7px',
    borderRadius: '4px',
  },
  variantHeaderLabel: {
    fontWeight: 700,
    fontSize: '13.5px',
  },
  variantCustomBtn: {
    fontSize: '11.5px',
    fontWeight: 600,
  },
  variantChipsCaption: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
    marginBottom: '6px',
  },
  variantChipsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  variantChipBtn: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease',
  },
  variantTableContainer: {
    marginTop: '4px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: '10px',
  },
  variantTableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  variantTableCaption: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
  },
  variantColumnHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '85px 95px 120px 1fr 32px',
    gap: '8px',
    alignItems: 'center',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '2px',
  },
  variantRowsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  variantRowItem: {
    display: 'grid',
    gridTemplateColumns: '85px 95px 120px 1fr 32px',
    gap: '8px',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  variantRowLabel: {
    fontWeight: 800,
    fontSize: '12.5px',
  },
  variantDeleteBtn: {
    color: '#D13438',
  },

  // Media / Right Column
  mediaHeaderTitle: {
    fontWeight: 700,
    fontSize: '13.5px',
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px',
  },
  mediaHeaderSubtitle: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    marginBottom: '10px',
  },
  imageDropzone: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
    position: 'relative',
  },
  imageDropzoneIcon: {
    width: '28px',
    height: '28px',
    color: tokens.colorNeutralForeground3,
    margin: '0 auto 6px',
  },
  imageDropzoneText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#E51937',
  },
  imageDropzoneCaption: {
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
  },
  urlInputContainer: {
    marginTop: '10px',
  },
  previewSection: {
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    paddingTop: '14px',
  },
  previewTitle: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  previewCard: {
    width: '100%',
    height: '190px',
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: tokens.shadow4,
  },
  previewImageWrap: {
    height: '114px',
    width: '100%',
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewNoPhotoBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: tokens.colorNeutralForeground4,
  },
  previewBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 700,
  },
  previewDetailsWrap: {
    height: '76px',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  previewProductTitle: {
    fontSize: '12px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewVariantsRow: {
    display: 'flex',
    gap: '3px',
    marginTop: '2px',
    overflow: 'hidden',
  },
  previewVariantBadge: {
    fontSize: '8.5px',
    fontWeight: 800,
    padding: '0 4px',
    borderRadius: '3px',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    color: '#E51937',
    border: '1px solid rgba(229, 25, 55, 0.25)',
  },
  previewMoreVariantsText: {
    fontSize: '8.5px',
    color: tokens.colorNeutralForeground3,
  },
  previewCategoryText: {
    fontSize: '10.5px',
    color: tokens.colorNeutralForeground3,
  },
  previewBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewPriceText: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#E51937',
  },
  previewModuleText: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
  },
  proTipBox: {
    marginTop: 'auto',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  proTipTitle: {
    fontSize: '11px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  proTipCaption: {
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
    lineHeight: '1.4',
  },

  // Modal Dialog
  dialogSurface: {
    maxWidth: '460px',
    width: '92vw',
    borderRadius: '16px',
    padding: '24px',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    width: '100%',
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
  },
  dialogHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dialogIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
  },
  dialogTitleText: {
    fontSize: '17px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  dialogSubtitleText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  dialogFieldsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
  },
  dialogActionsRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '6px',
    paddingTop: '14px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
  },
  dialogCancelBtn: {
    borderRadius: '8px',
    fontWeight: 600,
  },
  dialogSaveBtn: {
    backgroundColor: '#E51937',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '0 20px',
    ':hover': {
      backgroundColor: '#be123c',
    },
  },
});

export function AddProductView(): React.JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const defaultModule =
    ((searchParams.get('module') as ModuleKey) && can(searchParams.get('module') as any))
      ? (searchParams.get('module') as ModuleKey)
      : hasFastFood
      ? 'fastfood'
      : 'minimart';

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => posApi.fetchCategories(),
  });

  const generateRandomSku = () => String(Math.floor(10000000 + Math.random() * 90000000));

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      module: defaultModule,
      category: 'General',
      price: undefined,
      costPrice: undefined,
      pricingType: 'fixed',
      unit: defaultModule === 'minimart' ? 'PCS' : 'PCS',
      skuCode: generateRandomSku(),
      rackLocation: '',
      openingStock: 50,
      minThreshold: 10,
      imageUrl: '',
      description: '',
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: '',
      module: defaultModule,
    },
  });

  const [pricingType, setPricingType] = useState<string>('fixed');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  // Dedicated size pricing states for Fast Food reference designs
  const [pizzaSizes, setPizzaSizes] = useState({
    small: '',
    medium: '',
    large: '',
    xlarge: '',
  });

  const [portionSizes, setPortionSizes] = useState({
    half: '',
    full: '',
  });

  const [drinkSizes, setDrinkSizes] = useState({
    can: '',
    halfLiter: '',
    oneLiter: '',
    onePointFive: '',
  });

  const [waterSizes, setWaterSizes] = useState({
    small: '',
    large: '',
  });

  // Dedicated retail size pricing states (Garments, Shoes, Shades, Volumes)
  const [garmentSizes, setGarmentSizes] = useState({
    s: '',
    m: '',
    l: '',
    xl: '',
  });

  const [shoeSizes, setShoeSizes] = useState({
    s40: '',
    s41: '',
    s42: '',
    s43: '',
    s44: '',
  });

  const [shadeSizes, setShadeSizes] = useState({
    s01: '',
    s08: '',
    s14: '',
    s22: '',
  });

  const [volumeSizes, setVolumeSizes] = useState({
    v1: '',
    v2: '',
    v3: '',
  });

  const [bulkGarmentPrice, setBulkGarmentPrice] = useState('');
  const [bulkShoePrice, setBulkShoePrice] = useState('');

  // Dedicated Paint Pricing States (Quarter, Gallon, Balti + Shade + Token)
  const [paintSizes, setPaintSizes] = useState({
    quarter: '',
    gallon: '',
    balti: '',
  });
  const [paintCostPrices, setPaintCostPrices] = useState({
    quarter: '',
    gallon: '',
    balti: '',
  });
  const [paintShadeCode, setPaintShadeCode] = useState('');
  const [painterTokenAmount, setPainterTokenAmount] = useState('');

  // Dedicated Sanitary Taps Pricing States
  const [sanitarySizes, setSanitarySizes] = useState({
    bibCock: '',
    pillarCock: '',
    wallMixer: '',
    muslimShower: '',
  });

  // Dedicated Hardware Fasteners Pricing States
  const [hardwareSizes, setHardwareSizes] = useState({
    halfKg: '',
    oneKg: '',
    packet: '',
    box: '',
  });

  const [activeDepartmentTab, setActiveDepartmentTab] = useState<'fastfood' | 'minimart' | 'paint_hardware'>(
    defaultModule === 'fastfood' ? 'fastfood' : 'minimart'
  );

  const watchedModule = productForm.watch('module');
  const watchedCategory = productForm.watch('category');
  const watchedName = productForm.watch('name');
  const watchedPrice = productForm.watch('price');
  const watchedStock = productForm.watch('openingStock');
  const watchedUnit = productForm.watch('unit');

  const activeCategoryObj = categories.find((c) => c.name === watchedCategory);
  const detectedProfile = detectCategoryProfile(watchedCategory || '', activeCategoryObj?.profile);
  const profileConfig = CATEGORY_PROFILES[detectedProfile];

  const rebuildVariantsFromPizzaSizes = (sizesObj: typeof pizzaSizes) => {
    const mapping: { key: keyof typeof pizzaSizes; label: string }[] = [
      { key: 'small', label: 'S' },
      { key: 'medium', label: 'M' },
      { key: 'large', label: 'L' },
      { key: 'xlarge', label: 'XL' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_${label.toLowerCase()}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const rebuildVariantsFromGarmentSizes = (sizesObj: typeof garmentSizes) => {
    const mapping: { key: keyof typeof garmentSizes; label: string }[] = [
      { key: 's', label: 'S' },
      { key: 'm', label: 'M' },
      { key: 'l', label: 'L' },
      { key: 'xl', label: 'XL' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_g_${label.toLowerCase()}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const rebuildVariantsFromShoeSizes = (sizesObj: typeof shoeSizes) => {
    const mapping: { key: keyof typeof shoeSizes; label: string }[] = [
      { key: 's40', label: '40' },
      { key: 's41', label: '41' },
      { key: 's42', label: '42' },
      { key: 's43', label: '43' },
      { key: 's44', label: '44' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_shoe_${label}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const rebuildVariantsFromShadeSizes = (sizesObj: typeof shadeSizes) => {
    const mapping: { key: keyof typeof shadeSizes; label: string }[] = [
      { key: 's01', label: '#01 Red' },
      { key: 's08', label: '#08 Nude' },
      { key: 's14', label: '#14 Maroon' },
      { key: 's22', label: '#22 Gold' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_sh_${label.slice(1, 3)}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label.slice(1, 3)}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const rebuildVariantsFromVolumeSizes = (sizesObj: typeof volumeSizes) => {
    const mapping: { key: keyof typeof volumeSizes; label: string }[] = [
      { key: 'v1', label: '125ml' },
      { key: 'v2', label: '250ml' },
      { key: 'v3', label: '400ml' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_vol_${label}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const handleGarmentSizeChange = (key: keyof typeof garmentSizes, val: string) => {
    const updated = { ...garmentSizes, [key]: val };
    setGarmentSizes(updated);
    rebuildVariantsFromGarmentSizes(updated);
  };

  const handleShoeSizeChange = (key: keyof typeof shoeSizes, val: string) => {
    const updated = { ...shoeSizes, [key]: val };
    setShoeSizes(updated);
    rebuildVariantsFromShoeSizes(updated);
  };

  const handleShadeSizeChange = (key: keyof typeof shadeSizes, val: string) => {
    const updated = { ...shadeSizes, [key]: val };
    setShadeSizes(updated);
    rebuildVariantsFromShadeSizes(updated);
  };

  const handleVolumeSizeChange = (key: keyof typeof volumeSizes, val: string) => {
    const updated = { ...volumeSizes, [key]: val };
    setVolumeSizes(updated);
    rebuildVariantsFromVolumeSizes(updated);
  };

  const rebuildVariantsFromPaintSizes = (
    sizesObj: typeof paintSizes,
    costObj: typeof paintCostPrices = paintCostPrices,
    shadeCode: string = paintShadeCode,
  ) => {
    const mapping: { key: keyof typeof paintSizes; label: string; tag: string }[] = [
      { key: 'quarter', label: 'Quarter (1L)', tag: 'QTR' },
      { key: 'gallon', label: 'Gallon (4L)', tag: 'GAL' },
      { key: 'balti', label: 'Balti / Drum (16L)', tag: 'BAL' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label, tag }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        const costStr = (costObj[key] || '').trim();
        const costNum = costStr && !isNaN(Number(costStr)) ? Number(costStr) : 0;
        if (firstPrice === undefined) firstPrice = pNum;

        const shadeSuffix = shadeCode ? ` - Shade ${shadeCode}` : '';
        built.push({
          id: uid(`var_paint_${tag.toLowerCase()}_`),
          label: `${label}${shadeSuffix}`,
          price: pNum,
          priceDelta: 0,
          costDelta: costNum,
          stock: 25,
          skuCode: watchedName
            ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}${shadeCode ? `-${shadeCode}` : ''}-${tag}`
            : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const handlePaintSizeChange = (key: keyof typeof paintSizes, val: string) => {
    const updated = { ...paintSizes, [key]: val };
    setPaintSizes(updated);
    rebuildVariantsFromPaintSizes(updated, paintCostPrices, paintShadeCode);
  };

  const handlePaintCostChange = (key: keyof typeof paintCostPrices, val: string) => {
    const updated = { ...paintCostPrices, [key]: val };
    setPaintCostPrices(updated);
    rebuildVariantsFromPaintSizes(paintSizes, updated, paintShadeCode);
  };

  const handlePaintShadeCodeChange = (val: string) => {
    setPaintShadeCode(val);
    rebuildVariantsFromPaintSizes(paintSizes, paintCostPrices, val);
  };

  const rebuildVariantsFromSanitarySizes = (sizesObj: typeof sanitarySizes) => {
    const mapping: { key: keyof typeof sanitarySizes; label: string; tag: string }[] = [
      { key: 'bibCock', label: 'Bib Cock (Tooti)', tag: 'BC' },
      { key: 'pillarCock', label: 'Pillar Cock (Basin)', tag: 'PC' },
      { key: 'wallMixer', label: 'Wall Mixer', tag: 'WM' },
      { key: 'muslimShower', label: 'Muslim Shower Set', tag: 'MS' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label, tag }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_san_${tag.toLowerCase()}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 30,
          skuCode: watchedName
            ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${tag}`
            : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const handleSanitarySizeChange = (key: keyof typeof sanitarySizes, val: string) => {
    const updated = { ...sanitarySizes, [key]: val };
    setSanitarySizes(updated);
    rebuildVariantsFromSanitarySizes(updated);
  };

  const rebuildVariantsFromHardwareSizes = (sizesObj: typeof hardwareSizes) => {
    const mapping: { key: keyof typeof hardwareSizes; label: string; tag: string }[] = [
      { key: 'halfKg', label: '0.5 KG (Aadha Kilo)', tag: '500G' },
      { key: 'oneKg', label: '1.0 KG (Ek Kilo)', tag: '1KG' },
      { key: 'packet', label: 'Packet (Small Pack)', tag: 'PKT' },
      { key: 'box', label: 'Box (Wholesale Dabba)', tag: 'BOX' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label, tag }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_hw_${tag.toLowerCase()}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName
            ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${tag}`
            : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const handleHardwareSizeChange = (key: keyof typeof hardwareSizes, val: string) => {
    const updated = { ...hardwareSizes, [key]: val };
    setHardwareSizes(updated);
    rebuildVariantsFromHardwareSizes(updated);
  };



  const rebuildVariantsFromPortionSizes = (sizesObj: typeof portionSizes) => {
    const mapping: { key: keyof typeof portionSizes; label: string }[] = [
      { key: 'half', label: 'Half' },
      { key: 'full', label: 'Full' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_${label.toLowerCase()}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const rebuildVariantsFromDrinkSizes = (sizesObj: typeof drinkSizes) => {
    const mapping: { key: keyof typeof drinkSizes; label: string }[] = [
      { key: 'can', label: 'Can (250ml)' },
      { key: 'halfLiter', label: '500ml' },
      { key: 'oneLiter', label: '1.0 Liter' },
      { key: 'onePointFive', label: '1.5 Liter' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_${label.toLowerCase().replace(/[^a-z0-9]/g, '')}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label.slice(0, 3)}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const rebuildVariantsFromWaterSizes = (sizesObj: typeof waterSizes) => {
    const mapping: { key: keyof typeof waterSizes; label: string }[] = [
      { key: 'small', label: 'Small (500ml)' },
      { key: 'large', label: 'Large (1.5L)' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_${label.toLowerCase().replace(/[^a-z0-9]/g, '')}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${label.slice(0, 3)}` : undefined,
        });
      }
    });

    setVariants(built);
    setHasVariants(built.length > 0);
    if (firstPrice !== undefined) {
      productForm.setValue('price', firstPrice);
      productForm.clearErrors('price');
    }
  };

  const handlePizzaSizeChange = (key: keyof typeof pizzaSizes, val: string) => {
    const updated = { ...pizzaSizes, [key]: val };
    setPizzaSizes(updated);
    rebuildVariantsFromPizzaSizes(updated);
  };

  const handlePortionSizeChange = (key: keyof typeof portionSizes, val: string) => {
    const updated = { ...portionSizes, [key]: val };
    setPortionSizes(updated);
    rebuildVariantsFromPortionSizes(updated);
  };

  const handleDrinkSizeChange = (key: keyof typeof drinkSizes, val: string) => {
    const updated = { ...drinkSizes, [key]: val };
    setDrinkSizes(updated);
    rebuildVariantsFromDrinkSizes(updated);
  };

  const handleWaterSizeChange = (key: keyof typeof waterSizes, val: string) => {
    const updated = { ...waterSizes, [key]: val };
    setWaterSizes(updated);
    rebuildVariantsFromWaterSizes(updated);
  };

  const handleToggleSize = (sizeLabel: string) => {
    setVariants((prev) => {
      const exists = prev.some((v) => v.label.toLowerCase() === sizeLabel.toLowerCase());
      if (exists) {
        const next = prev.filter((v) => v.label.toLowerCase() !== sizeLabel.toLowerCase());
        if (next.length === 0) setHasVariants(false);
        return next;
      } else {
        const newVar: ProductVariant = {
          id: uid('var_'),
          label: sizeLabel,
          price: watchedPrice || undefined,
          priceDelta: 0,
          costDelta: 0,
          stock: 10,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${sizeLabel}` : undefined,
        };
        setHasVariants(true);
        return [...prev, newVar];
      }
    });
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => {
      const next = prev.filter((v) => v.id !== id);
      if (next.length === 0) setHasVariants(false);
      return next;
    });
  };

  const handleAddCustomVariant = () => {
    const label = prompt('Enter custom variant name (e.g. XL, 42, Blue / M):');
    if (label && label.trim()) {
      handleToggleSize(label.trim());
    }
  };

  const handlePricingTypeSelect = (typeId: string) => {
    setPricingType(typeId);
    productForm.setValue('pricingType', typeId);

    const activeList =
      activeDepartmentTab === 'paint_hardware'
        ? PRICING_TYPES_PAINT_HARDWARE
        : watchedModule === 'fastfood'
        ? PRICING_TYPES_FASTFOOD
        : PRICING_TYPES_MINIMART;
    const typeConfig = activeList.find((p) => p.id === typeId);
    if (!typeConfig) return;

    // 1. Auto-select suggested measurement unit
    if (typeConfig.suggestedUnit) {
      productForm.setValue('unit', typeConfig.suggestedUnit);
    }

    // 2. Intelligent variant auto-population based on selected type
    if (typeId === 'smlxl') {
      rebuildVariantsFromPizzaSizes(pizzaSizes);
    } else if (typeId === 'retail_garments') {
      rebuildVariantsFromGarmentSizes(garmentSizes);
    } else if (typeId === 'retail_shoes') {
      rebuildVariantsFromShoeSizes(shoeSizes);
    } else if (typeId === 'retail_shades') {
      rebuildVariantsFromShadeSizes(shadeSizes);
    } else if (typeId === 'retail_volumes') {
      rebuildVariantsFromVolumeSizes(volumeSizes);
    } else if (typeId === 'paint_packs') {
      rebuildVariantsFromPaintSizes(paintSizes, paintCostPrices, paintShadeCode);
    } else if (typeId === 'sanitary_fittings') {
      rebuildVariantsFromSanitarySizes(sanitarySizes);
    } else if (typeId === 'hardware_fasteners') {
      rebuildVariantsFromHardwareSizes(hardwareSizes);
    } else if (typeId === 'halffull') {
      rebuildVariantsFromPortionSizes(portionSizes);
    } else if (typeId === 'drinks') {
      rebuildVariantsFromDrinkSizes(drinkSizes);
    } else if (typeId === 'water') {
      rebuildVariantsFromWaterSizes(waterSizes);
    } else if (typeId === 'fixed' || typeId === 'perpiece') {
      // Single price mode
      setVariants([]);
      setHasVariants(false);
    }
  };

  useEffect(() => {
    if (categories.length > 0) {
      const match = categories.find((c) => c.module === watchedModule);
      if (match && !categories.some((c) => c.name === productForm.getValues('category') && c.module === watchedModule)) {
        productForm.setValue('category', match.name);
      }
    }
  }, [watchedModule, categories, productForm]);

  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (pricingType === 'smlxl' && variants.length === 0) {
        alert('Please enter a price for at least one pizza size (Small, Medium, Large, XL).');
        throw new Error('No pizza size price entered');
      }
      if (pricingType === 'retail_garments' && variants.length === 0) {
        alert('Please enter a price for at least one garment size (S, M, L, XL).');
        throw new Error('No garment size price entered');
      }
      if (pricingType === 'retail_shoes' && variants.length === 0) {
        alert('Please enter a price for at least one shoe size (40, 41, 42, 43, 44).');
        throw new Error('No shoe size price entered');
      }
      if (pricingType === 'retail_shades' && variants.length === 0) {
        alert('Please enter a price for at least one shade or color.');
        throw new Error('No shade price entered');
      }
      if (pricingType === 'retail_volumes' && variants.length === 0) {
        alert('Please enter a price for at least one pack or bottle volume.');
        throw new Error('No volume price entered');
      }
      if (pricingType === 'paint_packs' && variants.length === 0) {
        alert('Please enter a price for at least one paint packing (Quarter, Gallon, or Balti).');
        throw new Error('No paint pack price entered');
      }
      if (pricingType === 'sanitary_fittings' && variants.length === 0) {
        alert('Please enter a price for at least one sanitary tap / fitting.');
        throw new Error('No sanitary price entered');
      }
      if (pricingType === 'hardware_fasteners' && variants.length === 0) {
        alert('Please enter a price for at least one hardware size / weight / pack.');
        throw new Error('No hardware price entered');
      }
      if (pricingType === 'halffull' && variants.length === 0) {
        alert('Please enter a price for Half or Full portion.');
        throw new Error('No portion price entered');
      }
      if (pricingType === 'drinks' && variants.length === 0) {
        alert('Please enter a price for at least one drink size.');
        throw new Error('No drink size price entered');
      }
      if (pricingType === 'water' && variants.length === 0) {
        alert('Please enter a price for at least one water bottle size.');
        throw new Error('No water bottle price entered');
      }

      const effectivePrice =
        variants.length > 0 && variants[0].price !== undefined && variants[0].price > 0
          ? variants[0].price
          : data.price;

      const shadeNote = paintShadeCode ? `Shade Code: ${paintShadeCode}` : '';
      const tokenNote = painterTokenAmount ? `Painter Token: Rs. ${painterTokenAmount}` : '';
      const combinedNotes = [data.description, shadeNote, tokenNote].filter(Boolean).join(' | ');

      const newProduct: Product = {
        id: uid(data.module === 'fastfood' ? 'prod_ff_' : 'prod_mm_'),
        name: data.name.trim(),
        module: data.module,
        category: data.category,
        price: effectivePrice,
        costPrice: data.costPrice,
        pricingType: data.pricingType || pricingType,
        itemRole: data.module === 'fastfood' ? 'food_menu' : 'retail_product',
        isKitchenRouted: data.module === 'fastfood',
        unit: data.unit,
        skuCode: data.skuCode || generateRandomSku(),
        rackLocation: data.rackLocation,
        prepTime: data.prepTime,
        openingStock: data.openingStock,
        minThreshold: data.minThreshold,
        imageUrl: imagePreview || data.imageUrl || undefined,
        description: combinedNotes || undefined,
        hasVariants: variants.length > 0,
        variants: variants.length > 0 ? variants : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (variants.length > 0) {
        setLocalVariantRegistry(newProduct.id, variants, newProduct.pricingType);
      }
      return await posApi.saveProduct(newProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate(watchedModule === 'fastfood' ? '/catalog/fastfood' : '/catalog/omnimart');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const newCat: Category = {
        id: uid('cat_'),
        module: data.module,
        name: data.name.trim(),
      };
      return await posApi.saveCategory(newCat);
    },
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      productForm.setValue('category', newCat.name);
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
  });

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      productForm.setValue('imageUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: ProductFormData) => {
    saveProductMutation.mutate(data);
  };

  if (isLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className={`${styles.container} no-scrollbar`}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <Button
            appearance="subtle"
            icon={<ArrowLeft20Regular />}
            onClick={() => navigate(-1)}
            className={styles.headerBackBtn}
          >
            Back
          </Button>
          <div>
            <Subtitle1 as="h1" className={styles.headerTitle}>
              Add New Product to Catalog
            </Subtitle1>
            <Caption1 className={styles.headerSubtitle}>
              Create a new item for Fast Food menu or Omnimart supermarket inventory
            </Caption1>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button
            appearance="subtle"
            onClick={() => navigate(-1)}
            className={styles.btnCancel}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<Save20Regular />}
            disabled={saveProductMutation.isPending}
            onClick={productForm.handleSubmit(onSubmit)}
            className={styles.btnPrimarySave}
          >
            {saveProductMutation.isPending ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      {/* ── Main Form Layout ──────────────────────────────────── */}
      <form onSubmit={productForm.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ── Visual Department Selection Cards (Super Easy for Any User) ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: tokens.colorNeutralBackground1,
            padding: '16px 20px',
            borderRadius: tokens.borderRadiusMedium,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
            boxShadow: tokens.shadow2,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Department Selection:
              </span>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: tokens.colorNeutralForeground1, fontWeight: 600 }}>
                Select department for this product:
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  backgroundColor:
                    activeDepartmentTab === 'fastfood'
                      ? 'rgba(229, 25, 55, 0.12)'
                      : activeDepartmentTab === 'paint_hardware'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(2, 132, 199, 0.12)',
                  color:
                    activeDepartmentTab === 'fastfood'
                      ? '#E51937'
                      : activeDepartmentTab === 'paint_hardware'
                      ? '#D97706'
                      : '#0284C7',
                  border: `1px solid ${
                    activeDepartmentTab === 'fastfood'
                      ? 'rgba(229, 25, 55, 0.25)'
                      : activeDepartmentTab === 'paint_hardware'
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'rgba(2, 132, 199, 0.25)'
                  }`,
                }}
              >
                {activeDepartmentTab === 'fastfood'
                  ? '● Active: Fast Food & Kitchen Menu'
                  : activeDepartmentTab === 'paint_hardware'
                  ? '● Active: Paint, Hardware & Sanitary'
                  : '● Active: Retail Mini Mart'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {/* 🍔 Fast Food Card */}
            {hasFastFood && (
              <button
                type="button"
                onClick={() => {
                  setActiveDepartmentTab('fastfood');
                  productForm.setValue('module', 'fastfood');
                  const ffCat = categories.find((c) => c.module === 'fastfood');
                  if (ffCat) productForm.setValue('category', ffCat.name);
                  productForm.setValue('unit', 'PCS');
                  handlePricingTypeSelect('fixed');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: activeDepartmentTab === 'fastfood' ? '2px solid #E51937' : `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: activeDepartmentTab === 'fastfood' ? 'rgba(229, 25, 55, 0.09)' : tokens.colorNeutralBackground2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: activeDepartmentTab === 'fastfood' ? '0 4px 14px rgba(229, 25, 55, 0.18)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: activeDepartmentTab === 'fastfood' ? '#E51937' : tokens.colorNeutralBackground3,
                    color: activeDepartmentTab === 'fastfood' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: activeDepartmentTab === 'fastfood' ? '0 2px 8px rgba(229, 25, 55, 0.35)' : 'none',
                  }}
                >
                  <Food24Regular style={{ width: 24, height: 24 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: activeDepartmentTab === 'fastfood' ? '#E51937' : tokens.colorNeutralForeground1 }}>
                      Fast Food & Kitchen Menu
                    </span>
                    {activeDepartmentTab === 'fastfood' && (
                      <CheckmarkCircle20Filled style={{ color: '#E51937', width: 18, height: 18 }} />
                    )}
                  </div>
                  <span style={{ display: 'block', fontSize: '11.5px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                    Burgers, Pizzas, Deals, Karahi &bull; Kitchen KOT screen dispatch
                  </span>
                </div>
              </button>
            )}

            {/* Retail Mini Mart Card */}
            {hasOmnimart && (
              <button
                type="button"
                onClick={() => {
                  setActiveDepartmentTab('minimart');
                  productForm.setValue('module', 'minimart');
                  const mmCat = categories.find((c) => c.module === 'minimart' && !c.name.toLowerCase().includes('paint') && !c.name.toLowerCase().includes('hardware'));
                  if (mmCat) productForm.setValue('category', mmCat.name);
                  if (!productForm.getValues('skuCode')) productForm.setValue('skuCode', generateRandomSku());
                  productForm.setValue('unit', 'PCS');
                  handlePricingTypeSelect('fixed');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: activeDepartmentTab === 'minimart' ? '2px solid #0284C7' : `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: activeDepartmentTab === 'minimart' ? 'rgba(2, 132, 199, 0.09)' : tokens.colorNeutralBackground2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: activeDepartmentTab === 'minimart' ? '0 4px 14px rgba(2, 132, 199, 0.18)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: activeDepartmentTab === 'minimart' ? '#0284C7' : tokens.colorNeutralBackground3,
                    color: activeDepartmentTab === 'minimart' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: activeDepartmentTab === 'minimart' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                  }}
                >
                  <ShoppingBag24Regular style={{ width: 24, height: 24 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: activeDepartmentTab === 'minimart' ? '#0284C7' : tokens.colorNeutralForeground1 }}>
                      Retail Mini Mart
                    </span>
                    {activeDepartmentTab === 'minimart' && (
                      <CheckmarkCircle20Filled style={{ color: '#0284C7', width: 18, height: 18 }} />
                    )}
                  </div>
                  <span style={{ display: 'block', fontSize: '11.5px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                    Cosmetics, Stitched Clothes, Shoes, Toys, Grocery &bull; Barcode scanner ready
                  </span>
                </div>
              </button>
            )}

            {/* 🎨 Paint, Hardware & Sanitary Card */}
            {hasOmnimart && (
              <button
                type="button"
                onClick={() => {
                  setActiveDepartmentTab('paint_hardware');
                  productForm.setValue('module', 'minimart');
                  const paintCat = categories.find((c) => c.name.toLowerCase().includes('paint')) || categories.find((c) => c.module === 'minimart');
                  if (paintCat) productForm.setValue('category', paintCat.name);
                  if (!productForm.getValues('skuCode')) productForm.setValue('skuCode', generateRandomSku());
                  productForm.setValue('unit', 'GALLON');
                  handlePricingTypeSelect('paint_packs');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: activeDepartmentTab === 'paint_hardware' ? '2px solid #E51937' : `1px solid ${tokens.colorNeutralStroke2}`,
                  backgroundColor: activeDepartmentTab === 'paint_hardware' ? 'rgba(229, 25, 55, 0.09)' : tokens.colorNeutralBackground2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: activeDepartmentTab === 'paint_hardware' ? '0 4px 14px rgba(229, 25, 55, 0.18)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: activeDepartmentTab === 'paint_hardware' ? '#E51937' : tokens.colorNeutralBackground3,
                    color: activeDepartmentTab === 'paint_hardware' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: activeDepartmentTab === 'paint_hardware' ? '0 2px 8px rgba(229, 25, 55, 0.35)' : 'none',
                  }}
                >
                  <PaintBucket size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: activeDepartmentTab === 'paint_hardware' ? '#E51937' : tokens.colorNeutralForeground1 }}>
                      Paint, Hardware & Sanitary
                    </span>
                    {activeDepartmentTab === 'paint_hardware' && (
                      <CheckmarkCircle20Filled style={{ color: '#E51937', width: 18, height: 18 }} />
                    )}
                  </div>
                  <span style={{ display: 'block', fontSize: '11.5px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                    Brighto Paints, Baltian, Gallons, Tootian, Nalke, Kill Kable
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>



        <div className={styles.formGrid}>
          {/* Left Column: Form Details */}
          <div className={styles.cardSurface}>
            {/* Target Module & Category */}
            <div className={styles.twoColGrid}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Controller
                  control={productForm.control}
                  name="module"
                  render={({ field }) => (
                    <CustomSelect
                      label="Store Department"
                      required
                      value={field.value}
                      options={[
                        ...(hasFastFood ? [{ value: 'fastfood', label: 'Fast Food Restaurant Menu' }] : []),
                        ...(hasOmnimart ? [{ value: 'minimart', label: 'Retail Mini Mart' }] : []),
                      ]}
                      onChange={(val) => {
                        field.onChange(val as ModuleKey);
                        const matchedCat = categories.find((c) => c.module === val);
                        if (matchedCat) productForm.setValue('category', matchedCat.name);
                        // Default pricing type when switching modules
                        if (val === 'minimart') {
                          setPricingType('fixed');
                          productForm.setValue('pricingType', 'fixed');
                        } else {
                          setPricingType('fixed');
                          productForm.setValue('pricingType', 'fixed');
                        }
                      }}
                    />
                  )}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      categoryForm.reset({ name: '', module: watchedModule });
                      setIsCategoryDialogOpen(true);
                    }}
                    className={styles.newCategoryLink}
                  >
                    + New Category
                  </span>
                </div>
                <Controller
                  control={productForm.control}
                  name="category"
                  render={({ field }) => {
                    const activeGroupCats = categories.filter((c) => c.module === watchedModule);
                    const displayList = activeGroupCats.length > 0 ? activeGroupCats : categories;

                    return (
                      <CustomSelect
                        label={watchedModule === 'fastfood' ? 'Food Category' : 'Retail Category'}
                        required
                        placeholder="Select Category"
                        value={field.value}
                        options={displayList.map((c) => ({ value: c.name, label: c.name }))}
                        onChange={(val) => {
                          field.onChange(val);
                          // Auto-suggest retail pricing type based on chosen category
                          const catLower = val.toLowerCase();
                          if (catLower.includes('garment') || catLower.includes('cloth') || catLower.includes('kurta')) {
                            setPricingType('retail_garments');
                            productForm.setValue('pricingType', 'retail_garments');
                            rebuildVariantsFromGarmentSizes(garmentSizes);
                          } else if (catLower.includes('shoe') || catLower.includes('footwear')) {
                            setPricingType('retail_shoes');
                            productForm.setValue('pricingType', 'retail_shoes');
                            rebuildVariantsFromShoeSizes(shoeSizes);
                          }
                        }}
                        error={productForm.formState.errors.category?.message}
                      />
                    );
                  }}
                />
              </div>
            </div>

            {/* Product Name */}
            <div>
              <Controller
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <CustomInput
                    label="Product Name"
                    required
                    placeholder={watchedModule === 'fastfood' ? 'e.g. Crispy Zinger Burger / Tikka Pizza' : 'e.g. White Cotton Kurta / Leather Shoes / Whitening Cream / RC Toy Car'}
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={productForm.formState.errors.name?.message}
                  />
                )}
              />
            </div>

            {/* Description (Positioned directly under Product Name & Category per design) */}
            <div>
              <Controller
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <CustomInput
                    label="Description (Optional)"
                    placeholder="e.g. Pure wash-and-wear gents stitched kurta / Handmade leather shoes"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* ── Pricing Type Selector (Matching Reference Design) ── */}
            <div className={styles.pricingTypeSection}>
              <label className={styles.pricingTypeLabel}>
                Pricing Type <span style={{ color: '#E51937', fontWeight: 800 }}>*</span>
              </label>

              <div className={styles.pricingTypeRow}>
                {(activeDepartmentTab === 'paint_hardware'
                  ? PRICING_TYPES_PAINT_HARDWARE
                  : watchedModule === 'fastfood'
                  ? PRICING_TYPES_FASTFOOD
                  : PRICING_TYPES_MINIMART
                ).map((pt) => {
                  const Icon = pt.icon;
                  const isSelected = pricingType === pt.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handlePricingTypeSelect(pt.id)}
                      className={`${styles.pricingTypeBtn} ${isSelected ? styles.pricingTypeBtnActive : ''}`}
                    >
                      <Icon size={14} style={{ flexShrink: 0 }} />
                      <span>{pt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.pricingTypeDesc}>
                {(activeDepartmentTab === 'paint_hardware'
                  ? PRICING_TYPES_PAINT_HARDWARE
                  : watchedModule === 'fastfood'
                  ? PRICING_TYPES_FASTFOOD
                  : PRICING_TYPES_MINIMART
                ).find((p) => p.id === pricingType)?.desc}
              </div>

              {/* ── 1. Dedicated S / M / L / XL Pizza Size Pricing (Fast Food) ── */}
              {pricingType === 'smlxl' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: tokens.colorNeutralForeground1, marginBottom: '8px' }}>
                    Pizza Size Pricing (PKR)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Small (S)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="500"
                        value={pizzaSizes.small}
                        onChange={(e) => handlePizzaSizeChange('small', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Medium (M)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="950"
                        value={pizzaSizes.medium}
                        onChange={(e) => handlePizzaSizeChange('medium', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Large (L)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1300"
                        value={pizzaSizes.large}
                        onChange={(e) => handlePizzaSizeChange('large', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        X-Large (XL)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1850"
                        value={pizzaSizes.xlarge}
                        onChange={(e) => handlePizzaSizeChange('xlarge', e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '11.5px', color: tokens.colorNeutralForeground3, marginTop: '8px' }}>
                    Leave empty to exclude that size option
                  </div>
                </div>
              )}

              {/* ── 2. Dedicated Retail Garment Sizes: S, M, L, XL ── */}
              {pricingType === 'retail_garments' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shirt size={18} color="#E51937" />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Garment Sizes (S, M, L, XL)
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                          Enter pricing for stitched kurtas, suits, shirts, or trousers
                        </p>
                      </div>
                    </div>

                    {/* Quick Same Price tool */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                        Same price for all:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 2450"
                        value={bulkGarmentPrice}
                        onChange={(e) => setBulkGarmentPrice(e.target.value)}
                        style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkGarmentPrice) {
                            const updated = { s: bulkGarmentPrice, m: bulkGarmentPrice, l: bulkGarmentPrice, xl: bulkGarmentPrice };
                            setGarmentSizes(updated);
                            rebuildVariantsFromGarmentSizes(updated);
                          }
                        }}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#E51937', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Apply to All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size S (Small)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="2450"
                        value={garmentSizes.s}
                        onChange={(e) => handleGarmentSizeChange('s', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size M (Medium)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="2450"
                        value={garmentSizes.m}
                        onChange={(e) => handleGarmentSizeChange('m', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size L (Large)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="2450"
                        value={garmentSizes.l}
                        onChange={(e) => handleGarmentSizeChange('l', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size XL (Extra Large)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="2550"
                        value={garmentSizes.xl}
                        onChange={(e) => handleGarmentSizeChange('xl', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 3. Dedicated Retail Shoe Sizes: 40, 41, 42, 43, 44 ── */}
              {pricingType === 'retail_shoes' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Footprints size={18} color="#E51937" />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Footwear Sizes (40, 41, 42, 43, 44)
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                          Enter pricing for formal shoes, joggers, loafers, or chappals
                        </p>
                      </div>
                    </div>

                    {/* Quick Same Price tool */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                        Same price for all:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 4800"
                        value={bulkShoePrice}
                        onChange={(e) => setBulkShoePrice(e.target.value)}
                        style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkShoePrice) {
                            const updated = { s40: bulkShoePrice, s41: bulkShoePrice, s42: bulkShoePrice, s43: bulkShoePrice, s44: bulkShoePrice };
                            setShoeSizes(updated);
                            rebuildVariantsFromShoeSizes(updated);
                          }
                        }}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#E51937', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Apply to All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size 40
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="4800"
                        value={shoeSizes.s40}
                        onChange={(e) => handleShoeSizeChange('s40', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size 41
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="4800"
                        value={shoeSizes.s41}
                        onChange={(e) => handleShoeSizeChange('s41', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size 42
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="4800"
                        value={shoeSizes.s42}
                        onChange={(e) => handleShoeSizeChange('s42', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size 43
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="4800"
                        value={shoeSizes.s43}
                        onChange={(e) => handleShoeSizeChange('s43', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Size 44
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="4950"
                        value={shoeSizes.s44}
                        onChange={(e) => handleShoeSizeChange('s44', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4. Dedicated Retail Shades & Colors ── */}
              {pricingType === 'retail_shades' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Palette size={18} color="#E51937" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Color Shades (#01, #08, #14, #22)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter pricing for nail polish or lipstick shades
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        #01 Red
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="220"
                        value={shadeSizes.s01}
                        onChange={(e) => handleShadeSizeChange('s01', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        #08 Nude
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="220"
                        value={shadeSizes.s08}
                        onChange={(e) => handleShadeSizeChange('s08', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        #14 Maroon
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="220"
                        value={shadeSizes.s14}
                        onChange={(e) => handleShadeSizeChange('s14', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        #22 Gold
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="250"
                        value={shadeSizes.s22}
                        onChange={(e) => handleShadeSizeChange('s22', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 5. Dedicated Retail Volumes & Packs ── */}
              {pricingType === 'retail_volumes' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Package size={18} color="#E51937" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Pack & Bottle Volumes (125ml, 250ml, 400ml)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter pricing for lotion, shampoo, or powder sizes
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        125ml / 100g (Small)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="550"
                        value={volumeSizes.v1}
                        onChange={(e) => handleVolumeSizeChange('v1', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        250ml / 200g (Medium)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="850"
                        value={volumeSizes.v2}
                        onChange={(e) => handleVolumeSizeChange('v2', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        400ml / Family Pack (Large)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1250"
                        value={volumeSizes.v3}
                        onChange={(e) => handleVolumeSizeChange('v3', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6. Dedicated Paint Packing & Shade Setup ── */}
              {pricingType === 'paint_packs' && (
                <div style={{ marginTop: '16px', padding: '16px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PaintBucket size={20} color="#E51937" />
                      <div>
                        <span style={{ fontSize: '13.5px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Paint Packing Sizes & Shade Setup
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                          Quarter (1L), Gallon (4L), Balti / Drum (14-16L) with color code & painter coupon
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(229, 25, 55, 0.1)', color: '#E51937' }}>
                      Brighto / Paint Model
                    </span>
                  </div>

                  {/* Shade Code & Painter Token Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground1 }}>
                        Color / Shade Code (e.g. 4550, 3025)
                      </label>
                      <CustomInput
                        type="text"
                        placeholder="e.g. 4550 or 3025"
                        value={paintShadeCode}
                        onChange={(e) => handlePaintShadeCodeChange(e.target.value)}
                      />
                      <span style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3, marginTop: '2px', display: 'block' }}>
                        Counter cashier can search directly by this code
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground1 }}>
                        Painter Token / Coupon Value (PKR)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="e.g. 500 (inside bucket/gallon)"
                        value={painterTokenAmount}
                        onChange={(e) => setPainterTokenAmount(e.target.value)}
                      />
                      <span style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3, marginTop: '2px', display: 'block' }}>
                        Optional coupon inside balti for painter loyalty cashback
                      </span>
                    </div>
                  </div>

                  {/* 3 Packing Size Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {/* Quarter Card */}
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Quarter (approx 1 Litre)
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: tokens.colorNeutralForeground3 }}>0.91L - 1.0L</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: tokens.colorNeutralForeground2 }}>
                            Sale Price (PKR)
                          </label>
                          <CustomInput
                            type="number"
                            placeholder="e.g. 950"
                            value={paintSizes.quarter}
                            onChange={(e) => handlePaintSizeChange('quarter', e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: tokens.colorNeutralForeground3 }}>
                            Cost / Khareed Rate (PKR)
                          </label>
                          <CustomInput
                            type="number"
                            placeholder="e.g. 800"
                            value={paintCostPrices.quarter}
                            onChange={(e) => handlePaintCostChange('quarter', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gallon Card */}
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Gallon (approx 4 Litres)
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: tokens.colorNeutralForeground3 }}>3.64L - 4.0L</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: tokens.colorNeutralForeground2 }}>
                            Sale Price (PKR)
                          </label>
                          <CustomInput
                            type="number"
                            placeholder="e.g. 3300"
                            value={paintSizes.gallon}
                            onChange={(e) => handlePaintSizeChange('gallon', e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: tokens.colorNeutralForeground3 }}>
                            Cost / Khareed Rate (PKR)
                          </label>
                          <CustomInput
                            type="number"
                            placeholder="e.g. 2800"
                            value={paintCostPrices.gallon}
                            onChange={(e) => handlePaintCostChange('gallon', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Balti / Drum Card */}
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#E51937' }}>
                          Balti / Drum (14 - 16 Litres)
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#E51937' }}>Bucket / Balti</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: tokens.colorNeutralForeground2 }}>
                            Sale Price (PKR)
                          </label>
                          <CustomInput
                            type="number"
                            placeholder="e.g. 11200"
                            value={paintSizes.balti}
                            onChange={(e) => handlePaintSizeChange('balti', e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: tokens.colorNeutralForeground3 }}>
                            Cost / Khareed Rate (PKR)
                          </label>
                          <CustomInput
                            type="number"
                            placeholder="e.g. 9500"
                            value={paintCostPrices.balti}
                            onChange={(e) => handlePaintCostChange('balti', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 7. Dedicated Sanitary Taps Pricing ── */}
              {pricingType === 'sanitary_fittings' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Wrench size={18} color="#E51937" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Sanitary & Taps Pricing (Tootian / Nalke)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Bib Cock, Pillar Cock, Wall Mixer, Muslim Shower
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Bib Cock (Tooti)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1450"
                        value={sanitarySizes.bibCock}
                        onChange={(e) => handleSanitarySizeChange('bibCock', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Pillar Cock (Basin)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1850"
                        value={sanitarySizes.pillarCock}
                        onChange={(e) => handleSanitarySizeChange('pillarCock', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Wall Mixer
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="4800"
                        value={sanitarySizes.wallMixer}
                        onChange={(e) => handleSanitarySizeChange('wallMixer', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Muslim Shower Set
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1250"
                        value={sanitarySizes.muslimShower}
                        onChange={(e) => handleSanitarySizeChange('muslimShower', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 8. Dedicated Hardware Fasteners Pricing ── */}
              {pricingType === 'hardware_fasteners' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Hammer size={18} color="#E51937" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Hardware Fasteners (Kill / Kable / Screws)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Sell by weight (0.5 KG, 1 KG) or by packaging (Packet, Box)
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        0.5 KG (Aadha Kilo)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="180"
                        value={hardwareSizes.halfKg}
                        onChange={(e) => handleHardwareSizeChange('halfKg', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        1.0 KG (Ek Kilo)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="350"
                        value={hardwareSizes.oneKg}
                        onChange={(e) => handleHardwareSizeChange('oneKg', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Packet (Small Pack)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="120"
                        value={hardwareSizes.packet}
                        onChange={(e) => handleHardwareSizeChange('packet', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Box (Wholesale Dabba)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1100"
                        value={hardwareSizes.box}
                        onChange={(e) => handleHardwareSizeChange('box', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Half / Full Portion Size Pricing */}
              {pricingType === 'halffull' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: tokens.colorNeutralForeground1, marginBottom: '8px' }}>
                    Portion Size Pricing (PKR)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Half Portion
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="600"
                        value={portionSizes.half}
                        onChange={(e) => handlePortionSizeChange('half', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Full Portion
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1100"
                        value={portionSizes.full}
                        onChange={(e) => handlePortionSizeChange('full', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Cold Drink Sizes (Can, 500ml, 1L, 1.5L) */}
              {pricingType === 'drinks' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: tokens.colorNeutralForeground1, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🥤 Cold Drink Size Pricing (PKR)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Tin Pack (Can 250ml)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="120"
                        value={drinkSizes.can}
                        onChange={(e) => handleDrinkSizeChange('can', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Half Liter (500ml)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="150"
                        value={drinkSizes.halfLiter}
                        onChange={(e) => handleDrinkSizeChange('halfLiter', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        1.0 Liter
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="220"
                        value={drinkSizes.oneLiter}
                        onChange={(e) => handleDrinkSizeChange('oneLiter', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        1.5 Liter (Jumbo)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="280"
                        value={drinkSizes.onePointFive}
                        onChange={(e) => handleDrinkSizeChange('onePointFive', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Mineral Water Sizes (Small, Large) */}
              {pricingType === 'water' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: tokens.colorNeutralForeground1, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💧 Mineral Water Size Pricing (PKR)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Small Bottle (500ml)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="60"
                        value={waterSizes.small}
                        onChange={(e) => handleWaterSizeChange('small', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: tokens.colorNeutralForeground2 }}>
                        Large Bottle (1.5L)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="120"
                        value={waterSizes.large}
                        onChange={(e) => handleWaterSizeChange('large', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Single Price Mode (Fixed, Per Piece, Weighed) */}
            {pricingType !== 'smlxl' && pricingType !== 'halffull' && pricingType !== 'drinks' && pricingType !== 'water' && pricingType !== 'retail_garments' && pricingType !== 'retail_shoes' && pricingType !== 'retail_shades' && pricingType !== 'retail_volumes' && pricingType !== 'custom' && (
              <>
                <div className={styles.threeColGrid}>
                  <div>
                    <Controller
                      control={productForm.control}
                      name="price"
                      render={({ field }) => (
                        <CustomInput
                          label={pricingType === 'perkg' || pricingType === 'amountse' ? 'Rate per 1 KG (PKR)' : 'Selling Price (PKR)'}
                          required
                          type="number"
                          placeholder={pricingType === 'perkg' || pricingType === 'amountse' ? 'e.g. 600' : 'e.g. 550'}
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          error={productForm.formState.errors.price?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={productForm.control}
                      name="costPrice"
                      render={({ field }) => (
                        <CustomInput
                          label={pricingType === 'perkg' || pricingType === 'amountse' ? 'Cost Price per KG (PKR)' : 'Cost Price (PKR - Optional)'}
                          type="number"
                          placeholder={pricingType === 'perkg' || pricingType === 'amountse' ? 'e.g. 450' : 'e.g. 380'}
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          error={productForm.formState.errors.costPrice?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={productForm.control}
                      name="openingStock"
                      render={({ field }) => (
                        <CustomInput
                          label={pricingType === 'perkg' || pricingType === 'amountse' ? 'Stock Weight (KG / Grams)' : 'Stock Quantity (Pieces / Units)'}
                          type="number"
                          placeholder="e.g. 50"
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          error={productForm.formState.errors.openingStock?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Helpful Banner for Rupees Budget Calculation Mode */}
                {(pricingType === 'perkg' || pricingType === 'amountse') && (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(229, 25, 55, 0.08)',
                      border: '1px solid rgba(229, 25, 55, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12.5px',
                      color: tokens.colorNeutralForeground1,
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>⚖️</span>
                    <div>
                      <b style={{ color: '#E51937' }}>Rupees Sale (Budget Mode Active):</b> Cashier can enter exact Rupee amount (e.g. Rs 50 or Rs 100) on the POS Counter card, and the system will automatically calculate the weight.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Optional Cost Price & Opening Stock for Multi-Size/Portion Products */}
            {(pricingType === 'smlxl' || pricingType === 'halffull' || pricingType === 'drinks' || pricingType === 'water' || pricingType === 'retail_garments' || pricingType === 'retail_shoes' || pricingType === 'retail_shades' || pricingType === 'retail_volumes') && (
              <div className={styles.twoColGrid}>
                <div>
                  <Controller
                    control={productForm.control}
                    name="costPrice"
                    render={({ field }) => (
                      <CustomInput
                        label="Estimated Cost Price (PKR - Optional)"
                        type="number"
                        placeholder="e.g. 1600"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        error={productForm.formState.errors.costPrice?.message}
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    control={productForm.control}
                    name="openingStock"
                    render={({ field }) => (
                      <CustomInput
                        label="Total Opening Stock Quantity"
                        type="number"
                        placeholder="e.g. 50"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        error={productForm.formState.errors.openingStock?.message}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {/* Unit & Barcode / SKU */}
            <div className={styles.threeColGrid}>
              <div>
                <Controller
                  control={productForm.control}
                  name="unit"
                  render={({ field }) => (
                    <CustomSelect
                      label="Measurement Unit"
                      value={field.value || 'PCS'}
                      options={UNIT_OPTIONS}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              </div>

              <div>
                {watchedModule === 'fastfood' ? (
                  <Controller
                    control={productForm.control}
                    name="prepTime"
                    render={({ field }) => (
                      <CustomInput
                        label="Kitchen Prep Time (Minutes)"
                        type="number"
                        placeholder="e.g. 15"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    control={productForm.control}
                    name="skuCode"
                    render={({ field }) => (
                      <CustomInput
                        label="Barcode / SKU"
                        placeholder="Scan barcode or click Auto"
                        value={field.value || ''}
                        onChange={field.onChange}
                        rightElement={
                          <button
                            type="button"
                            onClick={() => productForm.setValue('skuCode', generateRandomSku())}
                            title="Generate automatic random barcode"
                            className={styles.linkBtn}
                            style={{ fontWeight: 800, color: '#E51937' }}
                          >
                            ⚡ Auto Barcode
                          </button>
                        }
                      />
                    )}
                  />
                )}
              </div>

              <div>
                {watchedModule === 'fastfood' ? (
                  <Controller
                    control={productForm.control}
                    name="minThreshold"
                    render={({ field }) => (
                      <CustomInput
                        label="Low Stock Alert Threshold"
                        type="number"
                        placeholder="e.g. 10"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? 10 : Number(e.target.value))}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    control={productForm.control}
                    name="rackLocation"
                    render={({ field }) => (
                      <CustomInput
                        label="Store Shelf / Rack Location"
                        placeholder="e.g. Aisle 3, Shelf B"
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                )}
              </div>
            </div>

            {/* Quick Unit Presets Bar */}
            {(() => {
              const unitsToDisplay = (pricingType === 'perkg' || pricingType === 'amountse')
                ? ['KG', 'Gram', 'Liter', 'ML', 'PACK']
                : profileConfig.suggestedUnits;

              if (unitsToDisplay.length === 0) return null;

              return (
                <div className={styles.presetsBar}>
                  <div className={styles.presetsTitle}>
                    Quick Unit Presets:
                  </div>
                  <div className={styles.presetsWrap}>
                    {unitsToDisplay.map((u) => {
                      const isSelected = watchedUnit === u;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => productForm.setValue('unit', u)}
                          className={styles.presetChip}
                          style={{
                            fontWeight: isSelected ? 800 : 600,
                            border: isSelected ? `1.5px solid ${profileConfig.accentColor}` : `1px solid ${tokens.colorNeutralStroke1}`,
                            backgroundColor: isSelected ? `${profileConfig.accentColor}25` : tokens.colorNeutralBackground1,
                            color: isSelected ? profileConfig.accentColor : tokens.colorNeutralForeground2,
                          }}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Custom Product Variants & Size Matrix Section (Only when Custom Variants is selected) ── */}
            {pricingType === 'custom' && (
              <div
                className={styles.variantSectionBox}
                style={{
                  border: `1px solid ${hasVariants || profileConfig.suggestedSizes.length > 0 ? `${profileConfig.accentColor}44` : tokens.colorNeutralStroke1}`,
                  backgroundColor: hasVariants || profileConfig.suggestedSizes.length > 0 ? `${profileConfig.accentColor}08` : tokens.colorNeutralBackground3,
                }}
              >
                <div className={styles.variantHeaderRow}>
                  <div className={styles.variantHeaderLeft}>
                    <span
                      className={styles.variantProfileTag}
                      style={{
                        backgroundColor: `${profileConfig.accentColor}22`,
                        color: profileConfig.accentColor,
                        border: `1px solid ${profileConfig.accentColor}44`,
                      }}
                    >
                      {profileConfig.shortTag}
                    </span>
                    <Label className={styles.variantHeaderLabel}>
                      Custom Product Variants & Sizes
                    </Label>
                  </div>

                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Add20Regular />}
                    onClick={handleAddCustomVariant}
                    className={styles.variantCustomBtn}
                    style={{ color: profileConfig.accentColor }}
                  >
                    + Custom Variant
                  </Button>
                </div>

                {/* Size Suggestion Chips */}
                {profileConfig.suggestedSizes.length > 0 && (
                  <div>
                    <Caption1 className={styles.variantChipsCaption}>
                      Click sizes to add to inventory matrix:
                    </Caption1>
                    <div className={styles.variantChipsWrap}>
                      {profileConfig.suggestedSizes.map((size) => {
                        const isSelected = variants.some((v) => v.label.toLowerCase() === size.toLowerCase());
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleToggleSize(size)}
                            className={styles.variantChipBtn}
                            style={{
                              border: isSelected ? `2px solid ${profileConfig.accentColor}` : `1px solid ${tokens.colorNeutralStroke1}`,
                              backgroundColor: isSelected ? `${profileConfig.accentColor}22` : tokens.colorNeutralBackground1,
                              color: isSelected ? profileConfig.accentColor : tokens.colorNeutralForeground1,
                              fontWeight: isSelected ? 800 : 600,
                            }}
                          >
                            <span>{size}</span>
                            {isSelected && <span>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Variants Matrix Table */}
                {variants.length > 0 && (
                  <div className={styles.variantTableContainer}>
                    <div className={styles.variantTableHeaderRow}>
                      <Caption1 className={styles.variantTableCaption}>
                        Configured Variants ({variants.length}) — Total Variant Stock:{' '}
                        <strong style={{ color: tokens.colorNeutralForeground1 }}>
                          {variants.reduce((sum, v) => sum + (v.stock || 0), 0)} {watchedUnit || 'PCS'}
                        </strong>
                      </Caption1>
                    </div>

                    {/* Table Column Headers */}
                    <div className={styles.variantColumnHeaderRow}>
                      <span>Portion / Size</span>
                      <span>Stock Qty</span>
                      <span>Price (PKR)</span>
                      <span>SKU / Barcode</span>
                      <span></span>
                    </div>

                    <div className={styles.variantRowsList}>
                      {variants.map((v) => {
                        const displayPrice =
                          v.price !== undefined
                            ? v.price
                            : v.priceDelta !== undefined && v.priceDelta !== 0
                            ? (watchedPrice || 0) + v.priceDelta
                            : (watchedPrice || undefined);

                        return (
                          <div key={v.id} className={styles.variantRowItem}>
                            <div className={styles.variantRowLabel} style={{ color: profileConfig.accentColor }}>
                              {v.label}
                            </div>

                            <div>
                              <CustomInput
                                type="number"
                                placeholder="Stock"
                                value={v.stock !== undefined ? String(v.stock) : ''}
                                onChange={(e) =>
                                  handleUpdateVariant(v.id, { stock: e.target.value === '' ? 0 : Number(e.target.value) })
                                }
                              />
                            </div>

                            <div>
                              <CustomInput
                                type="number"
                                placeholder={watchedPrice ? `Rs. ${watchedPrice}` : 'Price (PKR)'}
                                value={displayPrice !== undefined ? String(displayPrice) : ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                                  const pDelta = val !== undefined ? val - (watchedPrice || 0) : 0;
                                  handleUpdateVariant(v.id, { price: val, priceDelta: pDelta });
                                }}
                              />
                            </div>

                            <div>
                              <CustomInput
                                placeholder="SKU / Barcode"
                                value={v.skuCode || ''}
                                onChange={(e) => handleUpdateVariant(v.id, { skuCode: e.target.value })}
                              />
                            </div>

                            <Button
                              size="small"
                              appearance="subtle"
                              className={styles.variantDeleteBtn}
                              icon={<Delete20Regular />}
                              onClick={() => handleRemoveVariant(v.id)}
                              title={`Remove ${v.label}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Image Upload & Live POS Card Preview */}
          <div className={styles.cardSurfaceRight}>
            <div>
              <div className={styles.mediaHeaderTitle}>
                Product Image
              </div>
              <Caption1 className={styles.mediaHeaderSubtitle}>
                Upload a photo or paste an image URL
              </Caption1>

              {/* Image Uploader */}
              <div className={styles.imageDropzone} onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageSelect}
                  style={{ display: 'none' }}
                />
                <Image20Regular className={styles.imageDropzoneIcon} />
                <div className={styles.imageDropzoneText}>
                  Click to upload local image
                </div>
                <Caption1 className={styles.imageDropzoneCaption}>
                  PNG, JPG, WebP up to 5MB
                </Caption1>
              </div>

              {/* Web URL input */}
              <div className={styles.urlInputContainer}>
                <Controller
                  control={productForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <CustomInput
                      label="Or paste web image URL..."
                      placeholder="https://..."
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setImagePreview(e.target.value || null);
                      }}
                    />
                  )}
                />
              </div>
            </div>

            {/* Live POS Preview Card (6:4 Exact Proportion) */}
            <div className={styles.previewSection}>
              <div className={styles.previewTitle}>
                Live POS Card Preview
              </div>
              <div className={styles.previewCard}>
                {/* 6 Parts Image (114px) */}
                <div className={styles.previewImageWrap}>
                  {imagePreview || productForm.watch('imageUrl') ? (
                    <img
                      src={imagePreview || productForm.watch('imageUrl')}
                      alt="Preview"
                      className={styles.previewImg}
                    />
                  ) : (
                    <div className={styles.previewNoPhotoBox}>
                      <Image20Regular style={{ width: 28, height: 28 }} />
                      <span style={{ fontSize: '11px' }}>No photo</span>
                    </div>
                  )}
                  <div className={styles.previewBadge}>
                    {variants.length > 0
                      ? `${variants.reduce((sum, v) => sum + (v.stock || 0), 0)} left`
                      : `${watchedStock ?? 50} left`}
                  </div>
                </div>

                {/* 4 Parts Details (90px) */}
                <div className={styles.previewDetailsWrap} style={{ height: 'auto', minHeight: '80px', padding: '8px 10px' }}>
                  <div>
                    <div className={styles.previewProductTitle}>
                      {watchedName || 'Product Title'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                      {productForm.watch('description') || watchedCategory || 'Item description'}
                    </div>

                    {/* Segmented Size Badges */}
                    {variants.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(variants.length, 4)}, 1fr)`, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: '4px', overflow: 'hidden', marginTop: '5px' }}>
                        {variants.slice(0, 4).map((v, idx) => (
                          <div
                            key={v.id}
                            style={{
                              padding: '2px 1px',
                              textAlign: 'center',
                              backgroundColor: idx === 0 ? '#E51937' : 'transparent',
                              color: idx === 0 ? '#FFFFFF' : tokens.colorNeutralForeground3,
                              fontSize: '8.5px',
                              fontWeight: 700,
                              lineHeight: 1.1,
                            }}
                          >
                            <div>{v.label}</div>
                            <div style={{ fontSize: '7.5px', opacity: 0.85 }}>{v.price ? v.price : '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rupees / Amount Quick Strip Preview for Weighed Items */}
                    {variants.length === 0 && (pricingType === 'perkg' || pricingType === 'amountse') && (
                      <div style={{ marginTop: '5px', padding: '4px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px', border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                          {[50, 100, 250].map((rs) => (
                            <div key={rs} style={{ textAlign: 'center', padding: '1px 0', fontSize: '7.5px', fontWeight: 700, color: '#E51937', backgroundColor: 'rgba(229, 25, 55, 0.1)', borderRadius: '2px' }}>
                              Rs.{rs}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '3px' }}>
                          <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#E51937' }}>Rs.</span>
                          <div style={{ flex: 1, height: '14px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', fontSize: '7.5px', padding: '0 3px', display: 'flex', alignItems: 'center', color: tokens.colorNeutralForeground3 }}>
                            70
                          </div>
                          <div style={{ backgroundColor: '#E51937', color: '#fff', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '2px' }}>
                            + 117g
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.previewBottomRow} style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'baseline' }}>
                      <span>{watchedPrice ? `${watchedPrice.toLocaleString()} PKR` : '600 PKR'}</span>
                      {(pricingType === 'perkg' || pricingType === 'amountse') && (
                        <span style={{ fontSize: '9px', fontWeight: 600, color: tokens.colorNeutralForeground3, marginLeft: '2px' }}>
                          / {watchedUnit || 'KG'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#E51937',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'default',
                      }}
                    >
                      🛒 Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Catalog Pro Tip */}
            <div className={styles.proTipBox}>
              <div className={styles.proTipTitle}>
                POS Display Pro Tip
              </div>
              <Caption1 className={styles.proTipCaption}>
                Product cards follow 6:4 visual ratio (60% image, 40% details) for touch accuracy and barcode scanning readability on all POS registers.
              </Caption1>
            </div>
          </div>
        </div>
      </form>

      {/* ── Quick Category Modal ───────────────────────────────── */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(_, d) => setIsCategoryDialogOpen(d.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <form
            onSubmit={categoryForm.handleSubmit((d) => createCategoryMutation.mutate(d))}
            className={styles.dialogForm}
          >
            {/* Modal Header */}
            <div className={styles.dialogHeader}>
              <div className={styles.dialogHeaderLeft}>
                <div className={styles.dialogIconBox}>
                  <Tag20Regular style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div className={styles.dialogTitleText}>Create New Category</div>
                  <div className={styles.dialogSubtitleText}>Add quick classification to catalog</div>
                </div>
              </div>

              <Button
                size="small"
                appearance="subtle"
                icon={<Dismiss16Regular />}
                onClick={() => setIsCategoryDialogOpen(false)}
                type="button"
              />
            </div>

            {/* Form Fields */}
            <div className={styles.dialogFieldsContainer}>
              <Controller
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <CustomInput
                    label="Category Name"
                    required
                    placeholder="e.g. Burgers, Dairy, Shirts, Shoes..."
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={categoryForm.formState.errors.name?.message}
                  />
                )}
              />

              <Controller
                control={categoryForm.control}
                name="module"
                render={({ field }) => (
                  <CustomSelect
                    label="Target Store Module"
                    required
                    value={field.value}
                    options={[
                      ...(hasFastFood ? [{ value: 'fastfood', label: 'Fast Food Menu' }] : []),
                      ...(hasOmnimart ? [{ value: 'minimart', label: 'Omnimart Supermarket' }] : []),
                    ]}
                    onChange={(val) => field.onChange(val as ModuleKey)}
                  />
                )}
              />
            </div>

            {/* Modal Actions */}
            <div className={styles.dialogActionsRow}>
              <Button
                appearance="subtle"
                type="button"
                onClick={() => setIsCategoryDialogOpen(false)}
                className={styles.dialogCancelBtn}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={createCategoryMutation.isPending}
                className={styles.dialogSaveBtn}
              >
                {createCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
              </Button>
            </div>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
