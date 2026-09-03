import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Select,
  Label,
  Subtitle1,
  Body1,
  Caption1,
  Textarea,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
} from '@fluentui/react-components';
import {
  ArrowLeft20Regular,
  Save20Regular,
  Image20Regular,
  Dismiss16Regular,
  Add20Regular,
  Tag20Regular,
  Food24Regular,
  BuildingRetail24Regular,
  Delete20Regular,
  Sparkle20Regular,
  Grid20Regular,
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
  minThreshold: z.coerce.number().min(0).default(10),
  prepTime: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
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
  cardSurface: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '24px',
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

  const watchedModule = productForm.watch('module');
  const watchedName = productForm.watch('name');
  const watchedPrice = productForm.watch('price');
  const watchedCategory = productForm.watch('category');
  const watchedUnit = productForm.watch('unit');
  const watchedStock = productForm.watch('openingStock');

  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Detected profile from selected category
  const activeCategoryObj = categories.find((c) => c.name === watchedCategory);
  const detectedProfile = detectCategoryProfile(watchedCategory || '', activeCategoryObj?.profile);
  const profileConfig = CATEGORY_PROFILES[detectedProfile];

  // Auto toggle size variants
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

  useEffect(() => {
    if (categories.length > 0) {
      const match = categories.find((c) => c.module === watchedModule);
      if (match) {
        productForm.setValue('category', match.name);
      }
    }
  }, [watchedModule, categories]);

  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const totalStock = hasVariants && variants.length > 0
        ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : data.openingStock;

      const newProduct: Product = {
        id: uid(data.module === 'fastfood' ? 'prod_ff_' : 'prod_mm_'),
        name: data.name,
        module: data.module,
        category: data.category,
        price: data.price,
        costPrice: data.costPrice,
        unit: data.unit,
        skuCode: data.skuCode,
        rackLocation: data.rackLocation,
        openingStock: totalStock,
        minThreshold: data.minThreshold,
        prepTime: data.prepTime,
        description: data.description,
        imageUrl: data.imageUrl,
        hasVariants: hasVariants && variants.length > 0,
        variants: hasVariants && variants.length > 0 ? variants : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return await posApi.saveProduct(newProduct);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (variables.module === 'fastfood') {
        navigate('/catalog/fastfood');
      } else {
        navigate('/catalog/omnimart');
      }
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const newCat: Category = {
        id: uid('cat_'),
        module: data.module,
        name: data.name,
      };
      return await posApi.saveCategory(newCat);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryDialogOpen(false);
      productForm.setValue('category', saved.name);
      categoryForm.reset();
    },
  });

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            appearance="subtle"
            icon={<ArrowLeft20Regular />}
            onClick={() => navigate(-1)}
            style={{ borderRadius: '8px' }}
          >
            Back
          </Button>
          <div>
            <Subtitle1
              as="h1"
              style={{ fontWeight: 800, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0 }}
            >
              Add New Product to Catalog
            </Subtitle1>
            <Caption1 style={{ color: tokens.colorNeutralForeground2, marginTop: '2px', display: 'block' }}>
              Create a new item for Fast Food menu or Omnimart supermarket inventory
            </Caption1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            appearance="subtle"
            onClick={() => navigate(-1)}
            style={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<Save20Regular />}
            disabled={saveProductMutation.isPending}
            onClick={productForm.handleSubmit(onSubmit)}
            style={{ backgroundColor: '#E51937', borderRadius: '8px', fontWeight: 600 }}
          >
            {saveProductMutation.isPending ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      {/* ── Main Form Layout ──────────────────────────────────── */}
      <form onSubmit={productForm.handleSubmit(onSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'stretch' }}>
          {/* Left Column: Form Details */}
          <div className={styles.cardSurface} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Target Module & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Target Store Module
                </Label>
                <Controller
                  control={productForm.control}
                  name="module"
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      style={{ width: '100%' }}
                      value={field.value}
                      onChange={(_, d) => field.onChange(d.value as ModuleKey)}
                    >
                      {hasFastFood && <option value="fastfood">Fast Food Menu</option>}
                      {hasOmnimart && <option value="minimart">Omnimart Supermarket</option>}
                    </Select>
                  )}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <Label required style={{ fontWeight: 600 }}>Category</Label>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      categoryForm.reset({ name: '', module: watchedModule });
                      setIsCategoryDialogOpen(true);
                    }}
                    style={{ fontSize: '12px', color: '#E51937', fontWeight: 700, cursor: 'pointer' }}
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

                    return (
                      <Select
                        appearance="outline"
                        style={{ width: '100%' }}
                        value={field.value}
                        onChange={(_, d) => field.onChange(d.value)}
                      >
                        {activeGroupCats.length > 0 && (
                          <optgroup label={watchedModule === 'fastfood' ? 'Fast Food Categories' : 'Omnimart Categories'}>
                            {activeGroupCats.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </optgroup>
                        )}
                        {otherGroupCats.length > 0 && (
                          <optgroup label={watchedModule === 'fastfood' ? 'Omnimart Categories' : 'Fast Food Categories'}>
                            {otherGroupCats.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                    );
                  }}
                />
              </div>
            </div>

            {/* Product Name */}
            <div>
              <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Product Name</Label>
              <Controller
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <Input
                    {...field}
                    appearance="outline"
                    placeholder={watchedModule === 'fastfood' ? 'e.g. Crispy Zinger Burger' : 'e.g. Super Basmati Rice'}
                    style={{ width: '100%' }}
                  />
                )}
              />
              {productForm.formState.errors.name && (
                <Caption1 style={{ color: tokens.colorPaletteRedForeground1, marginTop: '4px', display: 'block' }}>
                  {productForm.formState.errors.name.message}
                </Caption1>
              )}
            </div>

            {/* Pricing & Stock Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Selling Price (PKR)
                </Label>
                <Controller
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      appearance="outline"
                      placeholder="e.g. 550"
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(_, d) => field.onChange(d.value === '' ? undefined : Number(d.value))}
                      style={{ width: '100%' }}
                    />
                  )}
                />
                {productForm.formState.errors.price && (
                  <Caption1 style={{ color: tokens.colorPaletteRedForeground1, marginTop: '4px', display: 'block' }}>
                    {productForm.formState.errors.price.message}
                  </Caption1>
                )}
              </div>

              <div>
                <Label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Cost Price (PKR)
                </Label>
                <Controller
                  control={productForm.control}
                  name="costPrice"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      appearance="outline"
                      placeholder="e.g. 380"
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(_, d) => field.onChange(d.value === '' ? undefined : Number(d.value))}
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </div>

              <div>
                <Label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Opening Stock
                </Label>
                <Controller
                  control={productForm.control}
                  name="openingStock"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      appearance="outline"
                      placeholder="e.g. 50"
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(_, d) => field.onChange(d.value === '' ? 0 : Number(d.value))}
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </div>
            </div>

            {/* Unit & Barcode / SKU */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <Label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Measurement Unit</Label>
                <Controller
                  control={productForm.control}
                  name="unit"
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      style={{ width: '100%' }}
                      value={field.value}
                      onChange={(_, d) => field.onChange(d.value)}
                    >
                      <option value="PCS">Piece (PCS)</option>
                      <option value="KG">Kilogram (KG)</option>
                      <option value="Gram">Gram (g)</option>
                      <option value="Liter">Liter (L)</option>
                      <option value="ML">Milliliter (ml)</option>
                      <option value="PACK">Pack</option>
                      <option value="BOX">Box</option>
                      <option value="DOZEN">Dozen</option>
                      <option value="FEET">Feet (ft)</option>
                      <option value="METER">Meter (m)</option>
                      <option value="GALLON">Gallon</option>
                      <option value="BAG">Bag</option>
                      <option value="BUNDLE">Bundle</option>
                      <option value="PAIR">Pair</option>
                    </Select>
                  )}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <Label style={{ fontWeight: 600 }}>
                    {watchedModule === 'fastfood' ? 'Kitchen Prep Time (mins)' : 'SKU / Barcode'}
                  </Label>
                  {watchedModule !== 'fastfood' && (
                    <button
                      type="button"
                      onClick={() => productForm.setValue('skuCode', generateRandomSku())}
                      title="Generate new unique barcode / SKU"
                      style={{
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
                      }}
                    >
                      ↻ Auto Generate
                    </button>
                  )}
                </div>
                {watchedModule === 'fastfood' ? (
                  <Controller
                    control={productForm.control}
                    name="prepTime"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        appearance="outline"
                        placeholder="e.g. 15"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(_, d) => field.onChange(d.value === '' ? undefined : Number(d.value))}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    control={productForm.control}
                    name="skuCode"
                    render={({ field }) => (
                      <Input
                        {...field}
                        appearance="outline"
                        placeholder="e.g. 89915275 (or scan barcode)"
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                )}
              </div>

              <div>
                <Label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  {watchedModule === 'fastfood' ? 'Low Stock Alert' : 'Store Rack Location'}
                </Label>
                {watchedModule === 'fastfood' ? (
                  <Controller
                    control={productForm.control}
                    name="minThreshold"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        appearance="outline"
                        placeholder="e.g. 10"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(_, d) => field.onChange(d.value === '' ? 10 : Number(d.value))}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    control={productForm.control}
                    name="rackLocation"
                    render={({ field }) => (
                      <Input
                        {...field}
                        appearance="outline"
                        placeholder="e.g. Aisle 3, Shelf B"
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                )}
              </div>
            </div>

            {/* Quick Unit Presets Bar with generous spacing */}
            {profileConfig.suggestedUnits.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  marginTop: '2px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: tokens.colorNeutralForeground2, whiteSpace: 'nowrap' }}>
                  Quick Unit Presets:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {profileConfig.suggestedUnits.map((u) => {
                    const isSelected = watchedUnit === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => productForm.setValue('unit', u)}
                        style={{
                          fontSize: '11px',
                          fontWeight: isSelected ? 800 : 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: isSelected ? `1.5px solid ${profileConfig.accentColor}` : `1px solid ${tokens.colorNeutralStroke1}`,
                          backgroundColor: isSelected ? `${profileConfig.accentColor}25` : tokens.colorNeutralBackground1,
                          color: isSelected ? profileConfig.accentColor : tokens.colorNeutralForeground2,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Smart Product Variants & Size Matrix Section ── */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: `1px solid ${hasVariants || profileConfig.suggestedSizes.length > 0 ? `${profileConfig.accentColor}44` : tokens.colorNeutralStroke1}`,
                backgroundColor: hasVariants || profileConfig.suggestedSizes.length > 0 ? `${profileConfig.accentColor}08` : tokens.colorNeutralBackground3,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: `${profileConfig.accentColor}22`,
                      color: profileConfig.accentColor,
                      border: `1px solid ${profileConfig.accentColor}44`,
                    }}
                  >
                    {profileConfig.shortTag}
                  </span>
                  <Label style={{ fontWeight: 700, fontSize: '13.5px' }}>
                    {detectedProfile === 'apparel'
                      ? 'Clothing Sizes Matrix (S, M, L, XL)'
                      : detectedProfile === 'footwear'
                      ? 'Shoe Sizes Matrix (38 - 45)'
                      : detectedProfile === 'food'
                      ? 'Food Portion Sizes'
                      : 'Product Variants & Sizes'}
                  </Label>
                </div>

                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Add20Regular />}
                  onClick={handleAddCustomVariant}
                  style={{ fontSize: '11.5px', fontWeight: 600, color: profileConfig.accentColor }}
                >
                  + Custom Variant
                </Button>
              </div>

              {/* Size Suggestion Chips */}
              {profileConfig.suggestedSizes.length > 0 && (
                <div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '6px' }}>
                    Click sizes to add to inventory matrix:
                  </Caption1>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profileConfig.suggestedSizes.map((size) => {
                      const isSelected = variants.some((v) => v.label.toLowerCase() === size.toLowerCase());
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleToggleSize(size)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: isSelected ? `2px solid ${profileConfig.accentColor}` : `1px solid ${tokens.colorNeutralStroke1}`,
                            backgroundColor: isSelected ? `${profileConfig.accentColor}22` : tokens.colorNeutralBackground1,
                            color: isSelected ? profileConfig.accentColor : tokens.colorNeutralForeground1,
                            fontWeight: isSelected ? 800 : 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{size}</span>
                          {isSelected && <span style={{ fontSize: '10px' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variants Matrix Table */}
              {variants.length > 0 && (
                <div style={{ marginTop: '4px', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Caption1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground2 }}>
                      Configured Variants ({variants.length}) — Total Variant Stock:{' '}
                      <strong style={{ color: tokens.colorNeutralForeground1 }}>
                        {variants.reduce((sum, v) => sum + (v.stock || 0), 0)} {watchedUnit || 'PCS'}
                      </strong>
                    </Caption1>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {variants.map((v) => (
                      <div
                        key={v.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '70px 90px 110px 1fr 32px',
                          gap: '8px',
                          alignItems: 'center',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          backgroundColor: tokens.colorNeutralBackground1,
                          border: `1px solid ${tokens.colorNeutralStroke1}`,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '12.5px', color: profileConfig.accentColor }}>
                          {v.label}
                        </div>

                        <div>
                          <Input
                            size="small"
                            type="number"
                            appearance="outline"
                            placeholder="Stock"
                            value={v.stock !== undefined ? String(v.stock) : ''}
                            onChange={(_, d) =>
                              handleUpdateVariant(v.id, { stock: d.value === '' ? 0 : Number(d.value) })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>

                        <div>
                          <Input
                            size="small"
                            type="number"
                            appearance="outline"
                            placeholder="+/- Price"
                            value={v.priceDelta !== undefined ? String(v.priceDelta) : ''}
                            onChange={(_, d) =>
                              handleUpdateVariant(v.id, { priceDelta: d.value === '' ? 0 : Number(d.value) })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>

                        <div>
                          <Input
                            size="small"
                            appearance="outline"
                            placeholder="SKU / Barcode"
                            value={v.skuCode || ''}
                            onChange={(_, d) => handleUpdateVariant(v.id, { skuCode: d.value })}
                            style={{ width: '100%' }}
                          />
                        </div>

                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Delete20Regular style={{ color: '#D13438' }} />}
                          onClick={() => handleRemoveVariant(v.id)}
                          title="Remove Variant"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Item Description</Label>
              <Controller
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    appearance="outline"
                    placeholder="Short description or notes for kitchen / customer..."
                    style={{ width: '100%', minHeight: '70px' }}
                  />
                )}
              />
            </div>
          </div>

          {/* Right Column: Image Upload & Live POS Card Preview */}
          <div className={styles.cardSurface} style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: '100%', boxSizing: 'border-box' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: tokens.colorNeutralForeground1, marginBottom: '4px' }}>
                Product Image
              </div>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginBottom: '10px' }}>
                Upload a photo or paste an image URL
              </Caption1>

              {/* Image Uploader */}
              <div
                style={{
                  border: `2px dashed ${tokens.colorNeutralStroke1}`,
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: tokens.colorNeutralBackground2,
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLocalImageSelect}
                  style={{ display: 'none' }}
                />
                <Image20Regular style={{ width: 28, height: 28, color: tokens.colorNeutralForeground3, margin: '0 auto 6px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#E51937' }}>
                  Click to upload local image
                </div>
                <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
                  PNG, JPG, WebP up to 5MB
                </Caption1>
              </div>

              {/* Web URL input */}
              <div style={{ marginTop: '10px' }}>
                <Controller
                  control={productForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <Input
                      {...field}
                      size="small"
                      appearance="outline"
                      placeholder="Or paste web image URL..."
                      style={{ width: '100%' }}
                      onChange={(_, d) => {
                        field.onChange(d.value);
                        setImagePreview(d.value || null);
                      }}
                    />
                  )}
                />
              </div>
            </div>

            {/* Live POS Preview Card (6:4 Exact Proportion) */}
            <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke1}`, paddingTop: '14px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: tokens.colorNeutralForeground2, textTransform: 'uppercase', marginBottom: '8px' }}>
                Live POS Card Preview
              </div>
              <div
                style={{
                  width: '100%',
                  height: '190px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  backgroundColor: tokens.colorNeutralBackground1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: tokens.shadow4,
                }}
              >
                {/* 6 Parts Image (114px) */}
                <div style={{ height: '114px', width: '100%', position: 'relative', backgroundColor: tokens.colorNeutralBackground3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imagePreview || productForm.watch('imageUrl') ? (
                    <img
                      src={imagePreview || productForm.watch('imageUrl')}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: tokens.colorNeutralForeground4 }}>
                      <Image20Regular style={{ width: 28, height: 28 }} />
                      <span style={{ fontSize: '11px' }}>No photo</span>
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {variants.length > 0
                      ? `${variants.reduce((sum, v) => sum + (v.stock || 0), 0)} left`
                      : `${watchedStock ?? 50} left`}
                  </div>
                </div>

                {/* 4 Parts Details (76px) */}
                <div style={{ height: '76px', padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: tokens.colorNeutralForeground1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {watchedName || 'Product Title'}
                    </div>
                    {variants.length > 0 ? (
                      <div style={{ display: 'flex', gap: '3px', marginTop: '2px', overflow: 'hidden' }}>
                        {variants.slice(0, 4).map((v) => (
                          <span
                            key={v.id}
                            style={{
                              fontSize: '8.5px',
                              fontWeight: 800,
                              padding: '0 4px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(229, 25, 55, 0.12)',
                              color: '#E51937',
                              border: '1px solid rgba(229, 25, 55, 0.25)',
                            }}
                          >
                            {v.label}
                          </span>
                        ))}
                        {variants.length > 4 && (
                          <span style={{ fontSize: '8.5px', color: tokens.colorNeutralForeground3 }}>
                            +{variants.length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3 }}>
                        {watchedCategory || 'Category'} • {watchedUnit || 'PCS'}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#E51937' }}>
                      {watchedPrice ? formatPKR(watchedPrice) : 'PKR 0'}
                    </div>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: tokens.colorNeutralForeground3 }}>
                      {watchedModule === 'fastfood' ? 'Fast Food' : 'Omnimart'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Catalog Pro Tip (Pinned to bottom of stretched right card) */}
            <div
              style={{
                marginTop: 'auto',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: tokens.colorNeutralBackground3,
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: tokens.colorNeutralForeground1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                POS Display Pro Tip
              </div>
              <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '11px', lineHeight: 1.4 }}>
                Product cards follow 6:4 visual ratio (60% image, 40% details) for touch accuracy and barcode scanning readability on all POS registers.
              </Caption1>
            </div>
          </div>
        </div>
      </form>

      {/* ── Quick Category Modal ───────────────────────────────── */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(_, d) => setIsCategoryDialogOpen(d.open)}>
        <DialogSurface
          style={{
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
          }}
        >
          <form
            onSubmit={categoryForm.handleSubmit((d) => createCategoryMutation.mutate(d))}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(229, 25, 55, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#E51937',
                  }}
                >
                  <Tag20Regular style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                    Create New Category
                  </div>
                  <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
              <div>
                <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                  Category Name
                </Label>
                <Controller
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      {...field}
                      appearance="outline"
                      placeholder="e.g. Burgers, Dairy, Shirts, Shoes..."
                      style={{ width: '100%' }}
                    />
                  )}
                />
                {categoryForm.formState.errors.name && (
                  <Caption1 style={{ color: tokens.colorPaletteRedForeground1, marginTop: '4px', display: 'block' }}>
                    {categoryForm.formState.errors.name.message}
                  </Caption1>
                )}
              </div>

              <div>
                <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                  Target Store Module
                </Label>
                <Controller
                  control={categoryForm.control}
                  name="module"
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      style={{ width: '100%' }}
                      value={field.value}
                      onChange={(_, d) => field.onChange(d.value as ModuleKey)}
                    >
                      {hasFastFood && <option value="fastfood">Fast Food Menu</option>}
                      {hasOmnimart && <option value="minimart">Omnimart Supermarket</option>}
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '6px',
                paddingTop: '14px',
                borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                width: '100%',
              }}
            >
              <Button
                appearance="subtle"
                type="button"
                onClick={() => setIsCategoryDialogOpen(false)}
                style={{ borderRadius: '8px', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={createCategoryMutation.isPending}
                style={{ backgroundColor: '#E51937', borderRadius: '8px', fontWeight: 700, padding: '0 20px' }}
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
