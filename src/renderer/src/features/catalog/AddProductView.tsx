import React, { useState, useEffect, useMemo } from 'react';
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
  mergeClasses,
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
  DrinkToGo20Regular,
  Drop20Regular,
  Scales20Regular,
  Flash20Regular,
  Checkmark16Filled,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Product, Category, ModuleKey, ProductVariant } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import {
  CATEGORY_PROFILES,
  detectCategoryProfile,
  SHOE_SIZE_PRESETS,
  getShoePresetForCategory,
  getAvailableShoePresetsForCategory,
  ShoeSizePreset,
  getItemTypesForCategory,
  ItemTypeOption,
  isSanitaryCategory,
} from '@/lib/categoryProfiles';
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
  Scale,
  Coins,
  Wrench,
  Zap,
  HeartPulse,
  Smartphone,
  Cake,
  Ruler,
  Boxes,
} from 'lucide-react';
import { setLocalVariantRegistry } from '@/lib/variants';
import { CategoryProfile } from '@/lib/types';

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

export interface PricingTypeItem {
  id: string;
  label: string;
  icon: any;
  desc: string;
  suggestedUnit: string;
  defaultSizes: string[];
}

export const PRICING_TYPE_FIXED: PricingTypeItem = {
  id: 'fixed',
  label: 'Fixed Price',
  icon: Tag,
  desc: 'Single flat price (General items, packaged goods, accessories)',
  suggestedUnit: 'PCS',
  defaultSizes: [],
};

export const PRICING_TYPE_SHOES: PricingTypeItem = {
  id: 'retail_shoes',
  label: 'Footwear Sizes (Article Sizes)',
  icon: Footprints,
  desc: 'Footwear sizes (Baby 0-5, Kids 6-11, Youth 31-36, Mens 39-45, Ladies 36-41). All sizes share the same article price.',
  suggestedUnit: 'PAIR',
  defaultSizes: ['39', '40', '41', '42', '43', '44'],
};

export const PRICING_TYPE_GARMENTS: PricingTypeItem = {
  id: 'retail_garments',
  label: 'Clothing / Garments (XS - 3XL)',
  icon: Shirt,
  desc: 'Kurtas, shirts, trousers, apparel (XS, S, M, L, XL, XXL, 3XL)',
  suggestedUnit: 'PCS',
  defaultSizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
};

export const PRICING_TYPE_FABRIC: PricingTypeItem = {
  id: 'retail_fabric',
  label: 'Fabric & Unstitched (Meters / Suits)',
  icon: Ruler,
  desc: 'Unstitched fabric and cloth sold per meter, gaz or suit length',
  suggestedUnit: 'METER',
  defaultSizes: ['1 Meter', '2.5 Meter', '4 Meter (Suit)'],
};

export const PRICING_TYPE_SANITARY_SIZES: PricingTypeItem = {
  id: 'retail_sanitary_sizes',
  label: 'Pipe & Fitting Sizes (1/2" - 4")',
  icon: Droplets,
  desc: 'PPRC, UPVC & CPVC pipes, elbows, tees, sockets, unions & valve diameters (1/2" to 4")',
  suggestedUnit: 'PCS',
  defaultSizes: ['1/2" (20mm)', '3/4" (25mm)', '1" (32mm)', '1.25" (40mm)', '1.5" (50mm)', '2" (63mm)', '3" (90mm)', '4" (110mm)'],
};

export const PRICING_TYPE_PIPE_LENGTHS: PricingTypeItem = {
  id: 'retail_pipe_lengths',
  label: 'Pipe Lengths (Per Foot / 10ft / 13ft)',
  icon: Ruler,
  desc: 'Pipes sold per running foot or standard full length (1 FT, 10 FT, 13 FT standard, 20 FT)',
  suggestedUnit: 'FEET',
  defaultSizes: ['Per Foot (1 FT)', '10 Feet Length', '13 Feet Length', '20 Feet Length'],
};

export const PRICING_TYPE_BATH_SET: PricingTypeItem = {
  id: 'retail_bath_sets',
  label: 'Showers & Taps Sets (Single vs Set)',
  icon: Sparkles,
  desc: 'Bathroom bib cocks, totyan, muslim shower, wall mixer and complete vanity sets',
  suggestedUnit: 'PCS',
  defaultSizes: ['Single Piece (Toti)', 'Muslim Shower Only', 'Shower Head & Arm', 'Complete Bath Set'],
};

export const PRICING_TYPE_PAINT: PricingTypeItem = {
  id: 'retail_paint',
  label: 'Paint Containers (Quarter, Gallon, Balti)',
  icon: Wrench,
  desc: 'Paint tins and coatings (Quarter 1L, Gallon 4L, Balti 16L)',
  suggestedUnit: 'GALLON',
  defaultSizes: ['Quarter (1L)', 'Gallon (4L)', 'Balti (16L)'],
};

export const PRICING_TYPE_WIRE: PricingTypeItem = {
  id: 'retail_wire',
  label: 'Wire Gauge & Lengths (1.5mm - 7/36)',
  icon: Zap,
  desc: 'Electrical wires and cables (1.5mm, 2.5mm, 7/29, 7/36, Coil 90m)',
  suggestedUnit: 'METER',
  defaultSizes: ['1.5mm', '2.5mm', '7/29', '7/36', 'Coil (90m)'],
};

export const PRICING_TYPE_WATTAGE: PricingTypeItem = {
  id: 'retail_wattage',
  label: 'LED Wattage Variants (5W - 24W)',
  icon: Zap,
  desc: 'LED bulbs, spot lights and panel wattages (5W, 12W, 18W, 24W)',
  suggestedUnit: 'PCS',
  defaultSizes: ['5W', '12W', '18W', '24W'],
};

export const PRICING_TYPE_SHADES: PricingTypeItem = {
  id: 'retail_shades',
  label: 'Colors & Shades',
  icon: Palette,
  desc: 'Cosmetics, lipsticks, nail colors, shades (#01, #08, #14, #22)',
  suggestedUnit: 'PCS',
  defaultSizes: ['#01 Red', '#08 Nude', '#14 Maroon', '#22 Gold'],
};

export const PRICING_TYPE_VOLUMES: PricingTypeItem = {
  id: 'retail_volumes',
  label: 'Packs / Volumes',
  icon: Package,
  desc: 'Lotions, shampoos, bottle sizes (125ml, 250ml, 400ml)',
  suggestedUnit: 'PCS',
  defaultSizes: ['125ml', '250ml', '400ml'],
};

export const PRICING_TYPE_PHARMA_STRIP: PricingTypeItem = {
  id: 'retail_pharma_strip',
  label: 'Strip & Box (Strip / Box)',
  icon: HeartPulse,
  desc: 'Medicine dispensing by strip (10 tablets) and box (100 tablets)',
  suggestedUnit: 'STRIP',
  defaultSizes: ['Strip (10 Tablets)', 'Box (100 Tablets)'],
};

export const PRICING_TYPE_PHARMA_SYRUP: PricingTypeItem = {
  id: 'retail_pharma_syrup',
  label: 'Syrup Volumes (60ml / 120ml)',
  icon: Package,
  desc: 'Liquid suspensions and syrups (60ml, 120ml)',
  suggestedUnit: 'BOTTLE',
  defaultSizes: ['60ml', '120ml'],
};

export const PRICING_TYPE_STORAGE: PricingTypeItem = {
  id: 'retail_storage',
  label: 'Storage Variants (64GB - 512GB)',
  icon: Smartphone,
  desc: 'Mobile and tablet storage variations (64GB, 128GB, 256GB, 512GB)',
  suggestedUnit: 'PCS',
  defaultSizes: ['64GB', '128GB', '256GB', '512GB'],
};

export const PRICING_TYPE_BAKERY_BOX: PricingTypeItem = {
  id: 'retail_bakery',
  label: 'Traditional Sweets Box (250g - 2 KG)',
  icon: Cake,
  desc: 'Mithai and fresh confectionery packing boxes (250g, 500g, 1 KG, 2 KG)',
  suggestedUnit: 'KG',
  defaultSizes: ['250g', '500g', '1 KG', '2 KG'],
};

export const PRICING_TYPE_PACKS: PricingTypeItem = {
  id: 'retail_packs',
  label: 'Packs & Cartons (Single vs Box)',
  icon: Boxes,
  desc: 'FMCG goods sold individually or wholesale carton',
  suggestedUnit: 'PACK',
  defaultSizes: ['Single Piece', 'Carton / Box'],
};

export const PRICING_TYPE_PERKG: PricingTypeItem = {
  id: 'perkg',
  label: 'Loose / Weighed (Per KG)',
  icon: Scale,
  desc: 'Loose grocery, items sold by weight (Per KG / Grams)',
  suggestedUnit: 'KG',
  defaultSizes: ['250g', '500g', '1 KG'],
};

export const PRICING_TYPE_CUSTOM: PricingTypeItem = {
  id: 'custom',
  label: 'Custom Sizes',
  icon: SlidersHorizontal,
  desc: 'Add custom sizes or custom product variations',
  suggestedUnit: 'PCS',
  defaultSizes: [],
};

export const ALL_RETAIL_PRICING_TYPES: PricingTypeItem[] = [
  PRICING_TYPE_FIXED,
  PRICING_TYPE_SANITARY_SIZES,
  PRICING_TYPE_PIPE_LENGTHS,
  PRICING_TYPE_BATH_SET,
  PRICING_TYPE_SHOES,
  PRICING_TYPE_GARMENTS,
  PRICING_TYPE_PAINT,
  PRICING_TYPE_WIRE,
  PRICING_TYPE_WATTAGE,
  PRICING_TYPE_SHADES,
  PRICING_TYPE_VOLUMES,
  PRICING_TYPE_PHARMA_STRIP,
  PRICING_TYPE_PHARMA_SYRUP,
  PRICING_TYPE_STORAGE,
  PRICING_TYPE_BAKERY_BOX,
  PRICING_TYPE_PACKS,
  PRICING_TYPE_PERKG,
  PRICING_TYPE_CUSTOM,
];

