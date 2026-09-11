import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Button,
  Badge,
  Label,
  Subtitle1,
  Body1,
  Caption1,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Search20Regular,
  Edit20Regular,
  Delete20Regular,
  Food24Regular,
  BuildingRetail24Regular,
  Tag20Regular,
  ArrowUpload20Regular,
  Dismiss16Regular,
  Image20Regular,
  Grid20Regular,
  ArrowRight20Regular,
  Warning20Regular,
  Box20Regular,
  Money20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Product, Category, ModuleKey, CategoryProfile } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { CustomInput, CustomSelect } from '@/components/ui';
import { CATEGORY_PROFILES, detectCategoryProfile, ALL_PROFILE_OPTIONS, getFilteredProfileOptions } from '@/lib/categoryProfiles';
import { UNIT_OPTIONS } from '@/lib/units';

/* ── Zod Schemas ───────────────────────────────────────────────────── */
const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  module: z.enum(['fastfood', 'minimart']),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Retail selling price must be greater than 0'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional(),
  unit: z.string().default('PCS'),
  skuCode: z.string().optional(),
  rackLocation: z.string().optional(),
  openingStock: z.coerce.number().min(0, 'Opening stock cannot be negative').default(0),
  imageUrl: z.string().optional(),
  imageBase64: z.string().optional(),
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

import { useProductsCatalogStyles, useStyles } from './productsCatalog.styles';

