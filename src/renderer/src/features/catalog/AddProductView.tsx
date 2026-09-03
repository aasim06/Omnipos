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
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Product, Category, ModuleKey } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';

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

  const defaultModule = (searchParams.get('module') as ModuleKey) || 'fastfood';

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => posApi.fetchCategories(),
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      module: defaultModule,
      category: 'General',
      price: undefined,
      costPrice: undefined,
      unit: defaultModule === 'minimart' ? 'PCS' : 'PCS',
      skuCode: '',
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
        openingStock: data.openingStock,
        minThreshold: data.minThreshold,
        prepTime: data.prepTime,
        description: data.description,
        imageUrl: data.imageUrl,
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
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
                      <option value="fastfood">Fast Food Menu</option>
                      <option value="minimart">Omnimart Supermarket</option>
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
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      style={{ width: '100%' }}
                      value={field.value}
                      onChange={(_, d) => field.onChange(d.value)}
                    >
                      <optgroup label={watchedModule === 'fastfood' ? 'Fast Food Categories' : 'Omnimart Categories'}>
                        {categories
                          .filter((c) => c.module === watchedModule)
                          .map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                      </optgroup>
                      {categories.some((c) => c.module !== watchedModule) && (
                        <optgroup label={watchedModule === 'fastfood' ? 'Omnimart Categories' : 'Fast Food Categories'}>
                          {categories
                            .filter((c) => c.module !== watchedModule)
                            .map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </optgroup>
                      )}
                    </Select>
                  )}
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
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  {watchedModule === 'fastfood' ? 'Kitchen Prep Time (mins)' : 'SKU / Barcode'}
                </Label>
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
                        placeholder="e.g. 89915275"
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
          <div className={styles.cardSurface} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    {watchedStock ?? 50} left
                  </div>
                </div>

                {/* 4 Parts Details (76px) */}
                <div style={{ height: '76px', padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: tokens.colorNeutralForeground1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {watchedName || 'Product Title'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3 }}>
                      {watchedCategory || 'Category'} • {watchedUnit || 'PCS'}
                    </div>
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
          </div>
        </div>
      </form>

      {/* ── Quick Category Modal ───────────────────────────────── */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(_, d) => setIsCategoryDialogOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '420px', borderRadius: '12px', padding: '24px' }}>
          <form onSubmit={categoryForm.handleSubmit((d) => createCategoryMutation.mutate(d))}>
            <DialogBody style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <DialogTitle style={{ fontSize: '17px', fontWeight: 800 }}>Create New Category</DialogTitle>
                <Button size="small" appearance="subtle" icon={<Dismiss16Regular />} onClick={() => setIsCategoryDialogOpen(false)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Category Name</Label>
                  <Controller
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <Input {...field} appearance="outline" placeholder="e.g. Burgers, Dairy" style={{ width: '100%' }} />
                    )}
                  />
                </div>
                <div>
                  <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Module</Label>
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
                        <option value="fastfood">Fast Food Menu</option>
                        <option value="minimart">Omnimart Supermarket</option>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <DialogActions style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button appearance="subtle" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                <Button appearance="primary" type="submit" style={{ backgroundColor: '#E51937' }}>
                  {createCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