export function getPricingTypesForProfile(profile: CategoryProfile, categoryName?: string, showAll: boolean = false): PricingTypeItem[] {
  if (showAll) return ALL_RETAIL_PRICING_TYPES;

  switch (profile) {
    case 'footwear':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_SHOES, PRICING_TYPE_CUSTOM];
    case 'apparel':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_GARMENTS, PRICING_TYPE_FABRIC, PRICING_TYPE_CUSTOM];
    case 'hardware':
      if (isSanitaryCategory(categoryName || '')) {
        return [
          PRICING_TYPE_FIXED,
          PRICING_TYPE_SANITARY_SIZES,
          PRICING_TYPE_PIPE_LENGTHS,
          PRICING_TYPE_BATH_SET,
          PRICING_TYPE_CUSTOM,
        ];
      }
      if (/paint|distemper|color|coating|thinner|varnish/i.test(categoryName || '')) {
        return [PRICING_TYPE_FIXED, PRICING_TYPE_PAINT, PRICING_TYPE_PERKG, PRICING_TYPE_CUSTOM];
      }
      return [
        PRICING_TYPE_FIXED,
        PRICING_TYPE_SANITARY_SIZES,
        PRICING_TYPE_PIPE_LENGTHS,
        PRICING_TYPE_BATH_SET,
        PRICING_TYPE_PAINT,
        PRICING_TYPE_PERKG,
        PRICING_TYPE_CUSTOM,
      ];
    case 'electric':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_WIRE, PRICING_TYPE_WATTAGE, PRICING_TYPE_CUSTOM];
    case 'grocery':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_PERKG, PRICING_TYPE_PACKS, PRICING_TYPE_CUSTOM];
    case 'cosmetics':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_SHADES, PRICING_TYPE_VOLUMES, PRICING_TYPE_CUSTOM];
    case 'pharmacy':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_PHARMA_STRIP, PRICING_TYPE_PHARMA_SYRUP, PRICING_TYPE_CUSTOM];
    case 'electronics':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_STORAGE, PRICING_TYPE_CUSTOM];
    case 'bakery':
      return [PRICING_TYPE_FIXED, PRICING_TYPE_BAKERY_BOX, PRICING_TYPE_PERKG, PRICING_TYPE_CUSTOM];
    case 'food':
      return PRICING_TYPES_FASTFOOD as any;
    default:
      return [PRICING_TYPE_FIXED, PRICING_TYPE_PERKG, PRICING_TYPE_CUSTOM];
  }
}

export const isVariantPricingType = (pt: string): boolean =>
  [
    'smlxl',
    'halffull',
    'drinks',
    'water',
    'retail_garments',
    'retail_shoes',
    'retail_sanitary_sizes',
    'retail_pipe_lengths',
    'retail_bath_sets',
    'retail_shades',
    'retail_volumes',
    'retail_paint',
    'retail_wire',
    'retail_wattage',
    'retail_pharma_strip',
    'retail_pharma_syrup',
    'retail_storage',
    'retail_bakery',
    'retail_packs',
    'retail_fabric',
  ].includes(pt);

export const PRICING_TYPES_MINIMART = ALL_RETAIL_PRICING_TYPES;

export const PRICING_TYPES = PRICING_TYPES_FASTFOOD;