export function ProductsCatalogView({ initialTab }: { initialTab?: 'all' | 'fastfood' | 'minimart' | 'categories' } = {}): React.JSX.Element {
  const styles = useProductsCatalogStyles();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Synchronize activeTab with URL route or prop
  const getTabFromPath = (): 'all' | 'fastfood' | 'minimart' | 'categories' => {
    if (location.pathname === '/catalog/fastfood') return 'fastfood';
    if (location.pathname === '/catalog/omnimart') return 'minimart';
    if (location.pathname === '/catalog/categories') return 'categories';
    return initialTab || 'all';
  };

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'all' | 'fastfood' | 'minimart' | 'categories'>(getTabFromPath);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname, initialTab]);

  const handleTabChange = (key: 'all' | 'fastfood' | 'minimart' | 'categories') => {
    setActiveTab(key);
    if (key === 'all') navigate('/catalog');
    else if (key === 'fastfood') navigate('/catalog/fastfood');
    else if (key === 'minimart') navigate('/catalog/omnimart');
    else if (key === 'categories') navigate('/catalog/categories');
  };

  const { can, businessProfiles = ['standard', 'food'], refreshModules } = useLicense();
  React.useEffect(() => {
    void refreshModules();
  }, [refreshModules]);
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  /* ── React Hook Form + Zod for Products ────────────────────────────── */
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      module: 'fastfood',
      category: 'General',
      price: undefined,
      costPrice: undefined,
      skuCode: '',
      rackLocation: '',
      openingStock: 0,
      imageUrl: '',
      description: '',
    },
  });

  /* ── React Hook Form + Zod for Categories ──────────────────────────── */
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: '',
      module: hasFastFood ? 'fastfood' : 'minimart',
      profile: hasFastFood ? 'food' : 'standard',
    },
  });
  const [isCatCustomName, setIsCatCustomName] = useState(false);

  // Watch selected module in product dialog to filter category choices & live preview
  const watchedModule = productForm.watch('module');
  const watchedName = productForm.watch('name');
  const watchedPrice = productForm.watch('price');
  const watchedCategory = productForm.watch('category');
  const watchedUnit = productForm.watch('unit');
  const watchedStock = productForm.watch('openingStock');

  /* ── Local Image Upload & Preview State ────────────────────────────── */
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      productForm.setValue('imageUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    productForm.setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => posApi.fetchCategories(),
  });

  // Save Product Mutation
  const saveProductMutation = useMutation({
    mutationFn: async (prod: Product) => {
      return await posApi.saveProduct(prod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
    },
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await posApi.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Save Category Mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (cat: Category) => {
      return await posApi.saveCategory(cat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await posApi.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setImagePreview(null);
    const defaultMod = activeTab === 'minimart' ? 'minimart' : 'fastfood';
    const firstCat = categories.find((c) => c.module === defaultMod)?.name || 'General';
    productForm.reset({
      name: '',
      module: defaultMod,
      category: firstCat,
      price: undefined,
      costPrice: undefined,
      unit: defaultMod === 'minimart' ? 'PCS' : 'PCS',
      skuCode: `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
      rackLocation: '',
      openingStock: 0,
      imageUrl: '',
      description: '',
    });
    setIsProductDialogOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setImagePreview(prod.imageBase64 || prod.imageUrl || null);
    productForm.reset({
      name: prod.name,
      module: prod.module,
      category: prod.category,
      price: prod.price,
      costPrice: prod.costPrice,
      unit: prod.unit || 'PCS',
      skuCode: prod.skuCode || '',
      rackLocation: prod.rackLocation || '',
      openingStock: prod.openingStock ?? 0,
      imageUrl: prod.imageUrl || '',
      description: prod.description || '',
    });
    setIsProductDialogOpen(true);
  };

  const onProductSubmit = (data: ProductFormData) => {
    const isBase64 = imagePreview && imagePreview.startsWith('data:');
    const prod: Product = {
      id: editingProduct ? editingProduct.id : uid('prod_'),
      name: data.name.trim(),
      module: data.module,
      category: data.category || 'General',
      price: data.price,
      costPrice: data.costPrice,
      unit: data.unit || 'PCS',
      skuCode: data.skuCode?.trim() || `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
      rackLocation: data.rackLocation?.trim() || undefined,
      openingStock: data.openingStock,
      imageUrl: data.imageUrl?.trim() || (isBase64 ? imagePreview : undefined),
      imageBase64: isBase64 ? imagePreview : (editingProduct?.imageBase64 || undefined),
      description: data.description?.trim() || undefined,
      hasVariants: editingProduct ? editingProduct.hasVariants : undefined,
      variants: editingProduct ? editingProduct.variants : undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProductMutation.mutate(prod);
  };

  const activeRetailProfile = React.useMemo(() => {
    const specific = businessProfiles.find((p) => p !== 'standard' && p !== 'food');
    return specific && CATEGORY_PROFILES[specific] ? CATEGORY_PROFILES[specific] : null;
  }, [businessProfiles]);

  const activeRetailLabel = activeRetailProfile?.label || 'Retail Store';
  const activeRetailShort = activeRetailProfile?.shortTag || 'Retail';

  const watchedCatModule = categoryForm.watch('module') || (hasFastFood ? 'fastfood' : 'minimart');
  const watchedCatProfile = categoryForm.watch('profile') || (watchedCatModule === 'fastfood' ? 'food' : 'standard');
  const catProfileConfig = CATEGORY_PROFILES[watchedCatProfile as CategoryProfile] || CATEGORY_PROFILES.standard;

  const catProfileOptions = React.useMemo(() => {
    return ALL_PROFILE_OPTIONS.filter((opt) => opt.module === watchedCatModule);
  }, [watchedCatModule]);

  const catDefaultOptions = React.useMemo(() => {
    const backendCategories = catProfileConfig.defaultCategories || [];
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
  }, [catProfileConfig, categories, watchedCatModule]);

  useEffect(() => {
    if (isCategoryDialogOpen && catDefaultOptions.length > 0 && !isCatCustomName) {
      const currentName = categoryForm.getValues('name');
      const currentOpt = catDefaultOptions.find((opt) => opt.value === currentName);
      if (!currentOpt || currentOpt.disabled) {
        const firstAvail = catDefaultOptions.find((opt) => !opt.disabled)?.value || catDefaultOptions[0].value;
        categoryForm.setValue('name', firstAvail);
      }
    }
  }, [isCategoryDialogOpen, catDefaultOptions, categoryForm, isCatCustomName]);

  const onCategorySubmit = (data: CategoryFormData) => {
    const prof = data.profile || (data.module === 'fastfood' ? 'food' : 'standard');
    const profileConfig = CATEGORY_PROFILES[prof as CategoryProfile] || CATEGORY_PROFILES.standard;
    const cat: Category = {
      id: uid('cat_'),
      name: data.name.trim(),
      module: data.module,
      profile: prof as CategoryProfile,
      suggestedSizes: profileConfig.suggestedSizes,
      suggestedUnits: profileConfig.suggestedUnits,
    };
    saveCategoryMutation.mutate(cat);
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (p.module === 'fastfood' && !hasFastFood) return false;
    if (p.module === 'minimart' && !hasOmnimart) return false;

    if (activeTab === 'fastfood' && p.module !== 'fastfood') return false;
    if (activeTab === 'minimart' && p.module !== 'minimart') return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.variants &&
          p.variants.some(
            (v) =>
              (v.skuCode && v.skuCode.toLowerCase().includes(q)) ||
              (v.label && v.label.toLowerCase().includes(q))
          ))
      );
    }
    return true;
  });

  if (isLoadingProducts && products.length === 0) {
    return <TablePageSkeleton title="Products & Menu Catalog" hasMetrics={false} />;
  }

  // Dashboard KPI metrics calculations
  const activeProducts = products.filter((p) =>
    p.module === 'fastfood' ? hasFastFood : hasOmnimart,
  );
  const fastFoodProducts = activeProducts.filter((p) => p.module === 'fastfood');
  const omnimartProducts = activeProducts.filter((p) => p.module === 'minimart');
  const activeCategories = categories.filter((c) =>
    c.module === 'fastfood' ? hasFastFood : hasOmnimart,
  );
  const totalRetailValue = activeProducts.reduce((acc, p) => acc + (p.price * (p.openingStock || 0)), 0);
  const totalCostValue = activeProducts.reduce((acc, p) => acc + ((p.costPrice || (p.price * 0.7)) * (p.openingStock || 0)), 0);
  const outOfStockProducts = activeProducts.filter((p) => (p.openingStock || 0) <= 0);
  const lowStockProducts = activeProducts.filter((p) => (p.openingStock || 0) > 0 && (p.openingStock || 0) <= (p.minThreshold || 10));
  const fastFoodAvgPrice = fastFoodProducts.length > 0
    ? Math.round(fastFoodProducts.reduce((sum, p) => sum + p.price, 0) / fastFoodProducts.length)
    : 0;

  return (
    <div className={styles.container}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerTitleRow}>
            <Subtitle1 as="h1" className={styles.headerTitle}>
              {activeTab === 'fastfood'
                ? 'Fast Food Menu Catalog'
                : activeTab === 'minimart'
                ? 'Omnimart Supermarket Catalog'
                : 'Catalog Executive Dashboard'}
            </Subtitle1>
            {activeTab === 'all' && (
              <span className={styles.headerBadge}>
                INTELLIGENCE HUB
              </span>
            )}
          </div>
          <Caption1 as="p" className={styles.headerSubtitle}>
            {activeTab === 'fastfood'
              ? 'Manage fast food burgers, pizzas, snacks, and kitchen prep items'
              : activeTab === 'minimart'
              ? 'Manage retail groceries, SKU barcodes, rack locations, and loose scale items'
              : 'Real-time catalog performance, departmental division hubs & stock valuation'}
          </Caption1>
        </div>

        <div className={styles.headerActions}>
          {activeTab === 'all' && (
            <Button
              appearance="outline"
              icon={<Grid20Regular />}
              className={styles.categoriesMgrBtn}
              onClick={() => navigate('/catalog/categories')}
            >
              Categories Manager
            </Button>
          )}

          {/* Primary Action Button */}
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            className={styles.addProductBtn}
            onClick={() => {
              if (activeTab === 'fastfood') {
                navigate('/catalog/new?module=fastfood');
              } else if (activeTab === 'minimart') {
                navigate('/catalog/new?module=minimart');
              } else {
                navigate('/catalog/new');
              }
            }}
          >
            {activeTab === 'fastfood'
              ? '+ Add Fast Food Item'
              : activeTab === 'minimart'
              ? '+ Add Omnimart Product'
              : '+ Add New Product'}
          </Button>
        </div>
      </div>

      {/* ── Condition: Dashboard vs Detailed Table View ─────────── */}
      {activeTab === 'all' ? (
        <div className={styles.kpiContainer}>
          {/* 1. Futuristic KPI Pulse HUD */}
          <div className={styles.kpiGrid}>
            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Catalog Inventory
                  </div>
                  <div className={styles.kpiValue}>
                    {activeProducts.length} <span className={styles.kpiSkus}>SKUs</span>
                  </div>
                </div>
                <div className={hasFastFood && !hasOmnimart ? styles.kpiIconFastFood : styles.kpiIconBlue}>
                  <Box20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={styles.kpiSubRow}>
                {hasFastFood && hasOmnimart ? (
                  <>
                    <span className={styles.kpiRedText}>{fastFoodProducts.length} Fast Food</span>
                    <span className={styles.kpiDot}>•</span>
                    <span className={styles.kpiBlueText}>{omnimartProducts.length} Omnimart</span>
                  </>
                ) : hasFastFood ? (
                  <span className={styles.kpiRedText}>{fastFoodProducts.length} Fast Food Items</span>
                ) : (
                  <span className={styles.kpiBlueText}>{omnimartProducts.length} Omnimart Retail Items</span>
                )}
              </div>
            </div>

            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Retail Valuation
                  </div>
                  <div className={styles.kpiValueGreen}>
                    {formatPKR(totalRetailValue)}
                  </div>
                </div>
                <div className={styles.kpiIconGreen}>
                  <Money20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={mergeClasses(styles.kpiSubRow, styles.kpiSubRowColored)}>
                <span>Estimated Cost: <strong className={styles.totalCostVal}>{formatPKR(totalCostValue)}</strong></span>
              </div>
            </div>

            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Stock Health
                  </div>
                  <div className={outOfStockProducts.length > 0 ? styles.kpiValueRed : styles.kpiValueGreen}>
                    {outOfStockProducts.length} <span className={styles.kpiSkus}>Zero Stock</span>
                  </div>
                </div>
                <div className={styles.kpiIconRed}>
                  <Warning20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={styles.kpiSubRow}>
                <span className={styles.kpiAmberText}>{lowStockProducts.length} Low Stock Warnings</span>
              </div>
            </div>

            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Active Categories
                  </div>
                  <div className={styles.kpiValue}>
                    {activeCategories.length} <span className={styles.kpiSkus}>Departments</span>
                  </div>
                </div>
                <div className={styles.kpiIconPurple}>
                  <Grid20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={styles.kpiSubRow}>
                <span
                  onClick={() => navigate('/catalog/categories')}
                  className={styles.kpiManageCatsLink}
                >
                  Manage Categories →
                </span>
              </div>
            </div>
          </div>

          {/* 2. Department Division Command Hubs */}
          {(hasFastFood || hasOmnimart) && (
            <div className={mergeClasses(styles.divisionGrid, (hasFastFood && hasOmnimart) ? styles.divisionGrid2 : styles.divisionGrid1)}>
              {/* Fast Food Hub Card */}
              {hasFastFood && (
                <div className={styles.divisionHeroCard}>
                  <div className={styles.divisionHeroTop}>
                    <div className={styles.divisionHeroTitleWrap}>
                      <div className={styles.divisionIconFastFood}>
                        <Food24Regular className={styles.icon26} />
                      </div>
                      <div>
                        <div className={styles.divisionTitle}>
                          Fast Food Division
                        </div>
                        <div className={styles.divisionSubtitle}>
                          Burgers, pizzas, snacks, prep times &amp; kitchen addons
                        </div>
                      </div>
                    </div>
                    <span className={styles.divisionTagFastFood}>
                      RESTAURANT
                    </span>
                  </div>

                  <div className={styles.divisionStatBox}>
                    <div>
                      <div className={styles.divisionStatHead}>Items</div>
                      <div className={styles.divisionStatNum}>
                        {fastFoodProducts.length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Categories</div>
                      <div className={styles.divisionStatNum}>
                        {categories.filter(c => c.module === 'fastfood').length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Avg Price</div>
                      <div className={styles.divisionStatNumGreen}>
                        {formatPKR(fastFoodAvgPrice)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.divisionBtnRow}>
                    <Button
                      appearance="primary"
                      className={styles.btnFastFoodHero}
                      onClick={() => navigate('/catalog/fastfood')}
                    >
                      Open Fast Food Catalog →
                    </Button>
                    <Button
                      appearance="outline"
                      className={styles.btnOutlineRounded}
                      onClick={() => navigate('/catalog/new?module=fastfood')}
                    >
                      + Add Food Item
                    </Button>
                  </div>
                </div>
              )}

              {/* Omnimart Supermarket Hub Card */}
              {hasOmnimart && (
                <div className={styles.divisionHeroCard}>
                  <div className={styles.divisionHeroTop}>
                    <div className={styles.divisionHeroTitleWrap}>
                      <div className={styles.divisionIconOmnimart}>
                        <BuildingRetail24Regular className={styles.icon26} />
                      </div>
                      <div>
                        <div className={styles.divisionTitle}>
                          Omnimart Supermarket
                        </div>
                        <div className={styles.divisionSubtitle}>
                          Retail goods, SKU barcodes, racks &amp; scale units
                        </div>
                      </div>
                    </div>
                    <span className={styles.divisionTagOmnimart}>
                      RETAIL &amp; MART
                    </span>
                  </div>

                  <div className={styles.divisionStatBox}>
                    <div>
                      <div className={styles.divisionStatHead}>Products</div>
                      <div className={styles.divisionStatNum}>
                        {omnimartProducts.length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Categories</div>
                      <div className={styles.divisionStatNum}>
                        {categories.filter(c => c.module === 'minimart').length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Total Stock</div>
                      <div className={styles.divisionStatNumBlue}>
                        {omnimartProducts.reduce((sum, p) => sum + (p.openingStock || 0), 0)} units
                      </div>
                    </div>
                  </div>

                  <div className={styles.divisionBtnRow}>
                    <Button
                      appearance="primary"
                      className={styles.btnOmnimartHero}
                      onClick={() => navigate('/catalog/omnimart')}
                    >
                      Open Omnimart Catalog →
                    </Button>
                    <Button
                      appearance="outline"
                      className={styles.btnOutlineRounded}
                      onClick={() => navigate('/catalog/new?module=minimart')}
                    >
                      + Add Retail Item
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Critical Stock Attention Radar */}
          {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
            <div className={styles.radarCard}>
              <div className={styles.radarHeader}>
                <div className={styles.radarTitleWrap}>
                  <Warning20Regular className={styles.radarIcon} />
                  <span className={styles.radarTitle}>
                    Critical Stock Attention Radar
                  </span>
                  <span className={styles.radarBadge}>
                    {outOfStockProducts.length + lowStockProducts.length} Items Require Action
                  </span>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  className={styles.radarActionBtn}
                  onClick={() => navigate('/inventory')}
                >
                  Go to Inventory Manager →
                </Button>
              </div>

              <div className={styles.radarGrid}>
                {[...outOfStockProducts, ...lowStockProducts].slice(0, 4).map((p) => (
                  <div key={p.id} className={styles.radarItemCard}>
                    <div className={styles.radarItemLeft}>
                      <div className={styles.radarItemName}>
                        {p.name}
                      </div>
                      <div className={styles.radarItemMeta}>
                        {p.module === 'fastfood' ? 'Fast Food' : 'Omnimart'} • {p.category}
                      </div>
                    </div>

                    <div className={styles.radarItemRight}>
                      <Badge
                        appearance="filled"
                        color={(p.openingStock || 0) <= 0 ? 'danger' : 'warning'}
                        className={styles.radarItemBadge}
                      >
                        {p.openingStock ?? 0} {p.unit || 'PCS'}
                      </Badge>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Edit20Regular />}
                        onClick={() => handleOpenEditProduct(p)}
                        title="Restock / Edit"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Live Visual Catalog Cards Showcase (6:4 Proportions) */}
          <div>
            <div className={styles.liveHeader}>
              <div className={styles.liveTitleWrap}>
                <span className={styles.liveTitle}>
                  Live Store Catalog Visuals
                </span>
                <span className={styles.liveSubtitle}>
                  Showing {filteredProducts.length} Items (6:4 Live POS Cards)
                </span>
              </div>

              <div className={styles.liveSearchWrap}>
                <CustomInput
                  label="Instant SKU / Search"
                  placeholder="Search products..."
                  icon={<Search20Regular />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={searchTerm ? () => setSearchTerm('') : undefined}
                />
              </div>
            </div>

            <div className={styles.liveCardGrid}>
              {filteredProducts.slice(0, 12).map((p) => {
                const img = p.imageBase64 || p.imageUrl;
                return (
                  <div key={p.id} className={styles.liveCard}>
                    {/* 6 Parts Image (126px) */}
                    <div className={styles.liveCardImgWrap}>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className={styles.cardImg}
                        />
                      ) : (
                        <div className={styles.noPhotoPlaceholder}>
                          {p.module === 'fastfood' ? <Food24Regular className={styles.icon28} /> : <BuildingRetail24Regular className={styles.icon28} />}
                          <span className={styles.noPhotoText}>No photo</span>
                        </div>
                      )}

                      {/* Stock Badge Overlay */}
                      <div
                        className={mergeClasses(
                          styles.cardStockBadge,
                          (p.openingStock || 0) <= 0 ? styles.cardStockBadgeAlert : styles.cardStockBadgeNormal
                        )}
                      >
                        {p.openingStock ?? 0} {p.unit || 'PCS'}
                      </div>

                      {/* Quick Edit Overlay Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(p)}
                        className={styles.cardEditBtn}
                        title="Edit Product"
                      >
                        <Edit20Regular className={styles.icon14} />
                      </button>
                    </div>

                    {/* 4 Parts Details (84px) */}
                    <div className={styles.liveCardContent}>
                      <div>
                        <div className={styles.cardProdName}>
                          {p.name}
                        </div>
                        {p.hasVariants && p.variants && p.variants.length > 0 ? (
                          <div className={styles.cardVariantRow}>
                            {p.variants.slice(0, 3).map((v) => (
                              <span key={v.id} className={styles.cardVariantTag}>
                                {v.label}
                              </span>
                            ))}
                            {p.variants.length > 3 && (
                              <span className={styles.cardVariantMore}>
                                +{p.variants.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className={styles.cardCatSubtitle}>
                            {p.category} • {p.module === 'fastfood' ? 'Fast Food' : 'Omnimart'}
                          </div>
                        )}
                      </div>

                      <div className={styles.cardBottomRow}>
                        <div className={styles.cardPrice}>
                          {formatPKR(p.price)}
                        </div>
                        <div className={styles.cardSku}>
                          {p.skuCode ? p.skuCode.slice(0, 10) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Module Data Table View (for Fast Food, Omnimart, or user toggled) */
        <div className={styles.tableCard}>
          {/* Filter & Search Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchRow}>
              <div className={styles.searchCol300}>
                <CustomInput
                  label="Search Products"
                  placeholder="Name, SKU, or category..."
                  icon={<Search20Regular />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={searchTerm ? () => setSearchTerm('') : undefined}
                />
              </div>

              <div className={styles.filterCol200}>
                <CustomSelect
                  label="Category Filter"
                  value={selectedCategory}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    ...categories
                      .filter((c) => (activeTab === 'fastfood' ? c.module === 'fastfood' : activeTab === 'minimart' ? c.module === 'minimart' : true))
                      .map((c) => ({ value: c.name, label: c.name })),
                  ]}
                  onChange={(val) => setSelectedCategory(val)}
                />
              </div>
            </div>

            <Caption1 className={styles.tableCaption}>
              Showing {filteredProducts.length} items
            </Caption1>
          </div>

          {/* Fluent Table with responsive wrapper and high-end styling */}
          <div className={styles.tableOverflow}>
            <Table className={styles.dataTable}>
              <TableHeader>
                <TableRow className={styles.tableTheadTr}>
                  <TableHeaderCell className={styles.thDetails}>
                    Product Details
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thCategory}>
                    Category &amp; Type
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thPrice}>
                    Retail Price
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thCost}>
                    Purchase Cost
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thStock}>
                    Current Stock
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thSku}>
                    SKU / Rack
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thActions}>
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTd}>
                      No products found matching the criteria. Click "+ Add New Product" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.openingStock !== null && p.openingStock !== undefined && p.openingStock <= (p.minThreshold ?? 10);
                    const isFastFood = p.module === 'fastfood';

                    return (
                      <TableRow key={p.id} className={styles.tbodyTr}>
                        <TableCell className={styles.tdDetails}>
                          <div className={styles.prodDetailsRow}>
                            <div className={styles.prodThumbnailWrap}>
                              {p.imageBase64 || p.imageUrl ? (
                                <img src={p.imageBase64 || p.imageUrl} alt={p.name} className={styles.cardImg} />
                              ) : isFastFood ? (
                                <Food24Regular className={styles.catSub} />
                              ) : (
                                <BuildingRetail24Regular className={styles.catSub} />
                              )}
                            </div>
                            <div className={styles.prodTextCol}>
                              <Body1 className={styles.prodTitle}>{p.name}</Body1>
                              {p.description && (
                                <Caption1 className={styles.prodDesc}>
                                  {p.description}
                                </Caption1>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <div className={styles.badgeRow}>
                            <Badge size="medium" appearance="tint" color={isFastFood ? 'warning' : 'informative'}>
                              {p.category}
                            </Badge>
                            <Caption1 className={styles.catSub}>
                              ({isFastFood ? 'Food' : 'Retail'})
                            </Caption1>
                          </div>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <Body1 className={styles.prodTitle}>
                            {formatPKR(p.price)}
                          </Body1>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <Caption1 className={styles.costCaption}>
                            {p.costPrice ? formatPKR(p.costPrice) : '—'}
                          </Caption1>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <Badge
                            size="medium"
                            appearance="filled"
                            color={isLow ? 'danger' : 'success'}
                            className={styles.stockBadge}
                          >
                            {p.openingStock ?? 0} {p.unit || 'PCS'}
                          </Badge>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <div className={styles.skuCol}>
                            <Caption1 className={styles.skuCode}>{p.skuCode || '—'}</Caption1>
                            {p.rackLocation && (
                              <Caption1 className={styles.rackText}>Rack: {p.rackLocation}</Caption1>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className={styles.tdActions}>
                          <div className={styles.actionsRow}>
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Edit20Regular />}
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit Product"
                            />
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Delete20Regular className={styles.deleteIcon} />}
                              onClick={() => deleteProductMutation.mutate(p.id)}
                              title="Delete Product"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Product Dialog: Executive 2-Column Studio Layout ── */}
      <Dialog open={isProductDialogOpen} onOpenChange={(_, d) => setIsProductDialogOpen(d.open)}>
        <DialogSurface className={styles.productDialogSurface}>
          <form onSubmit={productForm.handleSubmit(onProductSubmit)} className={styles.modalForm}>
            <DialogBody className={styles.modalBody}>
              
              {/* Modal Header */}
              <div className={styles.modalHeader}>
                <DialogTitle className={styles.dialogTitle}>
                  {editingProduct ? 'Edit Product Item' : 'Add New Product to Catalog'}
                </DialogTitle>
                <div className={styles.dialogSub}>
                  {editingProduct ? 'Update product pricing, inventory thresholds, and media' : 'Create a new product for Fast Food menu or Omnimart supermarket'}
                </div>
              </div>

              {/* 2-Column Responsive Body */}
              <DialogContent
                className={`${styles.productDialogContent} ${styles.dialogContentGrid} no-scrollbar`}
              >
                {/* ── Left Column: Primary Product & Stock Form Details ── */}
                <div className={styles.formColLeft}>
                  
                  {/* Module & Category Row */}
                  <div className={styles.formGrid2Col}>
                    <div className={styles.formBottomAlign}>
                      <Controller
                        control={productForm.control}
                        name="module"
                        render={({ field }) => (
                          <CustomSelect
                            label="Target Module"
                            required
                            value={field.value}
                            options={[
                              ...(hasFastFood ? [{ value: 'fastfood', label: 'Food' }] : []),
                              ...(hasOmnimart ? [{ value: 'minimart', label: 'Mart' }] : []),
                            ]}
                            onChange={(val) => {
                              field.onChange(val as ModuleKey);
                              const firstCat = categories.find((c) => c.module === val)?.name || 'General';
                              productForm.setValue('category', firstCat);
                            }}
                          />
                        )}
                      />
                    </div>

                    <div className={styles.formBottomAlign}>
                      <div className={styles.categoryHeaderRow}>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            categoryForm.reset({
                              name: '',
                              module: watchedModule,
                              profile: getFilteredProfileOptions(watchedModule, businessProfiles)[0]?.value || (watchedModule === 'fastfood' ? 'food' : 'standard'),
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
                          const activeGroupCats = categories.filter(
                            (c) => c.module === watchedModule && (c.module === 'fastfood' ? hasFastFood : hasOmnimart),
                          );
                          const otherGroupCats = categories.filter(
                            (c) => c.module !== watchedModule && (c.module === 'fastfood' ? hasFastFood : hasOmnimart),
                          );
                          const displayList = [...activeGroupCats, ...otherGroupCats];

                          return (
                            <CustomSelect
                              label="Category"
                              required
                              placeholder="Select Category"
                              value={field.value}
                              options={displayList.map((c) => ({ value: c.name, label: c.name }))}
                              onChange={(val) => field.onChange(val)}
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
                          label="Item / Product Name"
                          required
                          placeholder="e.g. Crispy Zinger Burger, Super Basmati Rice, or Fresh Milk"
                          value={field.value || ''}
                          onChange={field.onChange}
                          error={productForm.formState.errors.name?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Retail Price & Purchase Cost */}
                  <div className={styles.formGrid2Col}>
                    <div>
                      <Controller
                        control={productForm.control}
                        name="price"
                        render={({ field }) => (
                          <CustomInput
                            label="Retail Selling Price (PKR)"
                            required
                            type="number"
                            placeholder="e.g. 550"
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
                            label="Purchase Cost Price (PKR)"
                            type="number"
                            placeholder="e.g. 320"
                            value={field.value !== undefined ? String(field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Unit of Measure & Opening Stock */}
                  <div className={styles.formGrid2Col}>
                    <div>
                      <Controller
                        control={productForm.control}
                        name="unit"
                        render={({ field }) => {
                          const currentCat = productForm.watch('category');
                          const activeCatObj = categories.find((c) => c.name === currentCat);
                          const detected = detectCategoryProfile(currentCat || '', activeCatObj?.profile);
                          const pCfg = CATEGORY_PROFILES[detected];
                          const suggested = pCfg?.suggestedUnits || ['PCS'];
                          const matched: { value: string; label: string }[] = [];
                          suggested.forEach((su) => {
                            const found = UNIT_OPTIONS.find((opt) => opt.value.toUpperCase() === su.toUpperCase());
                            if (found && !matched.some((m) => m.value.toUpperCase() === found.value.toUpperCase())) {
                              matched.push(found);
                            }
                          });
                          const finalOptions = matched.length > 0 ? matched : UNIT_OPTIONS;
                          return (
                            <CustomSelect
                              label="Unit of Measure"
                              required
                              value={field.value || finalOptions[0]?.value || 'PCS'}
                              options={finalOptions}
                              onChange={(val) => field.onChange(val)}
                            />
                          );
                        }}
                      />
                    </div>

                    <div>
                      <Controller
                        control={productForm.control}
                        name="openingStock"
                        render={({ field }) => (
                          <CustomInput
                            label="Opening Stock"
                            type="number"
                            placeholder="50"
                            value={field.value !== undefined ? String(field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            error={productForm.formState.errors.openingStock?.message}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* SKU & Rack Location */}
                  <div className={styles.formGrid2Col}>
                    <div>
                      <Controller
                        control={productForm.control}
                        name="skuCode"
                        render={({ field }) => (
                          <CustomInput
                            label="SKU / Barcode"
                            placeholder="Auto-generated"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Controller
                        control={productForm.control}
                        name="rackLocation"
                        render={({ field }) => (
                          <CustomInput
                            label="Rack / Shelf Location"
                            placeholder="e.g. Aisle 1 or Chiller-01"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Description / Notes */}
                  <div>
                    <Controller
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <CustomInput
                          label="Description / Notes (Optional)"
                          placeholder="e.g. Fresh farm product, premium quality"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* ── Right Column: Visual Media & Live Interactive POS Card Preview (Compact 280px) ── */}
                <div className={styles.formColRight}>
                  
                  {/* Photo Upload Card */}
                  <div className={styles.uploadCard}>
                    <Label className={styles.uploadLabel}>
                      Product Media &amp; Photo
                    </Label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLocalImageSelect}
                      className={styles.hiddenInput}
                    />

                    {imagePreview ? (
                      <div className={styles.attachedRow}>
                        <div className={styles.attachedThumb}>
                          <img
                            src={imagePreview}
                            alt="Product Preview"
                            className={styles.cardImg}
                          />
                        </div>

                        <div className={styles.attachedInfo}>
                          <span className={styles.attachedTitle}>
                            Photo Attached
                          </span>
                          <span className={styles.attachedPath}>
                            {imagePreview.startsWith('data:') ? 'Local file' : imagePreview}
                          </span>
                        </div>

                        <div className={styles.attachedActions}>
                          <Button
                            size="small"
                            appearance="outline"
                            className={styles.changeBtn}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change
                          </Button>
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Dismiss16Regular className={styles.deleteIcon} />}
                            onClick={handleRemoveImage}
                            title="Remove image"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.dropzone}
                      >
                        <ArrowUpload20Regular className={styles.uploadIcon} />
                        <span className={styles.uploadTitle}>
                          Upload Photo from PC
                        </span>
                        <span className={styles.uploadSub}>
                          PNG, JPG, WebP
                        </span>
                      </div>
                    )}

                    {/* Optional URL input fallback */}
                    <div className={styles.urlWrap}>
                      <Controller
                        control={productForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <CustomInput
                            label="Image Web URL (Optional)"
                            placeholder="Or paste an image web link..."
                            value={field.value && !field.value.startsWith('data:') ? field.value : ''}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setImagePreview(e.target.value || null);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* ── Live POS Counter Card Preview ── */}
                  <div className={styles.previewCard}>
                    <div className={styles.previewHeader}>
                      <span className={styles.previewHeadTitle}>
                        Live POS Card Preview
                      </span>
                      <span className={styles.previewHeadSub}>
                        {watchedModule === 'minimart' ? 'Supermarket' : 'Fast Food'}
                      </span>
                    </div>

                    {/* POS Card Mockup */}
                    <div className={styles.posMockup}>
                      {/* Media container: 60% of card (6 hissay: 114px) */}
                      <div className={styles.mockupMedia}>
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Live Preview"
                            className={styles.cardImg}
                          />
                        ) : (
                          <div className={styles.noPhotoMockup}>
                            <Image20Regular className={styles.icon28} />
                            <span className={styles.noPhotoText}>No photo selected</span>
                          </div>
                        )}
                        <div className={styles.mockupCatBadge}>
                          {watchedCategory || 'Category'}
                        </div>
                        <div className={styles.mockupStockBadge}>
                          {watchedStock ?? 50} {watchedUnit || 'PCS'}
                        </div>
                      </div>

                      {/* Card Content: 40% of card (4 hissay: 76px) */}
                      <div className={styles.mockupContent}>
                        <div className={styles.mockupName}>
                          {watchedName || 'Item Name Preview'}
                        </div>

                        <div className={styles.mockupBottom}>
                          <div>
                            <div className={styles.mockupPriceLabel}>
                              Price
                            </div>
                            <div className={styles.mockupPriceVal}>
                              PKR {watchedPrice ? Number(watchedPrice).toLocaleString() : '0'}
                            </div>
                          </div>

                          <span className={styles.mockupUnitTag}>
                            per {watchedUnit || 'PCS'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>

              {/* Modal Footer Actions - Pinned at Bottom, Never Cut Off */}
              <div className={styles.dialogFooterActions}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsProductDialogOpen(false)}
                  className={styles.dialogCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={saveProductMutation.isPending}
                  className={styles.dialogSubmitBtn}
                >
                  {saveProductMutation.isPending ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ── Add Category Dialog with Labels & Zod + React Hook Form ── */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(_, d) => setIsCategoryDialogOpen(d.open)}>
        <DialogSurface className={styles.catDialogSurface}>
          <form
            onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
            className={styles.catForm}
          >
            {/* Modal Header */}
            <div className={styles.catHeader}>
              <div className={styles.catHeaderLeft}>
                <div className={styles.catIconWrap}>
                  <Tag20Regular className={styles.icon20} />
                </div>
                <div>
                  <div className={styles.catTitle}>
                    Create New Category
                  </div>
                  <div className={styles.catDialogSub}>
                    Add quick classification to catalog
                  </div>
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
            <div className={styles.catFieldsCol}>
              {/* 1. Target Store Module */}
              <Controller
                control={categoryForm.control}
                name="module"
                render={({ field }) => (
                  <CustomSelect
                    label="Assign to Module"
                    required
                    value={field.value}
                    options={[
                      ...(hasFastFood ? [{ value: 'fastfood', label: 'Food' }] : []),
                      ...(hasOmnimart ? [{ value: 'minimart', label: 'Mart' }] : []),
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
                      value={catProfileOptions.some((opt) => opt.value === field.value) ? field.value : (catProfileOptions[0]?.value || (watchedCatModule === 'fastfood' ? 'food' : 'standard'))}
                      onChange={(val) => {
                        const newProf = val as CategoryProfile;
                        field.onChange(newProf);
                        if (!isCatCustomName) {
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
                      options={catProfileOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                    />
                  )}
                />
              </div>

              {/* 3. Select Category */}
              <div>
                <div className={styles.catFormHintRow}>
                  <span className={styles.catFormHintText}>
                    {isCatCustomName ? 'Type any custom category name' : 'Choose preset category or type custom'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCatCustomName(!isCatCustomName);
                      if (!isCatCustomName) {
                        categoryForm.setValue('name', '');
                      } else {
                        categoryForm.setValue('name', catDefaultOptions[0]?.value || '');
                      }
                    }}
                    className={styles.catFormToggleBtn}
                  >
                    {isCatCustomName ? '← Choose from Presets' : '+ Custom Name'}
                  </button>
                </div>
                {isCatCustomName ? (
                  <Controller
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <CustomInput
                        label="Category Name"
                        required
                        autoFocus
                        placeholder="e.g. Dvr, Security Cameras, Groceries..."
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
                        value={field.value}
                        onChange={field.onChange}
                        options={catDefaultOptions}
                        error={categoryForm.formState.errors.name?.message}
                      />
                    )}
                  />
                )}
              </div>

              {/* 4. Sab Se Neechay: Preset Units & Sizes preview */}
              {catProfileConfig && (
                <div className={styles.presetInfoBox}>
                  {catProfileConfig.suggestedUnits && catProfileConfig.suggestedUnits.length > 0 && (
                    <div className={styles.presetChipRow}>
                      <span className={styles.presetChipLabel}>Preset Units:</span>
                      {catProfileConfig.suggestedUnits.map((unit) => (
                        <span key={unit} className={styles.presetUnitChip}>
                          {unit}
                        </span>
                      ))}
                    </div>
                  )}

                  {catProfileConfig.suggestedSizes && catProfileConfig.suggestedSizes.length > 0 && (
                    <div className={styles.presetChipRow}>
                      <span className={styles.presetChipLabel}>Preset Sizes:</span>
                      {catProfileConfig.suggestedSizes.map((size) => (
                        <span
                          key={size}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: `${catProfileConfig.accentColor}18`,
                            border: `1px solid ${catProfileConfig.accentColor}40`,
                            color: catProfileConfig.accentColor,
                          }}
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles.catFooter}>
              <Button
                appearance="subtle"
                type="button"
                onClick={() => setIsCategoryDialogOpen(false)}
                className={styles.catCancelBtn}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={saveCategoryMutation.isPending}
                className={styles.catSubmitBtn}
              >
                {saveCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
