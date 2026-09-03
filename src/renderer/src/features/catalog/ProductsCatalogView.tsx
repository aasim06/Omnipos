import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Badge,
  Input,
  Select,
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
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Product, Category, ModuleKey } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';

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
});

type CategoryFormData = z.infer<typeof categorySchema>;

const useStyles = makeStyles({
  container: {
    padding: '20px 24px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    backgroundColor: tokens.colorNeutralBackground2, // #F5F5F5 Mica Canvas
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  tableCard: {
    borderRadius: tokens.borderRadiusMedium, // 8px
    backgroundColor: tokens.colorNeutralBackground1, // White container
    boxShadow: tokens.shadow4, // Subtle Fluent elevation
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  categoryCard: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
  },
  productDialogSurface: {
    maxWidth: '980px',
    width: 'min(980px, 95vw)',
    minWidth: 'min(800px, 90vw)',
    maxHeight: 'min(92vh, 680px)',
    borderRadius: '16px',
    padding: '18px 24px 14px 24px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  productDialogContent: {
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0',
    flex: '1 1 auto',
    minHeight: '0',
  },
});

export function ProductsCatalogView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'all' | 'fastfood' | 'minimart' | 'categories'>('all');
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
      openingStock: 50,
      imageUrl: '',
      description: '',
    },
  });

  /* ── React Hook Form + Zod for Categories ──────────────────────────── */
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: '',
      module: 'fastfood',
    },
  });

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
      openingStock: 50,
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
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProductMutation.mutate(prod);
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    const cat: Category = {
      id: uid('cat_'),
      name: data.name.trim(),
      module: data.module,
    };
    saveCategoryMutation.mutate(cat);
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'fastfood' && p.module !== 'fastfood') return false;
    if (activeTab === 'minimart' && p.module !== 'minimart') return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (isLoadingProducts && products.length === 0) {
    return <TablePageSkeleton title="Products & Menu Catalog" hasMetrics={false} />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Products &amp; Menu Catalog
          </Subtitle1>
          <Caption1
            as="p"
            style={{ color: tokens.colorNeutralForeground2, margin: 0, display: 'block', fontSize: '13px' }}
          >
            Manage items, pricing, categories, SKU codes, and inventory levels
          </Caption1>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button
            appearance="outline"
            icon={<Tag20Regular />}
            style={{ borderRadius: tokens.borderRadiusMedium }}
            onClick={() => {
              categoryForm.reset({ name: '', module: activeTab === 'minimart' ? 'minimart' : 'fastfood' });
              setIsCategoryDialogOpen(true);
            }}
          >
            + New Category
          </Button>

          {/* Primary Action Button: Red Brand Accent (#E51937) */}
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            style={{ backgroundColor: '#E51937', borderRadius: tokens.borderRadiusMedium, fontWeight: 600 }}
            onClick={handleOpenAddProduct}
          >
            + Add New Product
          </Button>
        </div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, paddingBottom: '2px', overflowX: 'auto' }} className="no-scrollbar">
        <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as any)}>
          <Tab value="all">All Products ({products.length})</Tab>
          <Tab value="fastfood">Fast Food Items ({products.filter((p) => p.module === 'fastfood').length})</Tab>
          <Tab value="minimart">Mini Mart Goods ({products.filter((p) => p.module === 'minimart').length})</Tab>
          <Tab value="categories">Categories ({categories.length})</Tab>
        </TabList>
      </div>

      {/* ── Tab Content ───────────────────────────────────────── */}
      {activeTab === 'categories' ? (
        <div className={styles.categoryGrid}>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length;
            return (
              <div key={cat.id} className={styles.categoryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Body1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>{cat.name}</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                    {cat.module === 'fastfood' ? 'Fast Food' : 'Mini Mart'} • {count} product{count !== 1 ? 's' : ''}
                  </Caption1>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Delete20Regular style={{ color: '#D13438' }} />}
                  onClick={() => deleteCategoryMutation.mutate(cat.id)}
                  title="Delete Category"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.tableCard}>
          {/* Filter & Search Bar */}
          <div className={styles.filterBar}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Input
                appearance="outline"
                placeholder="Search products by name or SKU..."
                contentBefore={<Search20Regular />}
                value={searchTerm}
                onChange={(_, d) => setSearchTerm(d.value)}
                style={{ width: '320px' }}
              />

              <Select
                appearance="outline"
                value={selectedCategory}
                onChange={(_, d) => setSelectedCategory(d.value)}
                style={{ width: '180px' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>

            <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
              Showing {filteredProducts.length} items
            </Caption1>
          </div>

          {/* Fluent Table with responsive wrapper and high-end styling */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'auto' }}>
              <TableHeader>
                <TableRow style={{ backgroundColor: tokens.colorNeutralBackground3, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                  <TableHeaderCell style={{ padding: '12px 14px', width: '28%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                    Product Details
                  </TableHeaderCell>
                  <TableHeaderCell style={{ padding: '12px 12px', width: '15%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                    Category &amp; Type
                  </TableHeaderCell>
                  <TableHeaderCell style={{ padding: '12px 12px', width: '13%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                    Retail Price
                  </TableHeaderCell>
                  <TableHeaderCell style={{ padding: '12px 12px', width: '13%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                    Purchase Cost
                  </TableHeaderCell>
                  <TableHeaderCell style={{ padding: '12px 12px', width: '11%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                    Current Stock
                  </TableHeaderCell>
                  <TableHeaderCell style={{ padding: '12px 12px', width: '10%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                    SKU / Rack
                  </TableHeaderCell>
                  <TableHeaderCell style={{ padding: '12px 14px', width: '10%', textAlign: 'right', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} style={{ textAlign: 'center', padding: '40px', color: tokens.colorNeutralForeground3 }}>
                      No products found matching the criteria. Click "+ Add New Product" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.openingStock !== null && p.openingStock !== undefined && p.openingStock <= (p.minThreshold ?? 10);
                    const isFastFood = p.module === 'fastfood';

                    return (
                      <TableRow
                        key={p.id}
                        style={{
                          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <TableCell style={{ padding: '12px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '8px',
                                backgroundColor: tokens.colorNeutralBackground3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: `1px solid ${tokens.colorNeutralStroke2}`,
                              }}
                            >
                              {p.imageBase64 || p.imageUrl ? (
                                <img src={p.imageBase64 || p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : isFastFood ? (
                                <Food24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                              ) : (
                                <BuildingRetail24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>{p.name}</Body1>
                              {p.description && (
                                <Caption1 style={{ color: tokens.colorNeutralForeground2, maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.description}
                                </Caption1>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Badge size="medium" appearance="tint" color={isFastFood ? 'warning' : 'informative'}>
                              {p.category}
                            </Badge>
                            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                              ({isFastFood ? 'Food' : 'Retail'})
                            </Caption1>
                          </div>
                        </TableCell>

                        <TableCell style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
                            {formatPKR(p.price)}
                          </Body1>
                        </TableCell>

                        <TableCell style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>
                            {p.costPrice ? formatPKR(p.costPrice) : '—'}
                          </Caption1>
                        </TableCell>

                        <TableCell style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <Badge
                            size="medium"
                            appearance="filled"
                            color={isLow ? 'danger' : 'success'}
                            style={{ fontWeight: 700 }}
                          >
                            {p.openingStock ?? 0} {p.unit || 'PCS'}
                          </Badge>
                        </TableCell>

                        <TableCell style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Caption1 style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.skuCode || '—'}</Caption1>
                            {p.rackLocation && (
                              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Rack: {p.rackLocation}</Caption1>
                            )}
                          </div>
                        </TableCell>

                        <TableCell style={{ padding: '12px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
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
                              icon={<Delete20Regular style={{ color: '#D13438' }} />}
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
        <DialogSurface
          className={styles.productDialogSurface}
          style={{ width: 'min(980px, 95vw)', maxWidth: '980px', minWidth: 'min(800px, 90vw)' }}
        >
          <form onSubmit={productForm.handleSubmit(onProductSubmit)} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <DialogBody style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', padding: 0 }}>
              
              {/* Modal Header */}
              <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, flexShrink: 0 }}>
                <DialogTitle style={{ fontSize: '18px', fontWeight: 800, color: tokens.colorNeutralForeground1, margin: 0 }}>
                  {editingProduct ? 'Edit Product Item' : 'Add New Product to Catalog'}
                </DialogTitle>
                <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground2, marginTop: '2px' }}>
                  {editingProduct ? 'Update product pricing, inventory thresholds, and media' : 'Create a new product for Fast Food menu or Mini Mart supermarket'}
                </div>
              </div>

              {/* 2-Column Responsive Body */}
              <DialogContent
                className={`${styles.productDialogContent} no-scrollbar`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 280px',
                  gap: '18px',
                  alignItems: 'start',
                  paddingRight: '4px',
                  overflowY: 'auto',
                }}
              >
                {/* ── Left Column: Primary Product & Stock Form Details ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {/* Module & Category Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Target Module</Label>
                      <Controller
                        control={productForm.control}
                        name="module"
                        render={({ field }) => (
                          <Select
                            appearance="outline"
                            style={{ width: '100%' }}
                            value={field.value}
                            onChange={(_, d) => {
                              field.onChange(d.value as ModuleKey);
                              const firstCat = categories.find((c) => c.module === d.value)?.name || 'General';
                              productForm.setValue('category', firstCat);
                            }}
                          >
                            <option value="fastfood">Fast Food Menu</option>
                            <option value="minimart">Mini Mart Goods</option>
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
                          style={{
                            fontSize: '11.5px',
                            color: '#E51937',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
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
                            <optgroup label={watchedModule === 'fastfood' ? "Fast Food Categories (Recommended)" : "Mini Mart Categories (Recommended)"}>
                              {categories
                                .filter((c) => c.module === watchedModule)
                                .map((c) => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </optgroup>
                            {categories.some((c) => c.module !== watchedModule) && (
                              <optgroup label={watchedModule === 'fastfood' ? "Mini Mart Categories" : "Fast Food Categories"}>
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
                      {productForm.formState.errors.category && (
                        <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                          {productForm.formState.errors.category.message}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Name */}
                  <div>
                    <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Item / Product Name</Label>
                    <Controller
                      control={productForm.control}
                      name="name"
                      render={({ field }) => (
                        <Input
                          appearance="outline"
                          style={{ width: '100%' }}
                          placeholder="e.g. Crispy Zinger Burger, Super Basmati Rice, or Fresh Milk"
                          value={field.value}
                          onChange={(_, d) => field.onChange(d.value)}
                        />
                      )}
                    />
                    {productForm.formState.errors.name && (
                      <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                        {productForm.formState.errors.name.message}
                      </span>
                    )}
                  </div>

                  {/* Retail Price & Purchase Cost */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Retail Selling Price (PKR)</Label>
                      <Controller
                        control={productForm.control}
                        name="price"
                        render={({ field }) => (
                          <Input
                            appearance="outline"
                            type="number"
                            style={{ width: '100%' }}
                            placeholder="e.g. 550"
                            value={field.value !== undefined ? String(field.value) : ''}
                            onChange={(_, d) => field.onChange(d.value)}
                          />
                        )}
                      />
                      {productForm.formState.errors.price && (
                        <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                          {productForm.formState.errors.price.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Purchase Cost Price (PKR)</Label>
                      <Controller
                        control={productForm.control}
                        name="costPrice"
                        render={({ field }) => (
                          <Input
                            appearance="outline"
                            type="number"
                            style={{ width: '100%' }}
                            placeholder="e.g. 320"
                            value={field.value !== undefined ? String(field.value) : ''}
                            onChange={(_, d) => field.onChange(d.value)}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Unit of Measure & Opening Stock */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Unit of Measure</Label>
                      <Controller
                        control={productForm.control}
                        name="unit"
                        render={({ field }) => (
                          <Select
                            appearance="outline"
                            style={{ width: '100%' }}
                            value={field.value || 'PCS'}
                            onChange={(_, d) => field.onChange(d.value)}
                          >
                            <option value="PCS">PCS (Pieces / Packaged Goods)</option>
                            <option value="KG">KG (Kilograms - Sold by Weight: 250g, 500g, 1kg)</option>
                            <option value="Gram">Gram (Grams - Precision Weight)</option>
                            <option value="Liter">Liter (Liters - Sold by Volume: 250ml, 500ml, 1L)</option>
                            <option value="ML">ML (Milliliters)</option>
                            <option value="PACK">PACK (Packet / Bundle)</option>
                            <option value="BOX">BOX (Box / Carton)</option>
                            <option value="DOZEN">DOZEN (12 Units)</option>
                          </Select>
                        )}
                      />
                    </div>

                    <div>
                      <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Opening Stock</Label>
                      <Controller
                        control={productForm.control}
                        name="openingStock"
                        render={({ field }) => (
                          <Input
                            appearance="outline"
                            type="number"
                            style={{ width: '100%' }}
                            placeholder="50"
                            value={String(field.value ?? '')}
                            onChange={(_, d) => field.onChange(d.value)}
                          />
                        )}
                      />
                      {productForm.formState.errors.openingStock && (
                        <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                          {productForm.formState.errors.openingStock.message}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SKU & Rack Location */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>SKU / Barcode</Label>
                      <Controller
                        control={productForm.control}
                        name="skuCode"
                        render={({ field }) => (
                          <Input
                            appearance="outline"
                            style={{ width: '100%' }}
                            placeholder="Auto-generated"
                            value={field.value || ''}
                            onChange={(_, d) => field.onChange(d.value)}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Rack / Shelf Location</Label>
                      <Controller
                        control={productForm.control}
                        name="rackLocation"
                        render={({ field }) => (
                          <Input
                            appearance="outline"
                            style={{ width: '100%' }}
                            placeholder="e.g. Aisle 1 or Chiller-01"
                            value={field.value || ''}
                            onChange={(_, d) => field.onChange(d.value)}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Description / Notes */}
                  <div>
                    <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Description / Notes (Optional)</Label>
                    <Controller
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <Input
                          appearance="outline"
                          style={{ width: '100%' }}
                          placeholder="e.g. Fresh farm product, premium quality"
                          value={field.value || ''}
                          onChange={(_, d) => field.onChange(d.value)}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* ── Right Column: Visual Media & Live Interactive POS Card Preview (Compact 280px) ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '280px' }}>
                  
                  {/* Photo Upload Card */}
                  <div
                    style={{
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderRadius: '12px',
                      padding: '12px',
                      border: `1px solid ${tokens.colorNeutralStroke2}`,
                    }}
                  >
                    <Label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '12px' }}>
                      Product Media &amp; Photo
                    </Label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLocalImageSelect}
                      style={{ display: 'none' }}
                    />

                    {imagePreview ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${tokens.colorNeutralStroke1}`,
                          backgroundColor: tokens.colorNeutralBackground1,
                        }}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: `1px solid ${tokens.colorNeutralStroke2}`,
                            flexShrink: 0,
                            backgroundColor: '#1E1E1E',
                          }}
                        >
                          <img
                            src={imagePreview}
                            alt="Product Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
                            Photo Attached
                          </span>
                          <span style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {imagePreview.startsWith('data:') ? 'Local file' : imagePreview}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          <Button
                            size="small"
                            appearance="outline"
                            style={{ minWidth: 'auto', padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change
                          </Button>
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Dismiss16Regular style={{ color: '#D13438' }} />}
                            onClick={handleRemoveImage}
                            title="Remove image"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          padding: '14px 10px',
                          borderRadius: '8px',
                          border: `1.5px dashed ${tokens.colorNeutralStroke1}`,
                          backgroundColor: tokens.colorNeutralBackground1,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#E51937';
                          e.currentTarget.style.backgroundColor = 'rgba(229, 25, 55, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = tokens.colorNeutralStroke1;
                          e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1;
                        }}
                      >
                        <ArrowUpload20Regular style={{ width: 24, height: 24, color: '#E51937' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
                          Upload Photo from PC
                        </span>
                        <span style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3 }}>
                          PNG, JPG, WebP
                        </span>
                      </div>
                    )}

                    {/* Optional URL input fallback */}
                    <div style={{ marginTop: '8px' }}>
                      <Controller
                        control={productForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <Input
                            appearance="outline"
                            size="small"
                            style={{ width: '100%' }}
                            placeholder="Or paste an image web link..."
                            value={field.value && !field.value.startsWith('data:') ? field.value : ''}
                            onChange={(_, d) => {
                              field.onChange(d.value);
                              setImagePreview(d.value || null);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* ── Live POS Counter Card Preview ── */}
                  <div
                    style={{
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderRadius: '12px',
                      padding: '12px',
                      border: `1px solid ${tokens.colorNeutralStroke2}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: tokens.colorNeutralForeground2 }}>
                        Live POS Card Preview
                      </span>
                      <span style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3 }}>
                        {watchedModule === 'minimart' ? 'Supermarket' : 'Fast Food'}
                      </span>
                    </div>

                    {/* POS Card Mockup */}
                    <div
                      style={{
                        backgroundColor: tokens.colorNeutralBackground1,
                        borderRadius: '10px',
                        border: `1px solid ${tokens.colorNeutralStroke1}`,
                        overflow: 'hidden',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Media container: 60% of card (6 hissay: 114px) */}
                      <div
                        style={{
                          height: '114px',
                          width: '100%',
                          position: 'relative',
                          overflow: 'hidden',
                          backgroundColor: '#18181B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Live Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#71717A' }}>
                            <Image20Regular style={{ width: 28, height: 28 }} />
                            <span style={{ fontSize: '10.5px' }}>No photo selected</span>
                          </div>
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#FFFFFF',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {watchedCategory || 'Category'}
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9.5px',
                            fontWeight: 800,
                          }}
                        >
                          {watchedStock ?? 50} {watchedUnit || 'PCS'}
                        </div>
                      </div>

                      {/* Card Content: 40% of card (4 hissay: 76px) */}
                      <div style={{ height: '76px', padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '12.5px',
                            color: tokens.colorNeutralForeground1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {watchedName || 'Item Name Preview'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <div>
                            <div style={{ fontSize: '9px', color: tokens.colorNeutralForeground3, textTransform: 'uppercase', fontWeight: 600 }}>
                              Price
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '14.5px', color: '#E51937' }}>
                              PKR {watchedPrice ? Number(watchedPrice).toLocaleString() : '0'}
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: 'rgba(229, 25, 55, 0.1)',
                              color: '#E51937',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid rgba(229, 25, 55, 0.2)',
                            }}
                          >
                            per {watchedUnit || 'PCS'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>

              {/* Modal Footer Actions - Pinned at Bottom, Never Cut Off */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsProductDialogOpen(false)}
                  style={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '8px 18px',
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={saveProductMutation.isPending}
                  style={{
                    backgroundColor: '#E51937',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '9px 24px',
                    minWidth: '150px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
                  }}
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
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '420px', width: '100%', overflowX: 'hidden' }}>
          <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)}>
            <DialogBody style={{ overflowX: 'hidden' }}>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px', overflowX: 'hidden', overflowY: 'auto' }}>
                
                {/* Category Name */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Category Name</Label>
                  <Controller
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        style={{ width: '100%' }}
                        placeholder="e.g. Desserts, Beverages, Lubricants"
                        value={field.value}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                  {categoryForm.formState.errors.name && (
                    <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {categoryForm.formState.errors.name.message}
                    </span>
                  )}
                </div>

                {/* Module */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Assign to Module</Label>
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
                        <option value="minimart">Mini Mart Goods</option>
                      </Select>
                    )}
                  />
                </div>
              </DialogContent>
              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsCategoryDialogOpen(false)}
                  style={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '8px 18px',
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={saveCategoryMutation.isPending}
                  style={{
                    backgroundColor: '#E51937',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '9px 22px',
                    minWidth: '130px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
                  }}
                >
                  {saveCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