const UNIT_OPTIONS = [
  { value: 'PCS', label: 'Piece (PCS)' },
  { value: 'SET', label: 'Set (SET)' },
  { value: 'PAIR', label: 'Pair (PAIR)' },
  { value: 'FEET', label: 'Feet (ft)' },
  { value: 'LENGTH', label: 'Pipe Length (10ft / 13ft Length)' },
  { value: 'RFT', label: 'Running Feet (RFT)' },
  { value: 'METER', label: 'Meter (m)' },
  { value: 'INCH', label: 'Inch (in)' },
  { value: 'ROLL', label: 'Roll (Teflon / Tape / Pipe / Wire)' },
  { value: 'TUBE', label: 'Tube (Cream / Ointment / Sealant)' },
  { value: 'PACK', label: 'Pack' },
  { value: 'BOX', label: 'Box' },
  { value: 'CARTON', label: 'Carton / Peti (CTN)' },
  { value: 'DOZEN', label: 'Dozen (Darjan)' },
  { value: 'COIL', label: 'Coil / Bundle' },
  { value: 'SHEET', label: 'Sheet' },
  { value: 'BAG', label: 'Bag / Bori' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'Gram', label: 'Gram (g)' },
  { value: 'Liter', label: 'Liter (L)' },
  { value: 'ML', label: 'Milliliter (ml)' },
  { value: 'POUND', label: 'Pound / Lbs (Cakes)' },
  { value: 'GALLON', label: 'Gallon' },
  { value: 'QUARTER', label: 'Quarter (1L)' },
  { value: 'BALTI', label: 'Bucket / Balti (16L)' },
  { value: 'SUIT', label: 'Suit (SUIT)' },
  { value: 'GAZ', label: 'Gaz / Yard' },
  { value: 'THAN', label: 'Than / Fabric Bolt (Cloth)' },
  { value: 'DABBA', label: 'Box / Pack (Dabba)' },
  { value: 'TRAY', label: 'Tray (Eggs / Sweets)' },
  { value: 'STRIP', label: 'Strip (Tablets)' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CAPSULE', label: 'Capsule' },
  { value: 'SYRUP', label: 'Syrup Bottle' },
  { value: 'BOTTLE', label: 'Bottle' },
  { value: 'JAR', label: 'Jar (Honey / Jam / Cream)' },
  { value: 'TIN', label: 'Tin / Can' },
  { value: 'CAN', label: 'Can (Beverage / Food)' },
  { value: 'SACHET', label: 'Sachet / Pouch' },
  { value: 'VIAL', label: 'Vial (Injection)' },
  { value: 'AMPOULE', label: 'Ampoule' },
  { value: 'KIT', label: 'Kit / Combo' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'PORTION', label: 'Portion' },
  { value: 'PLATE', label: 'Plate' },
  { value: 'SERVING', label: 'Serving' },
  { value: 'DEAL', label: 'Deal / Combo' },
  { value: 'CUP', label: 'Cup' },
  { value: 'GLASS', label: 'Glass' },
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
  openingStock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
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
    boxSizing: 'border-box',
    border: `1.5px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    outline: 'none',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground1,
    },
  },
  pricingTypeBtnActive: {
    backgroundColor: '#E51937',
    color: '#FFFFFF !important',
    fontWeight: 700,
    borderTopColor: '#E51937',
    borderBottomColor: '#E51937',
    borderLeftColor: '#E51937',
    borderRightColor: '#E51937',
    borderTopWidth: '1.5px',
    borderBottomWidth: '1.5px',
    borderLeftWidth: '1.5px',
    borderRightWidth: '1.5px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    boxShadow: '0 2px 10px rgba(229, 25, 55, 0.35)',
    ':hover': {
      backgroundColor: '#be123c',
      color: '#FFFFFF !important',
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

  /* ── Layout & Typography Helpers ── */
  colEnd: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  flexEndRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '6px',
  },
  requiredStar: {
    color: '#E51937',
    fontWeight: 800,
  },
  flexShrink0: {
    flexShrink: 0,
  },
  hiddenInput: {
    display: 'none',
  },
  noPhotoIcon: {
    width: '28px',
    height: '28px',
  },
  noPhotoText: {
    fontSize: '11px',
  },
  tag20Icon: {
    width: '20px',
    height: '20px',
  },
  strongForeground: {
    color: tokens.colorNeutralForeground1,
  },

  /* ── Industry Profile Classes ── */
  presetChipSelectedFood: {
    fontWeight: 800,
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E51937', borderBottomColor: '#E51937', borderLeftColor: '#E51937', borderRightColor: '#E51937',
    backgroundColor: 'rgba(229, 25, 55, 0.15)',
    color: '#E51937',
  },
  presetChipSelectedApparel: {
    fontWeight: 800,
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#8b5cf6', borderBottomColor: '#8b5cf6', borderLeftColor: '#8b5cf6', borderRightColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    color: '#8b5cf6',
  },
  presetChipSelectedFootwear: {
    fontWeight: 800,
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#3b82f6', borderBottomColor: '#3b82f6', borderLeftColor: '#3b82f6', borderRightColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
  },
  presetChipSelectedHardware: {
    fontWeight: 800,
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#f59e0b', borderBottomColor: '#f59e0b', borderLeftColor: '#f59e0b', borderRightColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
  },
  presetChipSelectedStandard: {
    fontWeight: 800,
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#64748b', borderBottomColor: '#64748b', borderLeftColor: '#64748b', borderRightColor: '#64748b',
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    color: '#64748b',
  },
  variantSectionActiveFood: {
    borderTopColor: 'rgba(229, 25, 55, 0.3)', borderBottomColor: 'rgba(229, 25, 55, 0.3)', borderLeftColor: 'rgba(229, 25, 55, 0.3)', borderRightColor: 'rgba(229, 25, 55, 0.3)',
    backgroundColor: 'rgba(229, 25, 55, 0.04)',
  },
  variantSectionActiveApparel: {
    borderTopColor: 'rgba(139, 92, 246, 0.3)', borderBottomColor: 'rgba(139, 92, 246, 0.3)', borderLeftColor: 'rgba(139, 92, 246, 0.3)', borderRightColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: 'rgba(139, 92, 246, 0.04)',
  },
  variantSectionActiveFootwear: {
    borderTopColor: 'rgba(59, 130, 246, 0.3)', borderBottomColor: 'rgba(59, 130, 246, 0.3)', borderLeftColor: 'rgba(59, 130, 246, 0.3)', borderRightColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
  },
  variantSectionActiveHardware: {
    borderTopColor: 'rgba(245, 158, 11, 0.3)', borderBottomColor: 'rgba(245, 158, 11, 0.3)', borderLeftColor: 'rgba(245, 158, 11, 0.3)', borderRightColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  variantSectionActiveStandard: {
    borderTopColor: 'rgba(100, 116, 139, 0.3)', borderBottomColor: 'rgba(100, 116, 139, 0.3)', borderLeftColor: 'rgba(100, 116, 139, 0.3)', borderRightColor: 'rgba(100, 116, 139, 0.3)',
    backgroundColor: 'rgba(100, 116, 139, 0.04)',
  },
  profileTagFood: {
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    color: '#E51937',
    borderTopColor: 'rgba(229, 25, 55, 0.25)', borderBottomColor: 'rgba(229, 25, 55, 0.25)', borderLeftColor: 'rgba(229, 25, 55, 0.25)', borderRightColor: 'rgba(229, 25, 55, 0.25)',
  },
  profileTagApparel: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    color: '#8b5cf6',
    borderTopColor: 'rgba(139, 92, 246, 0.25)', borderBottomColor: 'rgba(139, 92, 246, 0.25)', borderLeftColor: 'rgba(139, 92, 246, 0.25)', borderRightColor: 'rgba(139, 92, 246, 0.25)',
  },
  profileTagFootwear: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: '#3b82f6',
    borderTopColor: 'rgba(59, 130, 246, 0.25)', borderBottomColor: 'rgba(59, 130, 246, 0.25)', borderLeftColor: 'rgba(59, 130, 246, 0.25)', borderRightColor: 'rgba(59, 130, 246, 0.25)',
  },
  profileTagHardware: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
    borderTopColor: 'rgba(245, 158, 11, 0.25)', borderBottomColor: 'rgba(245, 158, 11, 0.25)', borderLeftColor: 'rgba(245, 158, 11, 0.25)', borderRightColor: 'rgba(245, 158, 11, 0.25)',
  },
  profileTagStandard: {
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    color: '#64748b',
    borderTopColor: 'rgba(100, 116, 139, 0.25)', borderBottomColor: 'rgba(100, 116, 139, 0.25)', borderLeftColor: 'rgba(100, 116, 139, 0.25)', borderRightColor: 'rgba(100, 116, 139, 0.25)',
  },
  textAccentFood: { color: '#E51937' },
  textAccentApparel: { color: '#8b5cf6' },
  textAccentFootwear: { color: '#3b82f6' },
  textAccentHardware: { color: '#f59e0b' },
  textAccentStandard: { color: '#64748b' },
  sizeChipSelectedFood: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E51937', borderBottomColor: '#E51937', borderLeftColor: '#E51937', borderRightColor: '#E51937',
    backgroundColor: 'rgba(229, 25, 55, 0.15)',
    color: '#E51937',
    fontWeight: 800,
  },
  sizeChipSelectedApparel: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#8b5cf6', borderBottomColor: '#8b5cf6', borderLeftColor: '#8b5cf6', borderRightColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    color: '#8b5cf6',
    fontWeight: 800,
  },
  sizeChipSelectedFootwear: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#3b82f6', borderBottomColor: '#3b82f6', borderLeftColor: '#3b82f6', borderRightColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    fontWeight: 800,
  },
  sizeChipSelectedHardware: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#f59e0b', borderBottomColor: '#f59e0b', borderLeftColor: '#f59e0b', borderRightColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    fontWeight: 800,
  },
  sizeChipSelectedStandard: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#64748b', borderBottomColor: '#64748b', borderLeftColor: '#64748b', borderRightColor: '#64748b',
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    color: '#64748b',
    fontWeight: 800,
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

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    staleTime: 60000,
  });

  const generateRandomSku = () => String(Math.floor(10000000 + Math.random() * 90000000));

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      module: defaultModule,
      category: searchParams.get('category') || 'General',
      price: undefined,
      costPrice: undefined,
      pricingType: 'fixed',
      unit: defaultModule === 'minimart' ? 'PCS' : 'PCS',
      skuCode: generateRandomSku(),
      rackLocation: '',
      openingStock: 0,
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

  const [activeShoePresetId, setActiveShoePresetId] = useState<string>('kids');
  const [selectedShoeSizes, setSelectedShoeSizes] = useState<string[]>(['6', '7', '8', '9', '10', '11']);
  const [customShoeInput, setCustomShoeInput] = useState<string>('');

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

  // Dedicated Hardware Paint Containers (Quarter 1L, Gallon 4L, Balti 16L)
  const [paintSizes, setPaintSizes] = useState({
    quarter: '',
    gallon: '',
    balti: '',
  });

  // Dedicated Sanitary Pipe & Fitting Diameters (1/2" to 4" / 20mm to 110mm)
  const [sanitarySizes, setSanitarySizes] = useState({
    half: '',          // 1/2" (20mm)
    threeQuarter: '',  // 3/4" (25mm)
    one: '',           // 1" (32mm)
    sawa: '',          // 1.25" (40mm)
    dhed: '',          // 1.5" (50mm)
    two: '',           // 2" (63mm)
    three: '',         // 3" (90mm)
    four: '',          // 4" (110mm)
  });
  const [bulkSanitaryPrice, setBulkSanitaryPrice] = useState('');

  // Dedicated Sanitary Pipe Lengths (Per Foot, 10ft, 13ft, 20ft)
  const [pipeLengthSizes, setPipeLengthSizes] = useState({
    foot1: '', // Per Foot (1 FT)
    ft10: '',  // 10 Feet Length
    ft13: '',  // 13 Feet Length
    ft20: '',  // 20 Feet Length
  });
  const [bulkPipeFootPrice, setBulkPipeFootPrice] = useState('');

  // Dedicated Bathroom Sets (Showers & Taps Sets)
  const [bathSetSizes, setBathSetSizes] = useState({
    singlePiece: '',  // Single Piece (Toti / Bib Cock)
    muslimShower: '', // Muslim Shower Only
    showerHead: '',   // Shower Head & Arm
    completeSet: '',  // Complete Bath Set
  });

  // Dedicated Electric Wire Gauge & Lengths
  const [wireSizes, setWireSizes] = useState({
    w1_5: '',
    w2_5: '',
    w7_29: '',
    w7_36: '',
    wcoil: '',
  });

  // Dedicated LED Wattage Variants
  const [wattageSizes, setWattageSizes] = useState({
    w5: '',
    w12: '',
    w18: '',
    w24: '',
  });

  // Dedicated Pharmacy Formulations
  const [pharmaStripSizes, setPharmaStripSizes] = useState({
    strip: '',
    box: '',
  });
  const [pharmaSyrupSizes, setPharmaSyrupSizes] = useState({
    ml60: '',
    ml120: '',
  });

  // Dedicated Electronics Storage
  const [storageSizes, setStorageSizes] = useState({
    gb64: '',
    gb128: '',
    gb256: '',
    gb512: '',
  });

  // Dedicated Bakery / Sweets Box
  const [bakerySizes, setBakerySizes] = useState({
    g250: '',
    g500: '',
    kg1: '',
    kg2: '',
  });

  // Dedicated Pack & Carton
  const [packSizes, setPackSizes] = useState({
    single: '',
    carton: '',
  });

  const [bulkGarmentPrice, setBulkGarmentPrice] = useState('');
  const [bulkShoePrice, setBulkShoePrice] = useState('');
  const [bulkPaintPrice, setBulkPaintPrice] = useState('');
  const [bulkWirePrice, setBulkWirePrice] = useState('');
  const [bulkWattagePrice, setBulkWattagePrice] = useState('');
  const [bulkStoragePrice, setBulkStoragePrice] = useState('');
  const [bulkBakeryPrice, setBulkBakeryPrice] = useState('');
  const [activeDepartmentTab, setActiveDepartmentTab] = useState<'fastfood' | 'minimart'>(
    defaultModule === 'fastfood' && hasFastFood ? 'fastfood' : (hasOmnimart ? 'minimart' : 'fastfood')
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

  // Calculate live total stock for the selected category across existing products
  const categoryStockInfo = React.useMemo(() => {
    if (!watchedCategory) return { totalStock: 0, count: 0 };
    const prodsInCat = (allProducts || []).filter(
      (p) => (p.category || '').trim().toLowerCase() === watchedCategory.trim().toLowerCase()
    );
    const total = prodsInCat.reduce((sum, p) => sum + (p.openingStock || 0), 0);
    return { totalStock: total, count: prodsInCat.length };
  }, [allProducts, watchedCategory]);

  const [selectedItemTypeId, setSelectedItemTypeId] = useState<string>('');

  const availableItemTypes = React.useMemo(() => {
    return getItemTypesForCategory(watchedCategory || '', detectedProfile);
  }, [watchedCategory, detectedProfile]);

  const activeItemType = React.useMemo(() => {
    return availableItemTypes.find((t) => t.id === selectedItemTypeId) || null;
  }, [availableItemTypes, selectedItemTypeId]);

  // Strictly filter unit options to ONLY the units that belong to the active item type or category profile
  const categoryUnitOptions = React.useMemo(() => {
    let suggested = activeItemType?.suggestedUnits || profileConfig?.suggestedUnits || ['PCS'];
    if (!activeItemType && detectedProfile === 'hardware') {
      if (isSanitaryCategory(watchedCategory || '')) {
        suggested = ['PCS', 'SET', 'FEET', 'LENGTH', 'RFT', 'INCH', 'ROLL', 'TUBE', 'PACK', 'DOZEN', 'PAIR', 'METER'];
      } else if (/paint|distemper|color|coating|thinner|varnish/i.test(watchedCategory || '')) {
        suggested = ['GALLON', 'QUARTER', 'BALTI', 'LITER', 'KG', 'PCS'];
      }
    }
    const matched: { value: string; label: string }[] = [];
    suggested.forEach((su) => {
      const found = UNIT_OPTIONS.find((opt) => opt.value.toUpperCase() === su.toUpperCase());
      if (found && !matched.some((m) => m.value.toUpperCase() === found.value.toUpperCase())) {
        matched.push(found);
      }
    });
    return matched.length > 0 ? matched : [{ value: 'PCS', label: 'Piece (PCS)' }];
  }, [profileConfig, detectedProfile, watchedCategory, activeItemType]);

  // When category or item type changes, auto-align the unit to the primary unit if current unit is invalid
  useEffect(() => {
    if (categoryUnitOptions.length > 0) {
      const currentUnit = productForm.getValues('unit');
      const isCurrentValid = categoryUnitOptions.some(
        (opt) => opt.value.toUpperCase() === currentUnit?.toUpperCase()
      );
      if (!isCurrentValid) {
        productForm.setValue('unit', categoryUnitOptions[0].value);
      }
    }
  }, [categoryUnitOptions, productForm]);

  // Reset or align selected item type when category changes
  useEffect(() => {
    if (availableItemTypes.length > 0) {
      const exists = availableItemTypes.some((t) => t.id === selectedItemTypeId);
      if (!exists) {
        setSelectedItemTypeId('');
      }
    } else {
      setSelectedItemTypeId('');
    }
  }, [watchedCategory, availableItemTypes]);

  const handleSelectItemType = (itemType: ItemTypeOption) => {
    if (selectedItemTypeId === itemType.id) {
      // Toggle off - return to category default
      setSelectedItemTypeId('');
      productForm.setValue('unit', profileConfig.suggestedUnits[0] || 'PCS');
      return;
    }
    setSelectedItemTypeId(itemType.id);
    productForm.setValue('unit', itemType.defaultUnit);
    if (itemType.recommendedPricingType) {
      handlePricingTypeSelect(itemType.recommendedPricingType);
    }
  };

  // Smart auto-detection: if user types in product name (e.g. "toti", "shower", "pipe", "elbow", "paint", "than", "wire")
  useEffect(() => {
    if (!watchedName || watchedName.trim().length < 2) return;
    if (availableItemTypes.length > 0) {
      const matched = availableItemTypes.find((t) => t.keywordMatch && t.keywordMatch.test(watchedName));
      if (matched && matched.id !== selectedItemTypeId) {
        setSelectedItemTypeId(matched.id);
        productForm.setValue('unit', matched.defaultUnit);
        if (matched.recommendedPricingType && pricingType === 'fixed') {
          handlePricingTypeSelect(matched.recommendedPricingType);
        }
      }
    }
  }, [watchedName, availableItemTypes]);

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

  const rebuildVariantsFromShoeSelection = (
    sizesList: string[],
    overridePrice?: number
  ) => {
    const articlePrice = overridePrice !== undefined
      ? overridePrice
      : Number(productForm.getValues('price') || 0);

    const defaultStock = Number(productForm.getValues('openingStock')) || 0;
    const built: ProductVariant[] = sizesList.map((sizeLabel) => {
      return {
        id: uid(`var_shoe_${sizeLabel.toLowerCase().replace(/[^a-z0-9]/g, '')}_`),
        label: `Size ${sizeLabel}`,
        price: articlePrice > 0 ? articlePrice : undefined,
        priceDelta: 0,
        costDelta: 0,
        stock: defaultStock,
        skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${sizeLabel}` : undefined,
      };
    });

    setVariants(built);
    setHasVariants(built.length > 0);
  };

  const handleToggleShoeSize = (sizeLabel: string) => {
    const exists = selectedShoeSizes.includes(sizeLabel);
    const updated = exists
      ? selectedShoeSizes.filter((s) => s !== sizeLabel)
      : [...selectedShoeSizes, sizeLabel].sort((a, b) => {
          const numA = parseFloat(a);
          const numB = parseFloat(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });
    setSelectedShoeSizes(updated);
    rebuildVariantsFromShoeSelection(updated);
  };

  const handleSelectAllShoeSizesInPreset = (presetSizes: string[]) => {
    const combined = Array.from(new Set([...selectedShoeSizes, ...presetSizes])).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
    setSelectedShoeSizes(combined);
    rebuildVariantsFromShoeSelection(combined);
  };

  const handleDeselectShoePreset = (presetSizes: string[]) => {
    const filtered = selectedShoeSizes.filter((s) => !presetSizes.includes(s));
    setSelectedShoeSizes(filtered);
    rebuildVariantsFromShoeSelection(filtered);
  };

  const handleClearAllShoeSizes = () => {
    setSelectedShoeSizes([]);
    rebuildVariantsFromShoeSelection([]);
  };

  const handleAddCustomShoeSize = () => {
    const trimmed = customShoeInput.trim();
    if (trimmed && !selectedShoeSizes.includes(trimmed)) {
      const updated = [...selectedShoeSizes, trimmed];
      setSelectedShoeSizes(updated);
      setCustomShoeInput('');
      rebuildVariantsFromShoeSelection(updated);
    }
  };

  // Strictly align footwear size preset and variants to the active retail category
  useEffect(() => {
    if (detectedProfile === 'footwear') {
      const available = getAvailableShoePresetsForCategory(watchedCategory || '');
      const bestPreset = getShoePresetForCategory(watchedCategory || '');
      const isCurrentValid = available.some((p) => p.id === activeShoePresetId);
      const targetPreset = isCurrentValid
        ? (available.find((p) => p.id === activeShoePresetId) || bestPreset)
        : bestPreset;

      setActiveShoePresetId(targetPreset.id);
      setSelectedShoeSizes(targetPreset.sizes);
      if (pricingType === 'retail_shoes') {
        rebuildVariantsFromShoeSelection(targetPreset.sizes);
      }
    }
  }, [watchedCategory, detectedProfile, pricingType]);

  // Keep all shoe size variants synchronized with the article price whenever price changes
  useEffect(() => {
    if (pricingType === 'retail_shoes' && selectedShoeSizes.length > 0) {
      rebuildVariantsFromShoeSelection(selectedShoeSizes, Number(watchedPrice) || 0);
    }
  }, [watchedPrice, pricingType]);

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

  const rebuildVariantsFromSanitarySizes = (sizesObj: typeof sanitarySizes) => {
    const mapping: { key: keyof typeof sanitarySizes; label: string }[] = [
      { key: 'half', label: '1/2" (20mm)' },
      { key: 'threeQuarter', label: '3/4" (25mm)' },
      { key: 'one', label: '1" (32mm)' },
      { key: 'sawa', label: '1.25" (40mm)' },
      { key: 'dhed', label: '1.5" (50mm)' },
      { key: 'two', label: '2" (63mm)' },
      { key: 'three', label: '3" (90mm)' },
      { key: 'four', label: '4" (110mm)' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_san_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const rebuildVariantsFromPipeLengthSizes = (sizesObj: typeof pipeLengthSizes) => {
    const mapping: { key: keyof typeof pipeLengthSizes; label: string }[] = [
      { key: 'foot1', label: 'Per Foot (1 FT)' },
      { key: 'ft10', label: '10 Feet Length' },
      { key: 'ft13', label: '13 Feet Length' },
      { key: 'ft20', label: '20 Feet Length' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_pipe_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 40,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handlePipeLengthSizeChange = (key: keyof typeof pipeLengthSizes, val: string) => {
    const updated = { ...pipeLengthSizes, [key]: val };
    setPipeLengthSizes(updated);
    rebuildVariantsFromPipeLengthSizes(updated);
  };

  const rebuildVariantsFromBathSetSizes = (sizesObj: typeof bathSetSizes) => {
    const mapping: { key: keyof typeof bathSetSizes; label: string }[] = [
      { key: 'singlePiece', label: 'Single Piece (Toti)' },
      { key: 'muslimShower', label: 'Muslim Shower Only' },
      { key: 'showerHead', label: 'Shower Head & Arm' },
      { key: 'completeSet', label: 'Complete Bath Set' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_bath_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 25,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handleBathSetSizeChange = (key: keyof typeof bathSetSizes, val: string) => {
    const updated = { ...bathSetSizes, [key]: val };
    setBathSetSizes(updated);
    rebuildVariantsFromBathSetSizes(updated);
  };

  const rebuildVariantsFromPaintSizes = (sizesObj: typeof paintSizes) => {
    const mapping: { key: keyof typeof paintSizes; label: string }[] = [
      { key: 'quarter', label: 'Quarter (1L)' },
      { key: 'gallon', label: 'Gallon (4L)' },
      { key: 'balti', label: 'Balti (16L)' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_paint_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 20,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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
    rebuildVariantsFromPaintSizes(updated);
  };

  const rebuildVariantsFromWireSizes = (sizesObj: typeof wireSizes) => {
    const mapping: { key: keyof typeof wireSizes; label: string }[] = [
      { key: 'w1_5', label: '1.5mm' },
      { key: 'w2_5', label: '2.5mm' },
      { key: 'w7_29', label: '7/29' },
      { key: 'w7_36', label: '7/36' },
      { key: 'wcoil', label: 'Coil (90m)' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_wire_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 30,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handleWireSizeChange = (key: keyof typeof wireSizes, val: string) => {
    const updated = { ...wireSizes, [key]: val };
    setWireSizes(updated);
    rebuildVariantsFromWireSizes(updated);
  };

  const rebuildVariantsFromWattageSizes = (sizesObj: typeof wattageSizes) => {
    const mapping: { key: keyof typeof wattageSizes; label: string }[] = [
      { key: 'w5', label: '5W' },
      { key: 'w12', label: '12W' },
      { key: 'w18', label: '18W' },
      { key: 'w24', label: '24W' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_wat_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handleWattageSizeChange = (key: keyof typeof wattageSizes, val: string) => {
    const updated = { ...wattageSizes, [key]: val };
    setWattageSizes(updated);
    rebuildVariantsFromWattageSizes(updated);
  };

  const rebuildVariantsFromPharmaStripSizes = (sizesObj: typeof pharmaStripSizes) => {
    const mapping: { key: keyof typeof pharmaStripSizes; label: string }[] = [
      { key: 'strip', label: 'Strip (10 Tablets)' },
      { key: 'box', label: 'Box (100 Tablets)' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_ph_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handlePharmaStripSizeChange = (key: keyof typeof pharmaStripSizes, val: string) => {
    const updated = { ...pharmaStripSizes, [key]: val };
    setPharmaStripSizes(updated);
    rebuildVariantsFromPharmaStripSizes(updated);
  };

  const rebuildVariantsFromPharmaSyrupSizes = (sizesObj: typeof pharmaSyrupSizes) => {
    const mapping: { key: keyof typeof pharmaSyrupSizes; label: string }[] = [
      { key: 'ml60', label: '60ml' },
      { key: 'ml120', label: '120ml' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_syr_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 30,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handlePharmaSyrupSizeChange = (key: keyof typeof pharmaSyrupSizes, val: string) => {
    const updated = { ...pharmaSyrupSizes, [key]: val };
    setPharmaSyrupSizes(updated);
    rebuildVariantsFromPharmaSyrupSizes(updated);
  };

  const rebuildVariantsFromStorageSizes = (sizesObj: typeof storageSizes) => {
    const mapping: { key: keyof typeof storageSizes; label: string }[] = [
      { key: 'gb64', label: '64GB' },
      { key: 'gb128', label: '128GB' },
      { key: 'gb256', label: '256GB' },
      { key: 'gb512', label: '512GB' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_strg_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 10,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handleStorageSizeChange = (key: keyof typeof storageSizes, val: string) => {
    const updated = { ...storageSizes, [key]: val };
    setStorageSizes(updated);
    rebuildVariantsFromStorageSizes(updated);
  };

  const rebuildVariantsFromBakerySizes = (sizesObj: typeof bakerySizes) => {
    const mapping: { key: keyof typeof bakerySizes; label: string }[] = [
      { key: 'g250', label: '250g' },
      { key: 'g500', label: '500g' },
      { key: 'kg1', label: '1 KG' },
      { key: 'kg2', label: '2 KG' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_bak_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 40,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handleBakerySizeChange = (key: keyof typeof bakerySizes, val: string) => {
    const updated = { ...bakerySizes, [key]: val };
    setBakerySizes(updated);
    rebuildVariantsFromBakerySizes(updated);
  };

  const rebuildVariantsFromPackSizes = (sizesObj: typeof packSizes) => {
    const mapping: { key: keyof typeof packSizes; label: string }[] = [
      { key: 'single', label: 'Single Piece' },
      { key: 'carton', label: 'Carton / Box' },
    ];
    const built: ProductVariant[] = [];
    let firstPrice: number | undefined = undefined;

    mapping.forEach(({ key, label }) => {
      const valStr = (sizesObj[key] || '').trim();
      if (valStr !== '' && !isNaN(Number(valStr)) && Number(valStr) > 0) {
        const pNum = Number(valStr);
        if (firstPrice === undefined) firstPrice = pNum;
        built.push({
          id: uid(`var_pk_${key}_`),
          label,
          price: pNum,
          priceDelta: 0,
          costDelta: 0,
          stock: 50,
          skuCode: watchedName ? `SKU-${watchedName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${key}` : undefined,
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

  const handlePackSizeChange = (key: keyof typeof packSizes, val: string) => {
    const updated = { ...packSizes, [key]: val };
    setPackSizes(updated);
    rebuildVariantsFromPackSizes(updated);
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
      watchedModule === 'fastfood'
        ? PRICING_TYPES_FASTFOOD
        : getPricingTypesForProfile(detectedProfile, watchedCategory, false);
    const typeConfig = activeList.find((p) => p.id === typeId) || ALL_RETAIL_PRICING_TYPES.find((p) => p.id === typeId);
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
      const available = getAvailableShoePresetsForCategory(watchedCategory || '');
      const bestPreset = getShoePresetForCategory(watchedCategory || '');
      const isCurrentValid = available.some((p) => p.id === activeShoePresetId);
      const targetPreset = isCurrentValid
        ? (available.find((p) => p.id === activeShoePresetId) || bestPreset)
        : bestPreset;

      setActiveShoePresetId(targetPreset.id);
      setSelectedShoeSizes(targetPreset.sizes);
      rebuildVariantsFromShoeSelection(targetPreset.sizes);
    } else if (typeId === 'retail_sanitary_sizes') {
      rebuildVariantsFromSanitarySizes(sanitarySizes);
    } else if (typeId === 'retail_pipe_lengths') {
      rebuildVariantsFromPipeLengthSizes(pipeLengthSizes);
    } else if (typeId === 'retail_bath_sets') {
      rebuildVariantsFromBathSetSizes(bathSetSizes);
    } else if (typeId === 'retail_paint') {
      rebuildVariantsFromPaintSizes(paintSizes);
    } else if (typeId === 'retail_wire') {
      rebuildVariantsFromWireSizes(wireSizes);
    } else if (typeId === 'retail_wattage') {
      rebuildVariantsFromWattageSizes(wattageSizes);
    } else if (typeId === 'retail_pharma_strip') {
      rebuildVariantsFromPharmaStripSizes(pharmaStripSizes);
    } else if (typeId === 'retail_pharma_syrup') {
      rebuildVariantsFromPharmaSyrupSizes(pharmaSyrupSizes);
    } else if (typeId === 'retail_storage') {
      rebuildVariantsFromStorageSizes(storageSizes);
    } else if (typeId === 'retail_bakery') {
      rebuildVariantsFromBakerySizes(bakerySizes);
    } else if (typeId === 'retail_packs') {
      rebuildVariantsFromPackSizes(packSizes);
    } else if (typeId === 'retail_shades') {
      rebuildVariantsFromShadeSizes(shadeSizes);
    } else if (typeId === 'retail_volumes') {
      rebuildVariantsFromVolumeSizes(volumeSizes);
    } else if (typeId === 'halffull') {
      rebuildVariantsFromPortionSizes(portionSizes);
    } else if (typeId === 'drinks') {
      rebuildVariantsFromDrinkSizes(drinkSizes);
    } else if (typeId === 'water') {
      rebuildVariantsFromWaterSizes(waterSizes);
    } else if (typeId === 'perkg') {
      productForm.setValue('unit', 'KG');
      setVariants([]);
      setHasVariants(false);
    } else if (typeId === 'fixed' || typeId === 'perpiece') {
      // Single price mode
      setVariants([]);
      setHasVariants(false);
    }
  };

  useEffect(() => {
    const queryCat = searchParams.get('category');
    if (queryCat && categories.some((c) => c.name.toLowerCase() === queryCat.toLowerCase())) {
      productForm.setValue('category', queryCat);
      return;
    }
    if (categories.length > 0) {
      const match = categories.find((c) => c.module === watchedModule);
      if (match && !categories.some((c) => c.name === productForm.getValues('category') && c.module === watchedModule)) {
        productForm.setValue('category', match.name);
      }
    }
  }, [watchedModule, categories, productForm, searchParams]);

  // Whenever article price changes, sync all shoe size variants to the same article price
  useEffect(() => {
    if (pricingType === 'retail_shoes' && variants.length > 0) {
      const numPrice = Number(watchedPrice);
      if (!isNaN(numPrice) && numPrice > 0) {
        setVariants((prev) =>
          prev.map((v) => ({
            ...v,
            price: numPrice,
          }))
        );
      }
    }
  }, [watchedPrice, pricingType]);

  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (pricingType === 'smlxl' && variants.length === 0) {
        alert('Please enter a price for at least one pizza size (Small, Medium, Large, XL).');
        throw new Error('No pizza size price entered');
      }
      if (pricingType === 'retail_garments' && variants.length === 0) {
        alert('Please enter a price for at least one garment size (XS, S, M, L, XL, etc.).');
        throw new Error('No garment size price entered');
      }
      if (pricingType === 'retail_shoes') {
        if (variants.length === 0) {
          alert('Please select at least one shoe size for this article.');
          throw new Error('No shoe size selected');
        }
        if (!data.price || data.price <= 0) {
          alert('Please enter a retail selling price for this shoe article.');
          throw new Error('No retail price entered');
        }
      }
      if (pricingType === 'retail_sanitary_sizes' && variants.length === 0) {
        alert('Please enter a price for at least one pipe or fitting size (1/2" to 4").');
        throw new Error('No sanitary size price entered');
      }
      if (pricingType === 'retail_pipe_lengths' && variants.length === 0) {
        alert('Please enter a price for at least one pipe length or per foot.');
        throw new Error('No pipe length price entered');
      }
      if (pricingType === 'retail_bath_sets' && variants.length === 0) {
        alert('Please enter a price for at least one shower / tap set option.');
        throw new Error('No bath set price entered');
      }
      if (pricingType === 'retail_paint' && variants.length === 0) {
        alert('Please enter a price for at least one paint container size (Quarter, Gallon, Balti).');
        throw new Error('No paint container price entered');
      }
      if (pricingType === 'retail_wire' && variants.length === 0) {
        alert('Please enter a price for at least one wire gauge or coil.');
        throw new Error('No wire gauge price entered');
      }
      if (pricingType === 'retail_wattage' && variants.length === 0) {
        alert('Please enter a price for at least one wattage variant.');
        throw new Error('No wattage price entered');
      }
      if (pricingType === 'retail_pharma_strip' && variants.length === 0) {
        alert('Please enter a price for Strip or Box.');
        throw new Error('No pharma strip price entered');
      }
      if (pricingType === 'retail_pharma_syrup' && variants.length === 0) {
        alert('Please enter a price for syrup bottle volume.');
        throw new Error('No syrup price entered');
      }
      if (pricingType === 'retail_storage' && variants.length === 0) {
        alert('Please enter a price for at least one storage variant (64GB - 512GB).');
        throw new Error('No storage price entered');
      }
      if (pricingType === 'retail_bakery' && variants.length === 0) {
        alert('Please enter a price for at least one sweet box size (250g - 2 KG).');
        throw new Error('No bakery box price entered');
      }
      if (pricingType === 'retail_packs' && variants.length === 0) {
        alert('Please enter a price for Single piece or Carton.');
        throw new Error('No pack price entered');
      }
      if (pricingType === 'retail_shades' && variants.length === 0) {
        alert('Please enter a price for at least one shade or color.');
        throw new Error('No shade price entered');
      }
      if (pricingType === 'retail_volumes' && variants.length === 0) {
        alert('Please enter a price for at least one pack or bottle volume.');
        throw new Error('No volume price entered');
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
      const combinedNotes = data.description?.trim() || undefined;

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
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate(watchedModule === 'fastfood' ? '/catalog/fastfood' : '/catalog/omnimart');
      }
    },
  });

  const watchedCatModule = categoryForm.watch('module') || watchedModule;
  const addCatProfileKey = watchedCatModule === 'fastfood' ? 'food' : (detectedProfile || 'footwear');

  const { data: addCatBusinessProfile } = useQuery({
    queryKey: ['business-profile-template', addCatProfileKey],
    queryFn: () => posApi.fetchBusinessProfile(addCatProfileKey),
  });

  const addCatDefaultOptions = React.useMemo(() => {
    const backendCategories = addCatBusinessProfile?.defaultCategories || [];
    const list = backendCategories.map((c) => c.name);

    const existing = new Set(categories.filter((c) => c.module === watchedCatModule).map((c) => c.name.toLowerCase().trim()));
    return list.map((catName) => {
      const isAlreadyAdded = existing.has(catName.toLowerCase().trim());
      return {
        value: catName,
        label: isAlreadyAdded ? `${catName} (Already Added)` : catName,
        disabled: isAlreadyAdded,
      };
    });
  }, [addCatBusinessProfile, addCatProfileKey, categories, watchedCatModule]);

  useEffect(() => {
    if (isCategoryDialogOpen && addCatDefaultOptions.length > 0) {
      const currentName = categoryForm.getValues('name');
      const currentOpt = addCatDefaultOptions.find((opt) => opt.value === currentName);
      if (!currentOpt || currentOpt.disabled) {
        const firstAvail = addCatDefaultOptions.find((opt) => !opt.disabled)?.value || addCatDefaultOptions[0].value;
        categoryForm.setValue('name', firstAvail);
      }
    }
  }, [isCategoryDialogOpen, addCatDefaultOptions, categoryForm]);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const prof = data.module === 'fastfood' ? 'food' : (detectedProfile || 'standard');
      const pConfig = CATEGORY_PROFILES[prof] || CATEGORY_PROFILES.standard;
      const newCat: Category = {
        id: uid('cat_'),
        module: data.module,
        name: data.name.trim(),
        profile: prof,
        suggestedSizes: pConfig.suggestedSizes,
        suggestedUnits: pConfig.suggestedUnits,
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
                      : 'rgba(2, 132, 199, 0.12)',
                  color:
                    activeDepartmentTab === 'fastfood'
                      ? '#E51937'
                      : '#0284C7',
                  border: `1px solid ${
                    activeDepartmentTab === 'fastfood'
                      ? 'rgba(229, 25, 55, 0.25)'
                      : 'rgba(2, 132, 199, 0.25)'
                  }`,
                }}
              >
                {activeDepartmentTab === 'fastfood'
                  ? '● Active: Fast Food & Kitchen Menu'
                  : `● Active: ${profileConfig.label} Catalog`}
              </span>
            </div>
          </div>

          {/* Department Selection Cards (Shown only when multiple modules exist) */}
          {hasFastFood && hasOmnimart ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Fast Food Card */}
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
                  boxSizing: 'border-box',
                  border: `2px solid ${activeDepartmentTab === 'fastfood' ? '#E51937' : tokens.colorNeutralStroke2}`,
                  backgroundColor: activeDepartmentTab === 'fastfood' ? 'rgba(229, 25, 55, 0.09)' : tokens.colorNeutralBackground2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
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

              {/* Retail / Profile Card */}
              <button
                type="button"
                onClick={() => {
                  setActiveDepartmentTab('minimart');
                  productForm.setValue('module', 'minimart');
                  const mmCat = categories.find((c) => c.module === 'minimart');
                  if (mmCat) productForm.setValue('category', mmCat.name);
                  if (!productForm.getValues('skuCode')) productForm.setValue('skuCode', generateRandomSku());
                  productForm.setValue('unit', profileConfig.suggestedUnits[0] || 'PCS');
                  handlePricingTypeSelect('fixed');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  border: `2px solid ${activeDepartmentTab === 'minimart' ? (profileConfig.accentColor || '#0284C7') : tokens.colorNeutralStroke2}`,
                  backgroundColor: activeDepartmentTab === 'minimart' ? `${profileConfig.accentColor || '#0284C7'}15` : tokens.colorNeutralBackground2,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: activeDepartmentTab === 'minimart' ? `0 4px 14px ${profileConfig.accentColor || '#0284C7'}30` : 'none',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: activeDepartmentTab === 'minimart' ? (profileConfig.accentColor || '#0284C7') : tokens.colorNeutralBackground3,
                    color: activeDepartmentTab === 'minimart' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: activeDepartmentTab === 'minimart' ? `0 2px 8px ${profileConfig.accentColor || '#0284C7'}40` : 'none',
                  }}
                >
                  <ShoppingBag24Regular style={{ width: 24, height: 24 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: activeDepartmentTab === 'minimart' ? (profileConfig.accentColor || '#0284C7') : tokens.colorNeutralForeground1 }}>
                      {profileConfig.label}
                    </span>
                    {activeDepartmentTab === 'minimart' && (
                      <CheckmarkCircle20Filled style={{ color: profileConfig.accentColor || '#0284C7', width: 18, height: 18 }} />
                    )}
                  </div>
                  <span style={{ display: 'block', fontSize: '11.5px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                    {profileConfig.description}
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: tokens.colorNeutralBackground2,
                border: `1px solid ${tokens.colorNeutralStroke2}`,
              }}
            >
              {hasFastFood ? (
                <>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#E51937',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Food24Regular style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: tokens.colorNeutralForeground1 }}>
                      Fast Food & Kitchen Catalog
                    </span>
                    <span style={{ display: 'block', fontSize: '11.5px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                      Products created here are routed to kitchen KDS screens and POS food counter
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: profileConfig.accentColor || '#0284C7',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShoppingBag24Regular style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: tokens.colorNeutralForeground1 }}>
                      {profileConfig.label} Catalog
                    </span>
                    <span style={{ display: 'block', fontSize: '11.5px', color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                      {profileConfig.description}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>



        <div className={styles.formGrid}>
          {/* Left Column: Form Details */}
          <div className={styles.cardSurface}>
            {/* Target Module & Category */}
            <div className={styles.twoColGrid}>
              <div className={styles.colEnd}>
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

              <div className={styles.colEnd}>
                <div className={styles.flexEndRow}>
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
                          const matchedCat = categories.find((c) => c.name === val);
                          const detected = detectCategoryProfile(val, matchedCat?.profile);
                          const pCfg = CATEGORY_PROFILES[detected];
                          if (detected === 'hardware') {
                            if (isSanitaryCategory(val)) {
                              productForm.setValue('unit', 'PCS');
                              setPricingType('fixed');
                              productForm.setValue('pricingType', 'fixed');
                              setVariants([]);
                              setHasVariants(false);
                            } else if (/paint|distemper|color|coating/i.test(val)) {
                              productForm.setValue('unit', 'GALLON');
                              setPricingType('retail_paint');
                              productForm.setValue('pricingType', 'retail_paint');
                              rebuildVariantsFromPaintSizes(paintSizes);
                            } else {
                              productForm.setValue('unit', 'PCS');
                              setPricingType('fixed');
                              productForm.setValue('pricingType', 'fixed');
                              setVariants([]);
                              setHasVariants(false);
                            }
                          } else if (pCfg && pCfg.suggestedUnits.length > 0) {
                            productForm.setValue('unit', pCfg.suggestedUnits[0]);
                          }
                          if (detected === 'footwear') {
                            setPricingType('retail_shoes');
                            productForm.setValue('pricingType', 'retail_shoes');
                            const preset = getShoePresetForCategory(val);
                            setActiveShoePresetId(preset.id);
                            setSelectedShoeSizes(preset.sizes);
                            rebuildVariantsFromShoeSelection(preset.sizes);
                          } else if (detected === 'apparel') {
                            setPricingType('retail_garments');
                            productForm.setValue('pricingType', 'retail_garments');
                            rebuildVariantsFromGarmentSizes(garmentSizes);
                          } else if (detected === 'cosmetics') {
                            setPricingType('retail_shades');
                            productForm.setValue('pricingType', 'retail_shades');
                            rebuildVariantsFromShadeSizes(shadeSizes);
                          } else if (detected === 'grocery' || detected === 'bakery') {
                            setPricingType('perkg');
                            productForm.setValue('pricingType', 'perkg');
                          } else if (detected === 'food') {
                            setPricingType('smlxl');
                            productForm.setValue('pricingType', 'smlxl');
                            rebuildVariantsFromPizzaSizes(pizzaSizes);
                          }
                        }}
                        error={productForm.formState.errors.category?.message}
                      />
                    );
                  }}
                />
              </div>
            </div>

            {/* ── Sub-Category / Specific Item Type Chips ── */}
            {availableItemTypes.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: tokens.colorNeutralBackground2,
                  border: `1px solid ${selectedItemTypeId ? `${profileConfig.accentColor || '#0284C7'}60` : tokens.colorNeutralStroke2}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                      Specific Item Type / Sub-Category:
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: tokens.colorNeutralForeground3 }}>
                      (Item select karein taake unit aur pricing type is item k hisaab se set ho)
                    </span>
                  </div>
                  {selectedItemTypeId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemTypeId('');
                        productForm.setValue('unit', profileConfig.suggestedUnits[0] || 'PCS');
                      }}
                      style={{ fontSize: '11px', fontWeight: 600, color: '#E51937', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableItemTypes.map((itemType) => {
                    const isSelected = selectedItemTypeId === itemType.id;
                    const accent = profileConfig.accentColor || '#0284C7';
                    const renderItemTypeIcon = (iconName?: string) => {
                      const iconStyle = { width: 14, height: 14, flexShrink: 0, color: isSelected ? accent : 'inherit' };
                      switch (iconName) {
                        case 'Droplets': return <Droplets style={iconStyle} />;
                        case 'Ruler': return <Ruler style={iconStyle} />;
                        case 'Wrench': return <Wrench style={iconStyle} />;
                        case 'Palette': return <Palette style={iconStyle} />;
                        case 'Shirt': return <Shirt style={iconStyle} />;
                        case 'Zap': return <Zap style={iconStyle} />;
                        case 'HeartPulse': return <HeartPulse style={iconStyle} />;
                        case 'Scale': return <Scale style={iconStyle} />;
                        case 'Cake': return <Cake style={iconStyle} />;
                        case 'Sparkles': return <Sparkles style={iconStyle} />;
                        case 'Footprints': return <Footprints style={iconStyle} />;
                        case 'Smartphone': return <Smartphone style={iconStyle} />;
                        case 'Package':
                        default:
                          return <Package style={iconStyle} />;
                      }
                    };
                    return (
                      <button
                        key={itemType.id}
                        type="button"
                        onClick={() => handleSelectItemType(itemType)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          boxSizing: 'border-box',
                          border: `1.5px solid ${isSelected ? accent : tokens.colorNeutralStroke1}`,
                          backgroundColor: isSelected ? `${accent}22` : tokens.colorNeutralBackground1,
                          color: isSelected ? accent : tokens.colorNeutralForeground1,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                          boxShadow: isSelected ? `0 2px 8px ${accent}35` : 'none',
                        }}
                      >
                        {isSelected ? (
                          <Checkmark16Filled style={{ width: 14, height: 14, color: accent, flexShrink: 0 }} />
                        ) : (
                          renderItemTypeIcon(itemType.iconName)
                        )}
                        <span style={{ color: isSelected ? accent : tokens.colorNeutralForeground1 }}>{itemType.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product Name */}
            <div>
              <Controller
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <CustomInput
                    label="Product Name"
                    required
                    placeholder={
                      activeItemType?.placeholderName ||
                      (watchedModule === 'fastfood'
                        ? 'e.g. Crispy Zinger Burger / Tikka Pizza'
                        : 'e.g. White Cotton Kurta / Leather Shoes / Whitening Cream / RC Toy Car')
                    }
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className={styles.pricingTypeLabel} style={{ marginBottom: 0 }}>
                  Pricing Type <span className={styles.requiredStar}>*</span>
                  {watchedModule !== 'fastfood' && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: isSanitaryCategory(watchedCategory || '') ? '#0284C7' : profileConfig.accentColor, fontWeight: 700 }}>
                      ({isSanitaryCategory(watchedCategory || '') ? 'Sanitary & Pipes' : profileConfig.shortTag} Recommended)
                    </span>
                  )}
                </label>
              </div>

              <div className={styles.pricingTypeRow}>
                {(watchedModule === 'fastfood'
                  ? PRICING_TYPES_FASTFOOD
                  : getPricingTypesForProfile(detectedProfile, watchedCategory, false)
                ).map((pt) => {
                  const Icon = pt.icon;
                  const isSelected = pricingType === pt.id;
                  let displayLabel = pt.label;
                  if (pt.id === 'retail_shoes') {
                    const preset = getShoePresetForCategory(watchedCategory || '');
                    displayLabel = `Footwear Sizes (${preset.rangeText})`;
                  }
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handlePricingTypeSelect(pt.id)}
                      className={mergeClasses(styles.pricingTypeBtn, isSelected && styles.pricingTypeBtnActive)}
                      style={{
                        backgroundColor: isSelected ? '#E51937' : undefined,
                        color: isSelected ? '#FFFFFF' : undefined,
                        borderColor: isSelected ? '#E51937' : undefined,
                        borderWidth: '1.5px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Icon size={14} className={styles.flexShrink0} style={{ color: isSelected ? '#FFFFFF' : undefined, stroke: isSelected ? '#FFFFFF' : undefined }} />
                      <span style={{ color: isSelected ? '#FFFFFF' : undefined }}>{displayLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.pricingTypeDesc}>
                {pricingType === 'retail_shoes'
                  ? `Select available sizes for this ${watchedCategory || 'footwear'} article (${getShoePresetForCategory(watchedCategory || '').name}). All sizes share the same article price.`
                  : (watchedModule === 'fastfood'
                      ? PRICING_TYPES_FASTFOOD
                      : ALL_RETAIL_PRICING_TYPES
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

              {/* ── 3. Dedicated Retail Shoe Size Matrix (Category-Specific Ranges & Unified Price) ── */}
              {pricingType === 'retail_shoes' && (() => {
                const availablePresets = getAvailableShoePresetsForCategory(watchedCategory || '');
                const currentPreset = availablePresets.find((p) => p.id === activeShoePresetId) || availablePresets[0] || SHOE_SIZE_PRESETS[0];
                const activePriceNum = Number(watchedPrice) || 0;

                return (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      backgroundColor: tokens.colorNeutralBackground2,
                      border: `1px solid ${tokens.colorNeutralStroke1}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    {/* Header: Title, Category Match Notice & Unified Article Price */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(229, 25, 55, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Footprints size={20} color="#E51937" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                              Footwear Article Sizes
                            </span>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(229, 25, 55, 0.12)',
                                color: '#E51937',
                                border: '1px solid rgba(229, 25, 55, 0.3)',
                              }}
                            >
                              {watchedCategory || 'Kids Footwear'}
                            </span>
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                            Select available sizes in this article. In shoe retail, all sizes share one unified retail price.
                          </p>
                        </div>
                      </div>

                      {/* Unified Selling Price Display & Quick Edit */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          backgroundColor: tokens.colorNeutralBackground3,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${tokens.colorNeutralStroke1}`,
                        }}
                      >
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 600, color: tokens.colorNeutralForeground3 }}>
                            Unified Selling Price:
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: activePriceNum > 0 ? '#10b981' : '#f59e0b' }}>
                            {activePriceNum > 0 ? formatPKR(activePriceNum) : 'Price Not Set'}
                          </div>
                        </div>
                        <input
                          type="number"
                          placeholder="Set Price (PKR)"
                          value={watchedPrice || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            productForm.setValue('price', Number(val));
                            productForm.clearErrors('price');
                          }}
                          style={{
                            width: '105px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${tokens.colorNeutralStroke1}`,
                            backgroundColor: tokens.colorNeutralBackground1,
                            color: tokens.colorNeutralForeground1,
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        />
                      </div>
                    </div>

                    {/* Preset Switcher (Category-filtered: Kids Footwear only shows Kids/Baby/Youth; Men's only shows Men's) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: tokens.colorNeutralForeground2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {availablePresets.length > 1 ? 'Category Size Ranges:' : `Standard Range: ${currentPreset.name} (${currentPreset.rangeText})`}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleSelectAllShoeSizesInPreset(currentPreset.sizes)}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '6px',
                              border: '1px solid rgba(229, 25, 55, 0.4)',
                              backgroundColor: 'rgba(229, 25, 55, 0.1)',
                              color: '#E51937',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Select All ({currentPreset.rangeText})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeselectShoePreset(currentPreset.sizes)}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '6px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              backgroundColor: tokens.colorNeutralBackground3,
                              color: tokens.colorNeutralForeground2,
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Deselect Range
                          </button>
                        </div>
                      </div>

                      {availablePresets.length > 1 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {availablePresets.map((preset) => {
                            const isActive = activeShoePresetId === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setActiveShoePresetId(preset.id);
                                  setSelectedShoeSizes(preset.sizes);
                                  rebuildVariantsFromShoeSelection(preset.sizes);
                                }}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  boxSizing: 'border-box',
                                  border: `1.5px solid ${isActive ? '#E51937' : tokens.colorNeutralStroke1}`,
                                  backgroundColor: isActive ? 'rgba(229, 25, 55, 0.15)' : tokens.colorNeutralBackground3,
                                  color: isActive ? '#fff' : tokens.colorNeutralForeground2,
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                                }}
                              >
                                <span>{preset.name}</span>
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    backgroundColor: isActive ? '#E51937' : 'rgba(255, 255, 255, 0.08)',
                                    color: '#fff',
                                    fontWeight: 700,
                                  }}
                                >
                                  {preset.badge}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Interactive Size Chips Grid */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground3, marginBottom: '8px' }}>
                        Click to toggle sizes available for this article:
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                          gap: '8px',
                        }}
                      >
                        {currentPreset.sizes.map((sizeStr) => {
                          const isSelected = selectedShoeSizes.includes(sizeStr);
                          return (
                            <button
                              key={sizeStr}
                              type="button"
                              onClick={() => handleToggleShoeSize(sizeStr)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '8px',
                                boxSizing: 'border-box',
                                border: `1.5px solid ${isSelected ? '#E51937' : tokens.colorNeutralStroke1}`,
                                backgroundColor: isSelected ? 'rgba(229, 25, 55, 0.14)' : tokens.colorNeutralBackground3,
                                color: isSelected ? '#fff' : tokens.colorNeutralForeground2,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                                boxShadow: isSelected ? '0 0 10px rgba(229, 25, 55, 0.25)' : 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isSelected ? (
                                <Checkmark16Filled style={{ color: '#E51937', fontSize: '14px', flexShrink: 0 }} />
                              ) : (
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: `1px solid ${tokens.colorNeutralStroke1}`, display: 'inline-block', flexShrink: 0 }} />
                              )}
                              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                {sizeStr} Size
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Size Addition */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                          Custom Size:
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. 46, 12, 13"
                          value={customShoeInput}
                          onChange={(e) => setCustomShoeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomShoeSize();
                            }
                          }}
                          style={{
                            width: '100px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${tokens.colorNeutralStroke1}`,
                            fontSize: '11.5px',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomShoeSize}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${tokens.colorNeutralStroke1}`,
                            backgroundColor: tokens.colorNeutralBackground3,
                            color: tokens.colorNeutralForeground1,
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          + Add Size
                        </button>
                      </div>
                    </div>

                    {/* Article Summary Bar */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(229, 25, 55, 0.08)',
                        border: '1px solid rgba(229, 25, 55, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Article Summary:
                        </span>
                        <span style={{ fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
                          <strong>{selectedShoeSizes.length}</strong> Sizes Selected ({selectedShoeSizes.join(', ') || 'None'})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
                          Article Price: <strong style={{ color: '#10b981' }}>{activePriceNum > 0 ? formatPKR(activePriceNum) : 'Not Set'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

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

              {/* ── 6a. Dedicated Sanitary Pipe & Fitting Diameters (1/2" to 4") ── */}
              {pricingType === 'retail_sanitary_sizes' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Droplets size={18} color="#0284C7" />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Pipe & Fitting Sizes Matrix (1/2" to 4" / 20mm to 110mm)
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                          PPRC, UPVC, CPVC pipes, elbows, tees, sockets, unions & valves pricing
                        </p>
                      </div>
                    </div>

                    {/* Quick Auto Multiplier */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                        1/2" Base Price:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 150"
                        value={bulkSanitaryPrice}
                        onChange={(e) => setBulkSanitaryPrice(e.target.value)}
                        style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkSanitaryPrice) {
                            const pNum = Number(bulkSanitaryPrice);
                            const updated = {
                              half: String(pNum),
                              threeQuarter: String(Math.round(pNum * 1.45)),
                              one: String(Math.round(pNum * 2.1)),
                              sawa: String(Math.round(pNum * 3.2)),
                              dhed: String(Math.round(pNum * 4.2)),
                              two: String(Math.round(pNum * 6.5)),
                              three: String(Math.round(pNum * 12.0)),
                              four: String(Math.round(pNum * 18.0)),
                            };
                            setSanitarySizes(updated);
                            rebuildVariantsFromSanitarySizes(updated);
                          }
                        }}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#0284C7', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Auto Multipliers
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        1/2" (20mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="150"
                        value={sanitarySizes.half}
                        onChange={(e) => handleSanitarySizeChange('half', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        3/4" (25mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="220"
                        value={sanitarySizes.threeQuarter}
                        onChange={(e) => handleSanitarySizeChange('threeQuarter', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        1" (32mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="320"
                        value={sanitarySizes.one}
                        onChange={(e) => handleSanitarySizeChange('one', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        1.25" / Sawa Inch (40mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="480"
                        value={sanitarySizes.sawa}
                        onChange={(e) => handleSanitarySizeChange('sawa', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        1.5" / Dhed Inch (50mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="650"
                        value={sanitarySizes.dhed}
                        onChange={(e) => handleSanitarySizeChange('dhed', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        2" / Do Inch (63mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="980"
                        value={sanitarySizes.two}
                        onChange={(e) => handleSanitarySizeChange('two', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        3" (90mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1800"
                        value={sanitarySizes.three}
                        onChange={(e) => handleSanitarySizeChange('three', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        4" (110mm)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="2700"
                        value={sanitarySizes.four}
                        onChange={(e) => handleSanitarySizeChange('four', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6b. Dedicated Sanitary Pipe Lengths (Per Foot / 10ft / 13ft / 20ft) ── */}
              {pricingType === 'retail_pipe_lengths' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ruler size={18} color="#0284C7" />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Pipe Lengths & Running Foot (FT / 10ft / 13ft / 20ft)
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                          Pipes sold per running foot or standard full length pipes (PPRC standard length is 13ft / 4m)
                        </p>
                      </div>
                    </div>

                    {/* Quick Auto Lengths */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                        Per Foot Price:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 80"
                        value={bulkPipeFootPrice}
                        onChange={(e) => setBulkPipeFootPrice(e.target.value)}
                        style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkPipeFootPrice) {
                            const pNum = Number(bulkPipeFootPrice);
                            const updated = {
                              foot1: String(pNum),
                              ft10: String(pNum * 10),
                              ft13: String(pNum * 13),
                              ft20: String(pNum * 20),
                            };
                            setPipeLengthSizes(updated);
                            rebuildVariantsFromPipeLengthSizes(updated);
                          }
                        }}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#0284C7', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Auto Fill Lengths
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Per Foot (1 FT)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="80"
                        value={pipeLengthSizes.foot1}
                        onChange={(e) => handlePipeLengthSizeChange('foot1', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        10 Feet Length (Standard)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="800"
                        value={pipeLengthSizes.ft10}
                        onChange={(e) => handlePipeLengthSizeChange('ft10', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        13 Feet Length (Standard PPRC)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1040"
                        value={pipeLengthSizes.ft13}
                        onChange={(e) => handlePipeLengthSizeChange('ft13', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        20 Feet Length
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1600"
                        value={pipeLengthSizes.ft20}
                        onChange={(e) => handlePipeLengthSizeChange('ft20', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6c. Dedicated Showers & Taps Sets (Single Toti vs Complete Set) ── */}
              {pricingType === 'retail_bath_sets' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Sparkles size={18} color="#0284C7" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Showers & Taps Sets (Single Toti vs Complete Bathroom Set)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter individual pricing for bib cocks, muslim shower, shower head, or complete master bathroom set
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Single Piece (Toti / Bib Cock)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="850"
                        value={bathSetSizes.singlePiece}
                        onChange={(e) => handleBathSetSizeChange('singlePiece', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Muslim Shower Only
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1250"
                        value={bathSetSizes.muslimShower}
                        onChange={(e) => handleBathSetSizeChange('muslimShower', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Shower Head & Arm
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="2200"
                        value={bathSetSizes.showerHead}
                        onChange={(e) => handleBathSetSizeChange('showerHead', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Complete Bath Set (Taps+Mixer+Shower)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="14500"
                        value={bathSetSizes.completeSet}
                        onChange={(e) => handleBathSetSizeChange('completeSet', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 6. Dedicated Hardware Paint Containers (Quarter, Gallon, Balti) ── */}
              {pricingType === 'retail_paint' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wrench size={18} color="#D97706" />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Paint Container Volumes (Quarter 1L, Gallon 4L, Balti 16L)
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                          Enter pricing for paint tins, emulsions, distempers or coatings
                        </p>
                      </div>
                    </div>

                    {/* Quick Same Price tool */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                        Quarter Base Price:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 950"
                        value={bulkPaintPrice}
                        onChange={(e) => setBulkPaintPrice(e.target.value)}
                        style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkPaintPrice) {
                            const pNum = Number(bulkPaintPrice);
                            const updated = {
                              quarter: String(pNum),
                              gallon: String(pNum * 3.6),
                              balti: String(pNum * 13.5),
                            };
                            setPaintSizes(updated);
                            rebuildVariantsFromPaintSizes(updated);
                          }
                        }}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#D97706', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Auto Fill Matrix
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Quarter (1 Liter Tin)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="950"
                        value={paintSizes.quarter}
                        onChange={(e) => handlePaintSizeChange('quarter', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Gallon (4 Liters Tin)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="3400"
                        value={paintSizes.gallon}
                        onChange={(e) => handlePaintSizeChange('gallon', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Balti / Bucket (16 Liters Drum)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="12800"
                        value={paintSizes.balti}
                        onChange={(e) => handlePaintSizeChange('balti', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 7. Dedicated Electrical Wire Gauges & Coils ── */}
              {pricingType === 'retail_wire' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={18} color="#EAB308" />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                          Wire Gauge & Coil Sizes (1.5mm, 2.5mm, 7/29, 7/36, Coil 90m)
                        </span>
                        <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                          Enter pricing for copper cables and coil bundles
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
                        Same Rate:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 450"
                        value={bulkWirePrice}
                        onChange={(e) => setBulkWirePrice(e.target.value)}
                        style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bulkWirePrice) {
                            const updated = {
                              w1_5: bulkWirePrice,
                              w2_5: String(Number(bulkWirePrice) * 1.6),
                              w7_29: String(Number(bulkWirePrice) * 1.8),
                              w7_36: String(Number(bulkWirePrice) * 2.2),
                              wcoil: String(Number(bulkWirePrice) * 90),
                            };
                            setWireSizes(updated);
                            rebuildVariantsFromWireSizes(updated);
                          }
                        }}
                        style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#EAB308', color: '#000', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Auto Fill
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        1.5mm Cable
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="180"
                        value={wireSizes.w1_5}
                        onChange={(e) => handleWireSizeChange('w1_5', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        2.5mm Cable
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="280"
                        value={wireSizes.w2_5}
                        onChange={(e) => handleWireSizeChange('w2_5', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        7/29 Wire
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="320"
                        value={wireSizes.w7_29}
                        onChange={(e) => handleWireSizeChange('w7_29', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        7/36 Wire
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="420"
                        value={wireSizes.w7_36}
                        onChange={(e) => handleWireSizeChange('w7_36', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Coil (90m Roll)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="8500"
                        value={wireSizes.wcoil}
                        onChange={(e) => handleWireSizeChange('wcoil', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 8. Dedicated LED Wattage Variants ── */}
              {pricingType === 'retail_wattage' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Zap size={18} color="#EAB308" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        LED Bulb / Panel Wattages (5W, 12W, 18W, 24W)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter pricing for bulbs and ceiling lights by wattage
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        5 Watt
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="220"
                        value={wattageSizes.w5}
                        onChange={(e) => handleWattageSizeChange('w5', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        12 Watt
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="350"
                        value={wattageSizes.w12}
                        onChange={(e) => handleWattageSizeChange('w12', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        18 Watt
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="520"
                        value={wattageSizes.w18}
                        onChange={(e) => handleWattageSizeChange('w18', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        24 Watt
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="750"
                        value={wattageSizes.w24}
                        onChange={(e) => handleWattageSizeChange('w24', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 9. Dedicated Pharmacy Strip & Box ── */}
              {pricingType === 'retail_pharma_strip' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <HeartPulse size={18} color="#0284C7" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Medicine Strip & Full Box
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter pricing for single blister strip and complete box pack
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Strip (10 Tablets)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="80"
                        value={pharmaStripSizes.strip}
                        onChange={(e) => handlePharmaStripSizeChange('strip', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Full Box (100 Tablets)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="750"
                        value={pharmaStripSizes.box}
                        onChange={(e) => handlePharmaStripSizeChange('box', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 10. Dedicated Pharmacy Syrup Volumes ── */}
              {pricingType === 'retail_pharma_syrup' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Package size={18} color="#0284C7" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Syrup & Suspension Bottles (60ml, 120ml)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter pricing for pediatric and standard syrup bottles
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        60ml Bottle
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="110"
                        value={pharmaSyrupSizes.ml60}
                        onChange={(e) => handlePharmaSyrupSizeChange('ml60', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        120ml Bottle
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="195"
                        value={pharmaSyrupSizes.ml120}
                        onChange={(e) => handlePharmaSyrupSizeChange('ml120', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 11. Dedicated Electronics Storage Variants ── */}
              {pricingType === 'retail_storage' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Smartphone size={18} color="#3B82F6" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Internal Storage (64GB, 128GB, 256GB, 512GB)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter pricing for smartphones, tablets or memory devices
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        64GB
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="38000"
                        value={storageSizes.gb64}
                        onChange={(e) => handleStorageSizeChange('gb64', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        128GB
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="45000"
                        value={storageSizes.gb128}
                        onChange={(e) => handleStorageSizeChange('gb128', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        256GB
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="54000"
                        value={storageSizes.gb256}
                        onChange={(e) => handleStorageSizeChange('gb256', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        512GB
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="68000"
                        value={storageSizes.gb512}
                        onChange={(e) => handleStorageSizeChange('gb512', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 12. Dedicated Bakery Sweets Box ── */}
              {pricingType === 'retail_bakery' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Cake size={18} color="#F59E0B" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Sweets / Mithai Packing Box (250g, 500g, 1 KG, 2 KG)
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter packing rates for traditional sweets and confectionery
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        250g Box
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="350"
                        value={bakerySizes.g250}
                        onChange={(e) => handleBakerySizeChange('g250', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        500g Box (Half KG)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="680"
                        value={bakerySizes.g500}
                        onChange={(e) => handleBakerySizeChange('g500', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        1 KG Box
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="1300"
                        value={bakerySizes.kg1}
                        onChange={(e) => handleBakerySizeChange('kg1', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        2 KG Family Box
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="2500"
                        value={bakerySizes.kg2}
                        onChange={(e) => handleBakerySizeChange('kg2', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── 13. Dedicated Single vs Carton Packs ── */}
              {pricingType === 'retail_packs' && (
                <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Boxes size={18} color="#059669" />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Single Piece vs Wholesale Carton / Box
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
                        Enter individual retail price and whole carton wholesale price
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Single Piece (Retail)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="150"
                        value={packSizes.single}
                        onChange={(e) => handlePackSizeChange('single', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: tokens.colorNeutralForeground2 }}>
                        Full Carton / Box (Wholesale)
                      </label>
                      <CustomInput
                        type="number"
                        placeholder="3200"
                        value={packSizes.carton}
                        onChange={(e) => handlePackSizeChange('carton', e.target.value)}
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
                    <DrinkToGo20Regular style={{ width: 16, height: 16, color: '#E51937' }} />
                    <span>Cold Drink Size Pricing (PKR)</span>
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
                    <Drop20Regular style={{ width: 16, height: 16, color: '#0284C7' }} />
                    <span>Mineral Water Size Pricing (PKR)</span>
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
            {!isVariantPricingType(pricingType) && pricingType !== 'custom' && (
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
                        <div>
                          <CustomInput
                            label={pricingType === 'perkg' || pricingType === 'amountse' ? 'Stock Weight (KG / Grams - Read-only)' : 'Stock Quantity (Read-only)'}
                            type="number"
                            readOnly
                            disabled
                            placeholder="0"
                            value={field.value !== undefined ? String(field.value) : '0'}
                            onChange={() => {}}
                            error={productForm.formState.errors.openingStock?.message}
                          />
                          <div style={{ marginTop: '4px', fontSize: '11px', color: tokens.colorNeutralForeground3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Package style={{ width: 13, height: 13 }} />
                              Initial stock: <strong>0</strong> (Add via Stock In)
                            </span>
                            {watchedCategory && (
                              <span style={{ color: '#2563EB', fontWeight: 600 }}>
                                Category &quot;{watchedCategory}&quot;: {categoryStockInfo.totalStock} in stock ({categoryStockInfo.count} items)
                              </span>
                            )}
                          </div>
                        </div>
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
                    <Scales20Regular style={{ width: 22, height: 22, color: '#E51937', flexShrink: 0 }} />
                    <div>
                      <b style={{ color: '#E51937' }}>Rupees Sale (Budget Mode Active):</b> Cashier can enter exact Rupee amount (e.g. Rs 50 or Rs 100) on the POS Counter card, and the system will automatically calculate the weight.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Optional Cost Price & Opening Stock for Multi-Size/Portion Products */}
            {isVariantPricingType(pricingType) && (
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
                      <div>
                        <CustomInput
                          label="Total Opening Stock (Read-only)"
                          type="number"
                          readOnly
                          disabled
                          placeholder="0"
                          value={field.value !== undefined ? String(field.value) : '0'}
                          onChange={() => {}}
                          error={productForm.formState.errors.openingStock?.message}
                        />
                          <div style={{ marginTop: '4px', fontSize: '11px', color: tokens.colorNeutralForeground3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Package style={{ width: 13, height: 13 }} />
                              Initial stock: <strong>0</strong> (Add via Stock In)
                            </span>
                          {watchedCategory && (
                            <span style={{ color: '#2563EB', fontWeight: 600 }}>
                              Category &quot;{watchedCategory}&quot;: {categoryStockInfo.totalStock} in stock ({categoryStockInfo.count} items)
                            </span>
                          )}
                        </div>
                      </div>
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
                      value={field.value || categoryUnitOptions[0]?.value || 'PCS'}
                      options={categoryUnitOptions}
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
                            style={{ fontWeight: 800, color: '#E51937', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Flash20Regular style={{ width: 14, height: 14 }} />
                            <span>Auto Barcode</span>
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
                : activeItemType
                  ? activeItemType.suggestedUnits
                  : (detectedProfile === 'hardware' && isSanitaryCategory(watchedCategory || ''))
                    ? ['PCS', 'SET', 'FEET', 'LENGTH', 'RFT', 'INCH', 'ROLL', 'TUBE', 'PACK', 'DOZEN', 'PAIR', 'METER']
                    : (detectedProfile === 'hardware' && /paint|distemper|color|coating/i.test(watchedCategory || ''))
                      ? ['GALLON', 'QUARTER', 'BALTI', 'LITER', 'KG', 'PCS']
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
                            boxSizing: 'border-box',
                            fontWeight: 600,
                            border: `1.5px solid ${isSelected ? profileConfig.accentColor : tokens.colorNeutralStroke1}`,
                            backgroundColor: isSelected ? `${profileConfig.accentColor}25` : tokens.colorNeutralBackground1,
                            color: isSelected ? profileConfig.accentColor : tokens.colorNeutralForeground2,
                            transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
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
                              boxSizing: 'border-box',
                              border: `1.5px solid ${isSelected ? profileConfig.accentColor : tokens.colorNeutralStroke1}`,
                              backgroundColor: isSelected ? `${profileConfig.accentColor}22` : tokens.colorNeutralBackground1,
                              color: isSelected ? profileConfig.accentColor : tokens.colorNeutralForeground1,
                              fontWeight: 600,
                              transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                            }}
                          >
                            <span>{size}</span>
                            {isSelected && <Checkmark16Filled style={{ width: 12, height: 12 }} />}
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
                  className={styles.hiddenInput}
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
                      <Image20Regular className={styles.noPhotoIcon} />
                      <span className={styles.noPhotoText}>No photo</span>
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#E51937',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'default',
                      }}
                    >
                      <Add20Regular style={{ width: 12, height: 12 }} />
                      <span>Add</span>
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
                  <Tag20Regular className={styles.tag20Icon} />
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
                  <CustomSelect
                    label="Select Category"
                    required
                    value={field.value || ''}
                    options={addCatDefaultOptions}
                    onChange={(val) => field.onChange(val)}
                    error={categoryForm.formState.errors.name?.message}
                  />
                )}
              />

              {hasFastFood && hasOmnimart && (
                <Controller
                  control={categoryForm.control}
                  name="module"
                  render={({ field }) => (
                    <CustomSelect
                      label="Target Store Module"
                      required
                      value={field.value}
                      options={[
                        { value: 'fastfood', label: 'Fast Food Menu' },
                        { value: 'minimart', label: profileConfig?.label || 'Retail Store' },
                      ]}
                      onChange={(val) => field.onChange(val as ModuleKey)}
                    />
                  )}
                />
              )}
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
