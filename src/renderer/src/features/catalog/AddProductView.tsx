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
import { useAppToast } from '../../context/AppNotificationContext';
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
  ALL_PROFILE_OPTIONS,
  getFilteredProfileOptions,
} from '@/lib/categoryProfiles';
import { UNIT_OPTIONS } from '@/lib/units';
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
    case 'cctv':
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
  profile: z.enum([
    'footwear',
    'apparel',
    'grocery',
    'cosmetics',
    'pharmacy',
    'electronics',
    'bakery',
    'food',
    'hardware',
    'electric',
    'cctv',
    'standard',
  ]).default('standard'),
});
type CategoryFormData = z.infer<typeof categorySchema>;

import { useAddProductStyles, useStyles } from './addProduct.styles';

export function AddProductView(): React.JSX.Element {
  const styles = useAddProductStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();

  const { can, businessProfiles = ['standard', 'food'], refreshModules } = useLicense();
  React.useEffect(() => {
    void refreshModules();
  }, [refreshModules]);
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const rawUrlModule = searchParams.get('module');
  const normalizedUrlModule: ModuleKey | null =
    rawUrlModule === 'minimart' || rawUrlModule === 'omnimart'
      ? 'minimart'
      : rawUrlModule === 'fastfood'
      ? 'fastfood'
      : null;

  const defaultModule: ModuleKey =
    normalizedUrlModule || (hasFastFood ? 'fastfood' : 'minimart');

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
      profile: defaultModule === 'fastfood' ? 'food' : 'standard',
    },
  });
  const [isAddCatCustomName, setIsAddCatCustomName] = useState(false);

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
    defaultModule
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

  const activeRetailProfileKey = React.useMemo<CategoryProfile>(() => {
    const specific = businessProfiles.find((p) => p !== 'standard' && p !== 'food');
    if (specific && specific in CATEGORY_PROFILES) return specific;
    if (detectedProfile && detectedProfile !== 'standard' && detectedProfile !== 'food') return detectedProfile;
    const queryCat = searchParams.get('category');
    if (queryCat) {
      const qp = detectCategoryProfile(queryCat);
      if (qp && qp !== 'standard' && qp !== 'food') return qp;
    }
    return 'standard';
  }, [businessProfiles, detectedProfile, searchParams]);

  const initialUrlCat = searchParams.get('category');
  const initialProf = initialUrlCat ? detectCategoryProfile(initialUrlCat) : null;
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>(
    initialProf && initialProf !== 'food' && initialProf !== 'standard' ? initialProf : 'all'
  );

  const mainCategoryOptions = React.useMemo(() => {
    const moduleCats = categories.filter((c) => c.module === watchedModule);
    if (watchedModule === 'fastfood') {
      const opts = [{ value: 'all', label: `All Kitchen Categories (${moduleCats.length})` }];
      if (!businessProfiles || businessProfiles.length === 0 || businessProfiles.includes('food')) {
        opts.push({ value: 'food', label: 'Fast Food & Pizzas' });
      }
      opts.push({ value: 'standard', label: 'General Food Items' });
      return opts;
    }

    const retailProfileLabels: Record<string, string> = {
      footwear: 'Footwear & Shoes',
      apparel: 'Garments & Clothing',
      grocery: 'Grocery & Supermarket',
      bakery: 'Bakery & Confectionery',
      cosmetics: 'Cosmetics & Beauty',
      pharmacy: 'Pharmacy & Health',
      hardware: 'Sanitary, Hardware & Paint',
      electric: 'Electrical Store & Lighting',
      electronics: 'Electronics & Mobile',
      cctv: 'CCTV & Surveillance',
      stationery: 'Books & Stationery',
      toys: 'Baby & Kids Toys',
      jewellery: 'Jewellery & Watches',
      optics: 'Optics & Eyewear',
      standard: 'General Retail',
    };

    // Filter available retail profiles strictly according to businessProfiles licensed from backend
    const allowedProfiles = new Set<string>(
      getFilteredProfileOptions('minimart', businessProfiles).map((p) => p.value)
    );

    const presentProfiles = new Set<string>();
    moduleCats.forEach((c) => {
      const prof = detectCategoryProfile(c.name, c.profile);
      if (prof && prof !== 'food') {
        if (allowedProfiles.size === 0 || allowedProfiles.has(prof)) {
          presentProfiles.add(prof);
        }
      }
    });

    const opts = [{ value: 'all', label: `All Retail Categories (${moduleCats.length})` }];

    presentProfiles.forEach((profKey) => {
      const label = retailProfileLabels[profKey] || profKey.toUpperCase();
      const count = moduleCats.filter((c) => detectCategoryProfile(c.name, c.profile) === profKey).length;
      opts.push({ value: profKey, label: `${label} (${count})` });
    });

    Object.entries(retailProfileLabels).forEach(([profKey, label]) => {
      if (
        !presentProfiles.has(profKey) &&
        profKey !== 'standard' &&
        (allowedProfiles.size === 0 || allowedProfiles.has(profKey))
      ) {
        opts.push({ value: profKey, label });
      }
    });

    return opts;
  }, [categories, watchedModule, businessProfiles]);

  const filteredCategories = React.useMemo(() => {
    const moduleCats = categories.filter((c) => c.module === watchedModule);
    if (moduleCats.length === 0) return categories;

    if (selectedMainCategory === 'all') {
      return moduleCats;
    }

    const matched = moduleCats.filter((c) => {
      const prof = detectCategoryProfile(c.name, c.profile);
      return prof === selectedMainCategory;
    });

    if (matched.length > 0) return matched;
    return moduleCats;
  }, [categories, watchedModule, selectedMainCategory]);

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
    } else if (pricingType === 'retail_shoes') {
      setPricingType('fixed');
      productForm.setValue('pricingType', 'fixed');
      setVariants([]);
      setHasVariants(false);
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

  const applyCategoryProfileSettings = (categoryName: string) => {
    const matchedCat = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    const detected = detectCategoryProfile(categoryName, matchedCat?.profile);
    const pCfg = CATEGORY_PROFILES[detected];

    if (detected && detected !== 'food' && detected !== 'standard') {
      setSelectedMainCategory(detected);
    }

    if (detected === 'hardware') {
      if (isSanitaryCategory(categoryName)) {
        productForm.setValue('unit', 'PCS');
        setPricingType('fixed');
        productForm.setValue('pricingType', 'fixed');
        setVariants([]);
        setHasVariants(false);
      } else if (/paint|distemper|color|coating/i.test(categoryName)) {
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
      const preset = getShoePresetForCategory(categoryName);
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
    } else {
      // General Retail / standard: reset to fixed price and clear shoe/apparel variants
      setPricingType('fixed');
      productForm.setValue('pricingType', 'fixed');
      setVariants([]);
      setHasVariants(false);
      productForm.setValue('unit', pCfg?.suggestedUnits?.[0] || 'PCS');
    }
  };

  // Keep activeDepartmentTab in sync whenever watchedModule changes
  useEffect(() => {
    if (watchedModule === 'fastfood' || watchedModule === 'minimart') {
      setActiveDepartmentTab(watchedModule);
    }
  }, [watchedModule]);

  // Synchronize URL parameters (module, category, returnUrl) dynamically
  useEffect(() => {
    const rawModule = searchParams.get('module');
    const queryCat = searchParams.get('category');

    let targetModule: ModuleKey | null = null;
    if (rawModule === 'minimart' || rawModule === 'omnimart') {
      targetModule = 'minimart';
    } else if (rawModule === 'fastfood') {
      targetModule = 'fastfood';
    }

    let targetCategoryName: string | null = null;
    if (queryCat) {
      const matched = categories.find((c) => c.name.toLowerCase() === queryCat.toLowerCase());
      if (matched) {
        targetCategoryName = matched.name;
        if (!targetModule) targetModule = matched.module as ModuleKey;
      } else {
        targetCategoryName = queryCat;
      }
    }

    if (targetModule) {
      productForm.setValue('module', targetModule);
      setActiveDepartmentTab(targetModule);
    }

    if (targetCategoryName) {
      productForm.setValue('category', targetCategoryName);
      applyCategoryProfileSettings(targetCategoryName);
    } else if (categories.length > 0 && targetModule) {
      const fallbackCat = categories.find((c) => c.module === targetModule);
      if (fallbackCat && !categories.some((c) => c.name === productForm.getValues('category') && c.module === targetModule)) {
        productForm.setValue('category', fallbackCat.name);
        applyCategoryProfileSettings(fallbackCat.name);
      }
    }
  }, [searchParams, categories]);

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
        notifyWarning('Please enter a price for at least one pizza size (Small, Medium, Large, XL).');
        throw new Error('No pizza size price entered');
      }
      if (pricingType === 'retail_garments' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one garment size (XS, S, M, L, XL, etc.).');
        throw new Error('No garment size price entered');
      }
      if (pricingType === 'retail_shoes') {
        if (variants.length === 0) {
          notifyWarning('Please select at least one shoe size for this article.');
          throw new Error('No shoe size selected');
        }
        if (!data.price || data.price <= 0) {
          notifyWarning('Please enter a retail selling price for this shoe article.');
          throw new Error('No retail price entered');
        }
      }
      if (pricingType === 'retail_sanitary_sizes' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one pipe or fitting size (1/2" to 4").');
        throw new Error('No sanitary size price entered');
      }
      if (pricingType === 'retail_pipe_lengths' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one pipe length or per foot.');
        throw new Error('No pipe length price entered');
      }
      if (pricingType === 'retail_bath_sets' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one shower / tap set option.');
        throw new Error('No bath set price entered');
      }
      if (pricingType === 'retail_paint' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one paint container size (Quarter, Gallon, Balti).');
        throw new Error('No paint container price entered');
      }
      if (pricingType === 'retail_wire' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one wire gauge or coil.');
        throw new Error('No wire gauge price entered');
      }
      if (pricingType === 'retail_wattage' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one wattage variant.');
        throw new Error('No wattage price entered');
      }
      if (pricingType === 'retail_pharma_strip' && variants.length === 0) {
        notifyWarning('Please enter a price for Strip or Box.');
        throw new Error('No pharma strip price entered');
      }
      if (pricingType === 'retail_pharma_syrup' && variants.length === 0) {
        notifyWarning('Please enter a price for syrup bottle volume.');
        throw new Error('No syrup price entered');
      }
      if (pricingType === 'retail_storage' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one storage variant (64GB - 512GB).');
        throw new Error('No storage price entered');
      }
      if (pricingType === 'retail_bakery' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one sweet box size (250g - 2 KG).');
        throw new Error('No bakery box price entered');
      }
      if (pricingType === 'retail_packs' && variants.length === 0) {
        notifyWarning('Please enter a price for Single piece or Carton.');
        throw new Error('No pack price entered');
      }
      if (pricingType === 'retail_shades' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one shade or color.');
        throw new Error('No shade price entered');
      }
      if (pricingType === 'retail_volumes' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one pack or bottle volume.');
        throw new Error('No volume price entered');
      }
      if (pricingType === 'halffull' && variants.length === 0) {
        notifyWarning('Please enter a price for Half or Full portion.');
        throw new Error('No portion price entered');
      }
      if (pricingType === 'drinks' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one drink size.');
        throw new Error('No drink size price entered');
      }
      if (pricingType === 'water' && variants.length === 0) {
        notifyWarning('Please enter a price for at least one water bottle size.');
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
  const watchedCatProfile = categoryForm.watch('profile') || (watchedCatModule === 'fastfood' ? 'food' : 'standard');
  const addCatProfileConfig = CATEGORY_PROFILES[watchedCatProfile as CategoryProfile] || CATEGORY_PROFILES.standard;

  const addCatProfileOptions = React.useMemo(() => {
    return getFilteredProfileOptions(watchedCatModule, businessProfiles);
  }, [watchedCatModule, businessProfiles]);

  const addCatDefaultOptions = React.useMemo(() => {
    const backendCategories = addCatProfileConfig.defaultCategories || [];
    const list = backendCategories;

    const existing = new Set(categories.filter((c) => c.module === watchedCatModule).map((c) => c.name.toLowerCase().trim()));
    return list.map((catName) => {
      const isAlreadyAdded = existing.has(catName.toLowerCase().trim());
      return {
        value: catName,
        label: isAlreadyAdded ? `${catName} (Already Added)` : catName,
        disabled: isAlreadyAdded,
      };
    });
  }, [addCatProfileConfig, categories, watchedCatModule]);

  useEffect(() => {
    if (isCategoryDialogOpen && addCatDefaultOptions.length > 0 && !isAddCatCustomName) {
      const currentName = categoryForm.getValues('name');
      const currentOpt = addCatDefaultOptions.find((opt) => opt.value === currentName);
      if (!currentOpt || currentOpt.disabled) {
        const firstAvail = addCatDefaultOptions.find((opt) => !opt.disabled)?.value || addCatDefaultOptions[0].value;
        categoryForm.setValue('name', firstAvail);
      }
    }
  }, [isCategoryDialogOpen, addCatDefaultOptions, categoryForm, isAddCatCustomName]);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const prof = data.profile || (data.module === 'fastfood' ? 'food' : 'standard');
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
      applyCategoryProfileSettings(newCat.name);
      setIsCategoryDialogOpen(false);
      categoryForm.reset({
        name: '',
        module: watchedModule,
        profile: watchedModule === 'fastfood' ? 'food' : 'standard',
      });
      setIsAddCatCustomName(false);
    },
  });

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notifyWarning('Image exceeds 5MB limit. Please choose a smaller image.');
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
      <form onSubmit={productForm.handleSubmit(onSubmit)} className={styles.apStyle_1}>
        {/* ── Visual Department Selection Cards (Super Easy for Any User) ── */}
        <div className={styles.apRemCard1}>
          <div className={styles.apStyle_3}>
            <div>
              <span className={styles.apStyle_4}>
                Department Selection:
              </span>
              <p className={styles.apStyle_5}>
                Select department for this product:
              </p>
            </div>
            <div className={styles.apStyle_6}>
              <span
                className={activeDepartmentTab === 'fastfood' ? styles.apDeptBadgeFastFood : styles.apDeptBadgeMinimart}
              >
                {activeDepartmentTab === 'fastfood'
                  ? '● Active: Fast Food & Kitchen Menu'
                  : '● Active: Retail Mini Mart'}
              </span>
            </div>
          </div>

          {/* Department Selection Cards (Shown only when multiple modules exist) */}
          {hasFastFood && hasOmnimart ? (
            <div className={styles.apStyle_8}>
              {/* Fast Food Card */}
              <button
                type="button"
                onClick={() => {
                  setActiveDepartmentTab('fastfood');
                  productForm.setValue('module', 'fastfood');
                  setSelectedMainCategory('all');
                  const ffCat = categories.find((c) => c.module === 'fastfood');
                  if (ffCat) {
                    productForm.setValue('category', ffCat.name);
                    applyCategoryProfileSettings(ffCat.name);
                  } else {
                    productForm.setValue('unit', 'PCS');
                    handlePricingTypeSelect('fixed');
                  }
                }}
                className={mergeClasses(styles.apDeptCardBase, activeDepartmentTab === 'fastfood' ? styles.apDeptCardFastFoodActive : styles.apDeptCardFastFoodInactive)}
              >
                <div
                  className={mergeClasses(styles.apDeptIconBase, activeDepartmentTab === 'fastfood' ? styles.apDeptIconFastFoodActive : styles.apDeptIconFastFoodInactive)}
                >
                  <Food24Regular className={styles.apStyle_11} />
                </div>
                <div className={styles.apStyle_12}>
                  <div className={styles.apStyle_13}>
                    <span className={mergeClasses(styles.apDeptTextTitleBase, activeDepartmentTab === 'fastfood' ? styles.apDeptTextTitleFastFoodActive : styles.apDeptTextTitleInactive)}>
                      Fast Food & Kitchen Menu
                    </span>
                    {activeDepartmentTab === 'fastfood' && (
                      <CheckmarkCircle20Filled className={styles.apStyle_15} />
                    )}
                  </div>
                  <span className={styles.apStyle_16}>
                    Burgers, Pizzas, Deals, Karahi &bull; Kitchen KOT screen dispatch
                  </span>
                </div>
              </button>

              {/* Retail Mini Mart Card */}
              <button
                type="button"
                onClick={() => {
                  setActiveDepartmentTab('minimart');
                  productForm.setValue('module', 'minimart');
                  setSelectedMainCategory('all');
                  const mmCat = categories.find((c) => c.module === 'minimart');
                  if (mmCat) {
                    productForm.setValue('category', mmCat.name);
                    applyCategoryProfileSettings(mmCat.name);
                  } else {
                    if (!productForm.getValues('skuCode')) productForm.setValue('skuCode', generateRandomSku());
                    productForm.setValue('unit', 'PCS');
                    handlePricingTypeSelect('fixed');
                  }
                }}
                className={mergeClasses(styles.apDeptCardBase, activeDepartmentTab === 'minimart' ? styles.apDeptCardMinimartActive : styles.apDeptCardMinimartInactive)}
              >
                <div
                  className={mergeClasses(styles.apDeptIconBase, activeDepartmentTab === 'minimart' ? styles.apDeptIconMinimartActive : styles.apDeptIconMinimartInactive)}
                >
                  <ShoppingBag24Regular className={styles.apStyle_11} />
                </div>
                <div className={styles.apStyle_12}>
                  <div className={styles.apStyle_13}>
                    <span className={mergeClasses(styles.apDeptTextTitleBase, activeDepartmentTab === 'minimart' ? styles.apDeptTextTitleMinimartActive : styles.apDeptTextTitleInactive)}>
                      Retail Mini Mart
                    </span>
                    {activeDepartmentTab === 'minimart' && (
                      <CheckmarkCircle20Filled className={styles.apStyle_20} />
                    )}
                  </div>
                  <span className={styles.apStyle_16}>
                    Supermarket, Footwear, Garments, Sanitary & Retail Inventory
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <div
              className={styles.apRemCard2}
            >
              {hasFastFood ? (
                <>
                  <div
                    className={styles.apRemIconRed36}
                  >
                    <Food24Regular className={styles.apStyle_23} />
                  </div>
                  <div>
                    <span className={styles.apStyle_24}>
                      Fast Food & Kitchen Catalog
                    </span>
                    <span className={styles.apStyle_16}>
                      Products created here are routed to kitchen KDS screens and POS food counter
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={styles.apRemIconBlue36}
                  >
                    <ShoppingBag24Regular className={styles.apStyle_23} />
                  </div>
                  <div>
                    <span className={styles.apStyle_24}>
                      Retail Mini Mart Catalog
                    </span>
                    <span className={styles.apStyle_16}>
                      Supermarket, Footwear, Garments, Sanitary & Retail Inventory
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
            {/* Main Category & Product Category */}
            <div className={styles.twoColGrid}>
              <div className={styles.colEnd}>
                <CustomSelect
                  label="Main Category"
                  value={selectedMainCategory}
                  options={mainCategoryOptions}
                  onChange={(val) => {
                    setSelectedMainCategory(val);
                    const moduleCats = categories.filter((c) => c.module === watchedModule);
                    if (val !== 'all') {
                      const inGroup = moduleCats.filter((c) => detectCategoryProfile(c.name, c.profile) === val);
                      if (inGroup.length > 0 && !inGroup.some((c) => c.name === watchedCategory)) {
                        productForm.setValue('category', inGroup[0].name);
                        applyCategoryProfileSettings(inGroup[0].name);
                      }
                    }
                  }}
                />
              </div>

              <div className={styles.colEnd}>
                <div className={styles.flexEndRow}>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      categoryForm.reset({
                        name: '',
                        module: watchedModule,
                        profile: watchedModule === 'fastfood' ? 'food' : 'standard',
                      });
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
                    const displayList = filteredCategories.length > 0 ? filteredCategories : categories;

                    return (
                      <CustomSelect
                        label={watchedModule === 'fastfood' ? 'Food Category' : 'Retail Category'}
                        required
                        placeholder="Select Category"
                        value={field.value}
                        options={displayList.map((c) => ({ value: c.name, label: c.name }))}
                        onChange={(val) => {
                          field.onChange(val);
                          applyCategoryProfileSettings(val);
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
                className={styles.apAccentWrapCard} ref={(el) => { if (el && selectedItemTypeId) el.style.borderColor = `${profileConfig.accentColor || '#0284C7'}60`; }}
              >
                <div className={styles.apStyle_27}>
                  <div className={styles.apStyle_28}>
                    <span className={styles.apStyle_29}>
                      Specific Item Type / Sub-Category:
                    </span>
                    <span className={styles.apStyle_30}>
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
                      className={styles.apStyle_31}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
                <div className={styles.apStyle_32}>
                  {availableItemTypes.map((itemType) => {
                    const isSelected = selectedItemTypeId === itemType.id;
                    const accent = profileConfig.accentColor || '#0284C7';
                    const renderItemTypeIcon = (iconName?: string) => {
                      const iconStyle = { width: '14px', height: '14px', flexShrink: 0, color: isSelected ? accent : 'inherit' };
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
                        className={mergeClasses(styles.apAccentPillBase, isSelected ? undefined : styles.apAccentPillInactive)} ref={(el) => { if (el && isSelected) { el.style.borderColor = accent; el.style.backgroundColor = `${accent}22`; el.style.color = accent; el.style.boxShadow = `0 2px 8px ${accent}35`; } }}
                      >
                        {isSelected ? (
                          <Checkmark16Filled className={styles.icon14} ref={(el) => { if (el) (el as unknown as HTMLElement).style.color = accent; }} />
                        ) : (
                          renderItemTypeIcon(itemType.iconName)
                        )}
                        <span ref={(el) => { if (el && isSelected) el.style.color = accent; }}>{itemType.name}</span>
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
              <div className={styles.apStyle_36}>
                <label className={mergeClasses(styles.pricingTypeLabel, styles.apStyle_37)}>
                  Pricing Type <span className={styles.requiredStar}>*</span>
                  {watchedModule !== 'fastfood' && (
                    <span className={styles.apSanitaryLink} ref={(el) => { if (el) el.style.color = isSanitaryCategory(watchedCategory || '') ? '#0284C7' : profileConfig.accentColor; }}>
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
                      className={mergeClasses(styles.pricingTypeBtn, isSelected && styles.pricingTypeBtnActive, isSelected && styles.apBtnSelectActive)}
                    >
                      <Icon size={14} className={mergeClasses(styles.flexShrink0, isSelected && styles.apBtnSelectStrokeWhite)} />
                      <span className={isSelected ? styles.apBtnSelectTextWhite : undefined}>{displayLabel}</span>
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
                <div className={styles.apStyle_42}>
                  <div className={styles.apStyle_43}>
                    Pizza Size Pricing (PKR)
                  </div>
                  <div className={styles.apStyle_44}>
                    <div>
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                  <div className={styles.apStyle_46}>
                    Leave empty to exclude that size option
                  </div>
                </div>
              )}

              {/* ── 2. Dedicated Retail Garment Sizes: S, M, L, XL ── */}
              {pricingType === 'retail_garments' && (
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_48}>
                    <div className={styles.apStyle_28}>
                      <Shirt size={18} color="#E51937" />
                      <div>
                        <span className={styles.apStyle_49}>
                          Garment Sizes (S, M, L, XL)
                        </span>
                        <p className={styles.apStyle_50}>
                          Enter pricing for stitched kurtas, suits, shirts, or trousers
                        </p>
                      </div>
                    </div>

                    {/* Quick Same Price tool */}
                    <div className={styles.apStyle_6}>
                      <span className={styles.apStyle_51}>
                        Same price for all:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 2450"
                        value={bulkGarmentPrice}
                        onChange={(e) => setBulkGarmentPrice(e.target.value)}
                        className={styles.apStyle_52}
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
                        className={styles.apStyle_53}
                      >
                        Apply to All
                      </button>
                    </div>
                  </div>

                  <div className={styles.apStyle_54}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                    className={styles.apRemSectionCard16}
                  >
                    {/* Header: Title, Category Match Notice & Unified Article Price */}
                    <div
                      className={styles.apRemSectionHeaderRow}
                    >
                      <div className={styles.apStyle_58}>
                        <div
                          className={styles.apRemBadgeRedGlow36}
                        >
                          <Footprints size={20} color="#E51937" />
                        </div>
                        <div>
                          <div className={styles.apStyle_28}>
                            <span className={styles.apStyle_60}>
                              Footwear Article Sizes
                            </span>
                            <span
                              className={styles.apRemPillRedBorder}
                            >
                              {watchedCategory || 'Kids Footwear'}
                            </span>
                          </div>
                          <p className={styles.apStyle_62}>
                            Select available sizes in this article. In shoe retail, all sizes share one unified retail price.
                          </p>
                        </div>
                      </div>

                      {/* Unified Selling Price Display & Quick Edit */}
                      <div
                        className={styles.apRemRowStroke1}
                      >
                        <div className={styles.apStyle_64}>
                          <div className={styles.apStyle_65}>
                            Unified Selling Price:
                          </div>
                          <div className={activePriceNum > 0 ? styles.apPriceNumGreen : styles.apPriceNumAmber}>
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
                          className={styles.apRemInput105}
                        />
                      </div>
                    </div>

                    {/* Preset Switcher (Category-filtered: Kids Footwear only shows Kids/Baby/Youth; Men's only shows Men's) */}
                    <div>
                      <div className={styles.apStyle_36}>
                        <span className={styles.apStyle_68}>
                          {availablePresets.length > 1 ? 'Category Size Ranges:' : `Standard Range: ${currentPreset.name} (${currentPreset.rangeText})`}
                        </span>
                        <div className={styles.apStyle_69}>
                          <button
                            type="button"
                            onClick={() => handleSelectAllShoeSizesInPreset(currentPreset.sizes)}
                            className={styles.apRemBtnRedOutline}
                          >
                            Select All ({currentPreset.rangeText})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeselectShoePreset(currentPreset.sizes)}
                            className={styles.apRemBtnNeutralOutline}
                          >
                            Deselect Range
                          </button>
                        </div>
                      </div>

                      {availablePresets.length > 1 && (
                        <div className={styles.apStyle_32}>
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
                                className={mergeClasses(styles.apChipBase, isActive ? styles.apChipActive : styles.apChipInactive)}
                              >
                                <span>{preset.name}</span>
                                <span
                                  className={isActive ? styles.apChipBadgeActive : styles.apChipBadgeInactive}
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
                      <div className={styles.apStyle_74}>
                        Click to toggle sizes available for this article:
                      </div>

                      <div
                        className={styles.apRemGridAutoFill}
                      >
                        {currentPreset.sizes.map((sizeStr) => {
                          const isSelected = selectedShoeSizes.includes(sizeStr);
                          return (
                            <button
                              key={sizeStr}
                              type="button"
                              onClick={() => handleToggleShoeSize(sizeStr)}
                              className={mergeClasses(styles.apGridChipBase, isSelected ? styles.apGridChipActive : styles.apGridChipInactive)}
                            >
                              {isSelected ? (
                                <Checkmark16Filled className={styles.apStyle_77} />
                              ) : (
                                <span className={styles.apStyle_78} />
                              )}
                              <span className={styles.apStyle_79}>
                                {sizeStr} Size
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Size Addition */}
                      <div className={styles.apStyle_80}>
                        <span className={styles.apStyle_81}>
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
                          className={styles.apRemInput100}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomShoeSize}
                          className={styles.apRemBtnNeutralSolid}
                        >
                          + Add Size
                        </button>
                      </div>
                    </div>

                    {/* Article Summary Bar */}
                    <div
                      className={styles.apRemBoxRedTranslucent}
                    >
                      <div className={styles.apStyle_85}>
                        <span className={styles.apStyle_29}>
                          Article Summary:
                        </span>
                        <span className={styles.apStyle_86}>
                          <strong>{selectedShoeSizes.length}</strong> Sizes Selected ({selectedShoeSizes.join(', ') || 'None'})
                        </span>
                      </div>
                      <div className={styles.apStyle_87}>
                        <span className={styles.apStyle_86}>
                          Article Price: <strong className={styles.apStyle_88}>{activePriceNum > 0 ? formatPKR(activePriceNum) : 'Not Set'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── 4. Dedicated Retail Shades & Colors ── */}
              {pricingType === 'retail_shades' && (
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Palette size={18} color="#E51937" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Color Shades (#01, #08, #14, #22)
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter pricing for nail polish or lipstick shades
                      </p>
                    </div>
                  </div>
                  <div className={styles.apStyle_54}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Package size={18} color="#E51937" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Pack & Bottle Volumes (125ml, 250ml, 400ml)
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter pricing for lotion, shampoo, or powder sizes
                      </p>
                    </div>
                  </div>
                  <div className={styles.apStyle_90}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_48}>
                    <div className={styles.apStyle_28}>
                      <Droplets size={18} color="#0284C7" />
                      <div>
                        <span className={styles.apStyle_49}>
                          Pipe & Fitting Sizes Matrix (1/2" to 4" / 20mm to 110mm)
                        </span>
                        <p className={styles.apStyle_50}>
                          PPRC, UPVC, CPVC pipes, elbows, tees, sockets, unions & valves pricing
                        </p>
                      </div>
                    </div>

                    {/* Quick Auto Multiplier */}
                    <div className={styles.apStyle_6}>
                      <span className={styles.apStyle_51}>
                        1/2" Base Price:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 150"
                        value={bulkSanitaryPrice}
                        onChange={(e) => setBulkSanitaryPrice(e.target.value)}
                        className={styles.apStyle_52}
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
                        className={styles.apStyle_91}
                      >
                        Auto Multipliers
                      </button>
                    </div>
                  </div>

                  <div className={styles.apStyle_54}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_48}>
                    <div className={styles.apStyle_28}>
                      <Ruler size={18} color="#0284C7" />
                      <div>
                        <span className={styles.apStyle_49}>
                          Pipe Lengths & Running Foot (FT / 10ft / 13ft / 20ft)
                        </span>
                        <p className={styles.apStyle_50}>
                          Pipes sold per running foot or standard full length pipes (PPRC standard length is 13ft / 4m)
                        </p>
                      </div>
                    </div>

                    {/* Quick Auto Lengths */}
                    <div className={styles.apStyle_6}>
                      <span className={styles.apStyle_51}>
                        Per Foot Price:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 80"
                        value={bulkPipeFootPrice}
                        onChange={(e) => setBulkPipeFootPrice(e.target.value)}
                        className={styles.apStyle_52}
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
                        className={styles.apStyle_91}
                      >
                        Auto Fill Lengths
                      </button>
                    </div>
                  </div>

                  <div className={styles.apStyle_44}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Sparkles size={18} color="#0284C7" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Showers & Taps Sets (Single Toti vs Complete Bathroom Set)
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter individual pricing for bib cocks, muslim shower, shower head, or complete master bathroom set
                      </p>
                    </div>
                  </div>

                  <div className={styles.apStyle_44}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_48}>
                    <div className={styles.apStyle_28}>
                      <Wrench size={18} color="#D97706" />
                      <div>
                        <span className={styles.apStyle_49}>
                          Paint Container Volumes (Quarter 1L, Gallon 4L, Balti 16L)
                        </span>
                        <p className={styles.apStyle_50}>
                          Enter pricing for paint tins, emulsions, distempers or coatings
                        </p>
                      </div>
                    </div>

                    {/* Quick Same Price tool */}
                    <div className={styles.apStyle_6}>
                      <span className={styles.apStyle_51}>
                        Quarter Base Price:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 950"
                        value={bulkPaintPrice}
                        onChange={(e) => setBulkPaintPrice(e.target.value)}
                        className={styles.apStyle_52}
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
                        className={styles.apStyle_92}
                      >
                        Auto Fill Matrix
                      </button>
                    </div>
                  </div>

                  <div className={styles.apStyle_90}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_48}>
                    <div className={styles.apStyle_28}>
                      <Zap size={18} color="#EAB308" />
                      <div>
                        <span className={styles.apStyle_49}>
                          Wire Gauge & Coil Sizes (1.5mm, 2.5mm, 7/29, 7/36, Coil 90m)
                        </span>
                        <p className={styles.apStyle_50}>
                          Enter pricing for copper cables and coil bundles
                        </p>
                      </div>
                    </div>

                    <div className={styles.apStyle_6}>
                      <span className={styles.apStyle_51}>
                        Same Rate:
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 450"
                        value={bulkWirePrice}
                        onChange={(e) => setBulkWirePrice(e.target.value)}
                        className={styles.apStyle_52}
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
                        className={styles.apStyle_93}
                      >
                        Auto Fill
                      </button>
                    </div>
                  </div>

                  <div className={styles.apStyle_94}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Zap size={18} color="#EAB308" />
                    <div>
                      <span className={styles.apStyle_49}>
                        LED Bulb / Panel Wattages (5W, 12W, 18W, 24W)
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter pricing for bulbs and ceiling lights by wattage
                      </p>
                    </div>
                  </div>

                  <div className={styles.apStyle_54}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <HeartPulse size={18} color="#0284C7" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Medicine Strip & Full Box
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter pricing for single blister strip and complete box pack
                      </p>
                    </div>
                  </div>

                  <div className={styles.apStyle_95}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Package size={18} color="#0284C7" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Syrup & Suspension Bottles (60ml, 120ml)
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter pricing for pediatric and standard syrup bottles
                      </p>
                    </div>
                  </div>

                  <div className={styles.apStyle_95}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Smartphone size={18} color="#3B82F6" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Internal Storage (64GB, 128GB, 256GB, 512GB)
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter pricing for smartphones, tablets or memory devices
                      </p>
                    </div>
                  </div>

                  <div className={styles.apStyle_54}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Cake size={18} color="#F59E0B" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Sweets / Mithai Packing Box (250g, 500g, 1 KG, 2 KG)
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter packing rates for traditional sweets and confectionery
                      </p>
                    </div>
                  </div>

                  <div className={styles.apStyle_54}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_47}>
                  <div className={styles.apStyle_89}>
                    <Boxes size={18} color="#059669" />
                    <div>
                      <span className={styles.apStyle_49}>
                        Single Piece vs Wholesale Carton / Box
                      </span>
                      <p className={styles.apStyle_50}>
                        Enter individual retail price and whole carton wholesale price
                      </p>
                    </div>
                  </div>

                  <div className={styles.apStyle_95}>
                    <div>
                      <label className={styles.apStyle_55}>
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
                      <label className={styles.apStyle_55}>
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
                <div className={styles.apStyle_42}>
                  <div className={styles.apStyle_43}>
                    Portion Size Pricing (PKR)
                  </div>
                  <div className={styles.apStyle_96}>
                    <div>
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                <div className={styles.apStyle_42}>
                  <div className={styles.apStyle_97}>
                    <DrinkToGo20Regular className={styles.apStyle_98} />
                    <span>Cold Drink Size Pricing (PKR)</span>
                  </div>
                  <div className={styles.apStyle_44}>
                    <div>
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                <div className={styles.apStyle_42}>
                  <div className={styles.apStyle_97}>
                    <Drop20Regular className={styles.apStyle_99} />
                    <span>Mineral Water Size Pricing (PKR)</span>
                  </div>
                  <div className={styles.apStyle_96}>
                    <div>
                      <label className={styles.apStyle_45}>
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
                      <label className={styles.apStyle_45}>
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
                          <div className={styles.apStyle_100}>
                            <span className={styles.apStyle_101}>
                              <Package className={styles.apStyle_102} />
                              Initial stock: <strong>0</strong> (Add via Stock In)
                            </span>
                            {watchedCategory && (
                              <span className={styles.apStyle_103}>
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
                    className={styles.apRemSaleNoticeBox}
                  >
                    <Scales20Regular className={styles.apStyle_105} />
                    <div>
                      <b className={styles.apStyle_106}>Rupees Sale (Budget Mode Active):</b> Cashier can enter exact Rupee amount (e.g. Rs 50 or Rs 100) on the POS Counter card, and the system will automatically calculate the weight.
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
                          <div className={styles.apStyle_100}>
                            <span className={styles.apStyle_101}>
                              <Package className={styles.apStyle_102} />
                              Initial stock: <strong>0</strong> (Add via Stock In)
                            </span>
                          {watchedCategory && (
                            <span className={styles.apStyle_103}>
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
                            className={mergeClasses(styles.linkBtn, styles.apStyle_107)}
                          >
                            <Flash20Regular className={styles.apStyle_108} />
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
                          className={mergeClasses(styles.presetChip, styles.apAccentBoxBase, isSelected ? undefined : styles.apAccentBoxInactive)} ref={(el) => { if (el && isSelected) { el.style.borderColor = profileConfig.accentColor; el.style.backgroundColor = `${profileConfig.accentColor}25`; el.style.color = profileConfig.accentColor; } }}
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
                className={mergeClasses(styles.variantSectionBox, styles.apAccentWrapCard)} ref={(el) => { if (el && (hasVariants || profileConfig.suggestedSizes.length > 0)) { el.style.borderColor = `${profileConfig.accentColor}44`; el.style.backgroundColor = `${profileConfig.accentColor}08`; } }}
              >
                <div className={styles.variantHeaderRow}>
                  <div className={styles.variantHeaderLeft}>
                    <span
                      className={mergeClasses(styles.variantProfileTag, styles.apCategoryBadgeBase)} ref={(el) => { if (el) { el.style.backgroundColor = `${profileConfig.accentColor}22`; el.style.color = profileConfig.accentColor; el.style.borderColor = `${profileConfig.accentColor}44`; } }}
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
                    ref={(el) => { if (el) el.style.color = profileConfig.accentColor; }}
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
                            className={mergeClasses(styles.variantChipBtn, styles.apAccentBoxBase, isSelected ? undefined : styles.apAccentBoxInactive)} ref={(el) => { if (el && isSelected) { el.style.borderColor = profileConfig.accentColor; el.style.backgroundColor = `${profileConfig.accentColor}22`; el.style.color = profileConfig.accentColor; } }}
                          >
                            <span>{size}</span>
                            {isSelected && <Checkmark16Filled className={styles.apStyle_114} />}
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
                        <strong className={styles.apStyle_115}>
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
                            <div className={styles.variantRowLabel} ref={(el) => { if (el) el.style.color = profileConfig.accentColor; }}>
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
                <div className={mergeClasses(styles.previewDetailsWrap, styles.apStyle_116)}>
                  <div>
                    <div className={styles.previewProductTitle}>
                      {watchedName || 'Product Title'}
                    </div>
                    <div className={styles.apStyle_117}>
                      {productForm.watch('description') || watchedCategory || 'Item description'}
                    </div>

                    {/* Segmented Size Badges */}
                    {variants.length > 0 && (
                      <div className={styles.apPreviewTabHeader} ref={(el) => { if (el) el.style.gridTemplateColumns = `repeat(${Math.min(variants.length, 4)}, 1fr)`; }}>
                        {variants.slice(0, 4).map((v, idx) => (
                          <div
                            key={v.id}
                            className={idx === 0 ? styles.apPreviewTabFirst : styles.apPreviewTabOther}
                          >
                            <div>{v.label}</div>
                            <div className={styles.apStyle_120}>{v.price ? v.price : '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rupees / Amount Quick Strip Preview for Weighed Items */}
                    {variants.length === 0 && (pricingType === 'perkg' || pricingType === 'amountse') && (
                      <div className={styles.apStyle_121}>
                        <div className={styles.apStyle_122}>
                          {[50, 100, 250].map((rs) => (
                            <div key={rs} className={styles.apStyle_123}>
                              Rs.{rs}
                            </div>
                          ))}
                        </div>
                        <div className={styles.apStyle_124}>
                          <span className={styles.apStyle_125}>Rs.</span>
                          <div className={styles.apStyle_126}>
                            70
                          </div>
                          <div className={styles.apStyle_127}>
                            + 117g
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={mergeClasses(styles.previewBottomRow, styles.apStyle_128)}>
                    <div className={styles.apStyle_129}>
                      <span>{watchedPrice ? `${watchedPrice.toLocaleString()} PKR` : '600 PKR'}</span>
                      {(pricingType === 'perkg' || pricingType === 'amountse') && (
                        <span className={styles.apStyle_130}>
                          / {watchedUnit || 'KG'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.apRemBtnRedPillSmall}
                    >
                      <Add20Regular className={styles.apStyle_114} />
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
              {/* 1. Target Store Module */}
              <Controller
                control={categoryForm.control}
                name="module"
                render={({ field }) => (
                  <CustomSelect
                    label="Target Store Module"
                    required
                    value={field.value}
                    options={[
                      { value: 'fastfood', label: 'Food' },
                      { value: 'minimart', label: 'Mart' },
                    ]}
                    onChange={(val) => {
                      const newMod = val as ModuleKey;
                      field.onChange(newMod);
                      if (newMod === 'fastfood') {
                        categoryForm.setValue('profile', 'food');
                      } else {
                        categoryForm.setValue('profile', 'standard');
                      }
                    }}
                  />
                )}
              />

              {/* 2. Industry Profile */}
              <div>
                <Controller
                  control={categoryForm.control}
                  name="profile"
                  render={({ field }) => (
                    <CustomSelect
                      label="Industry Profile (Size & Unit Presets)"
                      value={addCatProfileOptions.some((opt) => opt.value === field.value) ? field.value : (addCatProfileOptions[0]?.value || (watchedCatModule === 'fastfood' ? 'food' : 'standard'))}
                      onChange={(val) => {
                        const newProf = val as CategoryProfile;
                        field.onChange(newProf);
                        if (!isAddCatCustomName) {
                          const pConfig = CATEGORY_PROFILES[newProf] || CATEGORY_PROFILES.standard;
                          const defaults = pConfig.defaultCategories || [];
                          const existingInMod = new Set(
                            categories.filter((c) => c.module === categoryForm.getValues('module')).map((c) => c.name.toLowerCase().trim())
                          );
                          const firstAvail = defaults.find((n) => !existingInMod.has(n.toLowerCase().trim())) || defaults[0] || '';
                          if (firstAvail) {
                            categoryForm.setValue('name', firstAvail);
                          }
                        }
                      }}
                      options={addCatProfileOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                    />
                  )}
                />
              </div>

              {/* 3. Select Category */}
              <div>
                <div className={styles.apStyle_132}>
                  <span className={styles.apStyle_81}>
                    {isAddCatCustomName ? 'Type any custom category name' : 'Choose preset category or type custom'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddCatCustomName(!isAddCatCustomName);
                      if (!isAddCatCustomName) {
                        categoryForm.setValue('name', '');
                      } else {
                        categoryForm.setValue('name', addCatDefaultOptions[0]?.value || '');
                      }
                    }}
                    className={styles.apRemLinkRedPlain}
                  >
                    {isAddCatCustomName ? '← Choose from Presets' : '+ Custom Name'}
                  </button>
                </div>
                {isAddCatCustomName ? (
                  <Controller
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <CustomInput
                        label="Category Name"
                        required
                        autoFocus
                        placeholder="e.g. Dvr, Cameras, Accessories..."
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        error={categoryForm.formState.errors.name?.message}
                      />
                    )}
                  />
                ) : (
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
                )}
              </div>

              {/* 4. Sab Se Neechay: Preset Units & Sizes preview */}
              {addCatProfileConfig && (
                <div className={styles.apStyle_134}>
                  {addCatProfileConfig.suggestedUnits && addCatProfileConfig.suggestedUnits.length > 0 && (
                    <div className={styles.apStyle_135}>
                      <span className={styles.apStyle_136}>Preset Units:</span>
                      {addCatProfileConfig.suggestedUnits.map((unit) => (
                        <span
                          key={unit}
                          className={styles.apRemBadgeStroke1}
                        >
                          {unit}
                        </span>
                      ))}
                    </div>
                  )}

                  {addCatProfileConfig.suggestedSizes && addCatProfileConfig.suggestedSizes.length > 0 && (
                    <div className={styles.apStyle_135}>
                      <span className={styles.apStyle_136}>Preset Sizes:</span>
                      {addCatProfileConfig.suggestedSizes.map((size) => (
                        <span
                          key={size}
                          className={styles.apCategoryBadgeBase} ref={(el) => { if (el) { el.style.backgroundColor = `${addCatProfileConfig.accentColor}18`; el.style.borderColor = `${addCatProfileConfig.accentColor}40`; el.style.color = addCatProfileConfig.accentColor; } }}
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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
