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
  price: z.coerce.number().positive('Retail price must be greater than 0'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional(),
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
  variantRowsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  variantRowItem: {
    display: 'grid',
    gridTemplateColumns: '70px 90px 110px 1fr 32px',
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

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  const watchedModule = productForm.watch('module');
  const watchedCategory = productForm.watch('category');
  const watchedName = productForm.watch('name');
  const watchedPrice = productForm.watch('price');
  const watchedStock = productForm.watch('openingStock');
  const watchedUnit = productForm.watch('unit');

  const activeCategoryObj = categories.find((c) => c.name === watchedCategory);
  const detectedProfile = detectCategoryProfile(watchedCategory || '', activeCategoryObj?.profile);
  const profileConfig = CATEGORY_PROFILES[detectedProfile];

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
      if (match && !categories.some((c) => c.name === productForm.getValues('category') && c.module === watchedModule)) {
        productForm.setValue('category', match.name);
      }
    }
  }, [watchedModule, categories, productForm]);

  const saveProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const newProduct: Product = {
        id: uid(data.module === 'fastfood' ? 'prod_ff_' : 'prod_mm_'),
        name: data.name.trim(),
        module: data.module,
        category: data.category,
        price: data.price,
        costPrice: data.costPrice,
        unit: data.unit,
        skuCode: data.skuCode || generateRandomSku(),
        rackLocation: data.rackLocation,
        prepTime: data.prepTime,
        openingStock: data.openingStock,
        minThreshold: data.minThreshold,
        imageUrl: imagePreview || data.imageUrl || undefined,
        description: data.description,
        variants: variants.length > 0 ? variants : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
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
      <form onSubmit={productForm.handleSubmit(onSubmit)}>
        <div className={styles.formGrid}>
          {/* Left Column: Form Details */}
          <div className={styles.cardSurface}>
            {/* Target Module & Category */}
            <div className={styles.twoColGrid}>
              <div>
                <Label required className={styles.fieldLabel}>
                  Target Store Module
                </Label>
                <Controller
                  control={productForm.control}
                  name="module"
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      className={styles.fullWidth}
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
                <div className={styles.fieldHeaderRow}>
                  <Label required className={styles.fieldLabel}>Category</Label>
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
                    const activeGroupCats = categories.filter(
                      (c) => c.module === watchedModule && (c.module === 'fastfood' ? hasFastFood : hasOmnimart),
                    );
                    const otherGroupCats = categories.filter(
                      (c) => c.module !== watchedModule && (c.module === 'fastfood' ? hasFastFood : hasOmnimart),
                    );

                    return (
                      <Select
                        appearance="outline"
                        className={styles.fullWidth}
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
              <Label required className={styles.fieldLabel}>Product Name</Label>
              <Controller
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <Input
                    {...field}
                    appearance="outline"
                    placeholder={watchedModule === 'fastfood' ? 'e.g. Crispy Zinger Burger' : 'e.g. Super Basmati Rice'}
                    className={styles.fullWidth}
                  />
                )}
              />
              {productForm.formState.errors.name && (
                <Caption1 className={styles.errorCaption}>
                  {productForm.formState.errors.name.message}
                </Caption1>
              )}
            </div>

            {/* Pricing & Stock Grid */}
            <div className={styles.threeColGrid}>
              <div>
                <Label required className={styles.fieldLabel}>
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
                      className={styles.fullWidth}
                    />
                  )}
                />
                {productForm.formState.errors.price && (
                  <Caption1 className={styles.errorCaption}>
                    {productForm.formState.errors.price.message}
                  </Caption1>
                )}
              </div>

              <div>
                <Label className={styles.fieldLabel}>
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
                      className={styles.fullWidth}
                    />
                  )}
                />
              </div>

              <div>
                <Label className={styles.fieldLabel}>
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
                      className={styles.fullWidth}
                    />
                  )}
                />
              </div>
            </div>

            {/* Unit & Barcode / SKU */}
            <div className={styles.threeColGrid}>
              <div>
                <Label className={styles.fieldLabel}>Measurement Unit</Label>
                <Controller
                  control={productForm.control}
                  name="unit"
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      className={styles.fullWidth}
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
                <div className={styles.fieldHeaderRow}>
                  <Label className={styles.fieldLabel}>
                    {watchedModule === 'fastfood' ? 'Kitchen Prep Time (mins)' : 'SKU / Barcode'}
                  </Label>
                  {watchedModule !== 'fastfood' && (
                    <button
                      type="button"
                      onClick={() => productForm.setValue('skuCode', generateRandomSku())}
                      title="Generate new unique barcode / SKU"
                      className={styles.linkBtn}
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
                        className={styles.fullWidth}
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
                        className={styles.fullWidth}
                      />
                    )}
                  />
                )}
              </div>

              <div>
                <Label className={styles.fieldLabel}>
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
                        className={styles.fullWidth}
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
                        className={styles.fullWidth}
                      />
                    )}
                  />
                )}
              </div>
            </div>

            {/* Quick Unit Presets Bar */}
            {profileConfig.suggestedUnits.length > 0 && (
              <div className={styles.presetsBar}>
                <div className={styles.presetsTitle}>
                  Quick Unit Presets:
                </div>
                <div className={styles.presetsWrap}>
                  {profileConfig.suggestedUnits.map((u) => {
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
            )}

            {/* ── Smart Product Variants & Size Matrix Section ── */}
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

                  <div className={styles.variantRowsList}>
                    {variants.map((v) => (
                      <div key={v.id} className={styles.variantRowItem}>
                        <div className={styles.variantRowLabel} style={{ color: profileConfig.accentColor }}>
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
                            className={styles.fullWidth}
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
                            className={styles.fullWidth}
                          />
                        </div>

                        <div>
                          <Input
                            size="small"
                            appearance="outline"
                            placeholder="SKU / Barcode"
                            value={v.skuCode || ''}
                            onChange={(_, d) => handleUpdateVariant(v.id, { skuCode: d.value })}
                            className={styles.fullWidth}
                          />
                        </div>

                        <Button
                          size="small"
                          appearance="subtle"
                          className={styles.variantDeleteBtn}
                          icon={<Delete20Regular />}
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
              <Label className={styles.fieldLabel}>Item Description</Label>
              <Controller
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    appearance="outline"
                    placeholder="Short description or notes for kitchen / customer..."
                    className={styles.descTextarea}
                  />
                )}
              />
            </div>
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
                    <Input
                      {...field}
                      size="small"
                      appearance="outline"
                      placeholder="Or paste web image URL..."
                      className={styles.fullWidth}
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

                {/* 4 Parts Details (76px) */}
                <div className={styles.previewDetailsWrap}>
                  <div>
                    <div className={styles.previewProductTitle}>
                      {watchedName || 'Product Title'}
                    </div>
                    {variants.length > 0 ? (
                      <div className={styles.previewVariantsRow}>
                        {variants.slice(0, 4).map((v) => (
                          <span key={v.id} className={styles.previewVariantBadge}>
                            {v.label}
                          </span>
                        ))}
                        {variants.length > 4 && (
                          <span className={styles.previewMoreVariantsText}>
                            +{variants.length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className={styles.previewCategoryText}>
                        {watchedCategory || 'Category'} • {watchedUnit || 'PCS'}
                      </div>
                    )}
                  </div>
                  <div className={styles.previewBottomRow}>
                    <div className={styles.previewPriceText}>
                      {watchedPrice ? formatPKR(watchedPrice) : 'PKR 0'}
                    </div>
                    <div className={styles.previewModuleText}>
                      {watchedModule === 'fastfood' ? 'Fast Food' : 'Omnimart'}
                    </div>
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
              <div>
                <Label required className={styles.fieldLabel}>
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
                      className={styles.fullWidth}
                    />
                  )}
                />
                {categoryForm.formState.errors.name && (
                  <Caption1 className={styles.errorCaption}>
                    {categoryForm.formState.errors.name.message}
                  </Caption1>
                )}
              </div>

              <div>
                <Label required className={styles.fieldLabel}>
                  Target Store Module
                </Label>
                <Controller
                  control={categoryForm.control}
                  name="module"
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      className={styles.fullWidth}
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
