import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Subtitle1,
  Body1,
  Caption1,
  Dialog,
  DialogSurface,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Delete20Regular,
  Food24Regular,
  BuildingRetail24Regular,
  Dismiss16Regular,
  Tag20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Category, Product, ModuleKey, CategoryProfile } from '@shared/types';
import { uid } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { CATEGORY_PROFILES, detectCategoryProfile } from '@/lib/categoryProfiles';
import { CustomInput, CustomSelect } from '@/components/ui';
import { useLicense } from '@/features/auth/LicenseModulesContext';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  module: z.enum(['fastfood', 'minimart']),
  profile: z.enum(['standard', 'apparel', 'footwear', 'hardware', 'food']).default('standard'),
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
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
    display: 'block',
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    margin: 0,
    display: 'block',
    fontSize: '13px',
    marginTop: '2px',
  },
  primaryBtn: {
    backgroundColor: '#E51937',
    color: '#ffffff',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 600,
    ':hover': {
      backgroundColor: '#be123c',
    },
  },
  sectionBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionBoxSpaced: {
    marginTop: '10px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
  },
  sectionIconRed: {
    color: '#E51937',
    width: '20px',
    height: '20px',
  },
  sectionAddBtn: {
    marginLeft: 'auto',
    fontSize: '12px',
    fontWeight: 600,
    color: '#E51937',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  categoryCard: {
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    ':hover': {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
      transform: 'translateY(-2px)',
    },
  },
  categoryCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tagIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tagIcon: {
    width: '18px',
    height: '18px',
  },
  categoryInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  categoryTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    fontSize: '14.5px',
  },
  categoryMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  profileBadge: {
    fontSize: '9.5px',
    fontWeight: 800,
    padding: '1px 6px',
    borderRadius: '4px',
  },
  productCountText: {
    color: tokens.colorNeutralForeground2,
    fontSize: '11.5px',
  },
  deleteActionBtn: {
    color: '#D13438',
  },

  // Modal Dialog
  dialogSurface: {
    maxWidth: '480px',
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
  fieldLabel: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 600,
    fontSize: '13px',
  },
  fullWidth: {
    width: '100%',
  },
  errorCaption: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: '4px',
    display: 'block',
  },
  hintCaption: {
    color: tokens.colorNeutralForeground3,
    marginTop: '5px',
    display: 'block',
    fontSize: '11px',
    lineHeight: '1.4',
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

  /* ── Industry Profile Classes ── */
  tagIconBoxStandard: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(100, 116, 139, 0.25)', borderBottomColor: 'rgba(100, 116, 139, 0.25)', borderLeftColor: 'rgba(100, 116, 139, 0.25)', borderRightColor: 'rgba(100, 116, 139, 0.25)',
    color: '#64748b',
  },
  tagIconBoxFood: {
    backgroundColor: 'rgba(229, 25, 55, 0.1)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.25)', borderBottomColor: 'rgba(229, 25, 55, 0.25)', borderLeftColor: 'rgba(229, 25, 55, 0.25)', borderRightColor: 'rgba(229, 25, 55, 0.25)',
    color: '#E51937',
  },
  tagIconBoxApparel: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(139, 92, 246, 0.25)', borderBottomColor: 'rgba(139, 92, 246, 0.25)', borderLeftColor: 'rgba(139, 92, 246, 0.25)', borderRightColor: 'rgba(139, 92, 246, 0.25)',
    color: '#8b5cf6',
  },
  tagIconBoxFootwear: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(59, 130, 246, 0.25)', borderBottomColor: 'rgba(59, 130, 246, 0.25)', borderLeftColor: 'rgba(59, 130, 246, 0.25)', borderRightColor: 'rgba(59, 130, 246, 0.25)',
    color: '#3b82f6',
  },
  tagIconBoxHardware: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(245, 158, 11, 0.25)', borderBottomColor: 'rgba(245, 158, 11, 0.25)', borderLeftColor: 'rgba(245, 158, 11, 0.25)', borderRightColor: 'rgba(245, 158, 11, 0.25)',
    color: '#f59e0b',
  },
  profileBadgeStandard: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    color: '#64748b',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(100, 116, 139, 0.25)', borderBottomColor: 'rgba(100, 116, 139, 0.25)', borderLeftColor: 'rgba(100, 116, 139, 0.25)', borderRightColor: 'rgba(100, 116, 139, 0.25)',
  },
  profileBadgeFood: {
    backgroundColor: 'rgba(229, 25, 55, 0.1)',
    color: '#E51937',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.25)', borderBottomColor: 'rgba(229, 25, 55, 0.25)', borderLeftColor: 'rgba(229, 25, 55, 0.25)', borderRightColor: 'rgba(229, 25, 55, 0.25)',
  },
  profileBadgeApparel: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#8b5cf6',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(139, 92, 246, 0.25)', borderBottomColor: 'rgba(139, 92, 246, 0.25)', borderLeftColor: 'rgba(139, 92, 246, 0.25)', borderRightColor: 'rgba(139, 92, 246, 0.25)',
  },
  profileBadgeFootwear: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(59, 130, 246, 0.25)', borderBottomColor: 'rgba(59, 130, 246, 0.25)', borderLeftColor: 'rgba(59, 130, 246, 0.25)', borderRightColor: 'rgba(59, 130, 246, 0.25)',
  },
  profileBadgeHardware: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(245, 158, 11, 0.25)', borderBottomColor: 'rgba(245, 158, 11, 0.25)', borderLeftColor: 'rgba(245, 158, 11, 0.25)', borderRightColor: 'rgba(245, 158, 11, 0.25)',
  },
  hintCaptionRow: {
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  hintCaptionLocked: {
    color: '#059669',
    fontWeight: 600,
  },
});

interface ProfileOption {
  value: CategoryProfile;
  label: string;
  module: ModuleKey;
}

const ALL_PROFILE_OPTIONS: ProfileOption[] = [
  { value: 'standard', label: 'Standard Retail (Grocery & General Goods)', module: 'minimart' },
  { value: 'apparel', label: 'Apparel & Clothing (Sizes: XS, S, M, L, XL, XXL, 3XL)', module: 'minimart' },
  { value: 'footwear', label: 'Footwear & Shoes (Sizes: 38 to 45)', module: 'minimart' },
  { value: 'hardware', label: 'Hardware, Iron & Paint (KG, Feet, Meters, Litres, Bags)', module: 'minimart' },
  { value: 'food', label: 'Restaurant & Fast Food (Portions: Regular, S, M, L, Family)', module: 'fastfood' },
];

export function CategoriesView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetModule, setTargetModule] = useState<ModuleKey>('fastfood');

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => posApi.fetchCategories(),
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: '',
      module: 'fastfood',
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const newCat: Category = {
        id: uid('cat_'),
        module: data.module,
        name: data.name.trim(),
        profile: data.profile,
      };
      return await posApi.saveCategory(newCat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      categoryForm.reset();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const { can, businessProfiles = ['standard', 'food'] } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  // Filtered by active license business profile(s)
  const allowedProfiles = useMemo<ProfileOption[]>(() => {
    const valid = ALL_PROFILE_OPTIONS.filter((opt: ProfileOption) => businessProfiles.includes(opt.value));
    return valid.length > 0 ? valid : ALL_PROFILE_OPTIONS;
  }, [businessProfiles]);

  const watchedModule = categoryForm.watch('module');

  // Profile options matching the current store module (fastfood vs minimart)
  const filteredProfileOptions = useMemo<ProfileOption[]>(() => {
    const forModule = allowedProfiles.filter((opt: ProfileOption) => opt.module === watchedModule);
    return forModule.length > 0 ? forModule : allowedProfiles;
  }, [allowedProfiles, watchedModule]);

  const isSingleBusinessProfile = businessProfiles.length === 1;
  const isProfileLocked = isSingleBusinessProfile || filteredProfileOptions.length === 1;

  const handleOpenDialog = (module?: ModuleKey) => {
    let selectedModule: ModuleKey = module || (hasFastFood ? 'fastfood' : 'minimart');
    let selectedProfile: CategoryProfile = 'standard';

    if (isSingleBusinessProfile) {
      const single = businessProfiles[0];
      selectedProfile = single;
      selectedModule = single === 'food' ? 'fastfood' : 'minimart';
    } else {
      const optionsForModule = allowedProfiles.filter((opt) => opt.module === selectedModule);
      if (optionsForModule.length > 0) {
        selectedProfile = optionsForModule[0].value;
      } else {
        selectedProfile = allowedProfiles[0]?.value || (selectedModule === 'fastfood' ? 'food' : 'standard');
      }
    }

    setTargetModule(selectedModule);
    categoryForm.reset({
      name: '',
      module: selectedModule,
      profile: selectedProfile,
    });
    setIsDialogOpen(true);
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  if (isLoadingCategories || isLoadingProducts) {
    return <TablePageSkeleton />;
  }

  const fastFoodCategories = categories.filter((c) => c.module === 'fastfood');
  const omnimartCategories = categories.filter((c) => c.module === 'minimart');

  return (
    <div className={`${styles.container} no-scrollbar`}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <Subtitle1 as="h1" className={styles.headerTitle}>
            Store Categories Manager
          </Subtitle1>
          <Caption1 as="p" className={styles.headerSubtitle}>
            Configure and organize category classifications across active store departments
          </Caption1>
        </div>

        <Button
          appearance="primary"
          icon={<Add20Regular />}
          className={styles.primaryBtn}
          onClick={() => handleOpenDialog()}
        >
          + New Category
        </Button>
      </div>

      {/* ── Fast Food Categories Section ──────────────────────── */}
      {hasFastFood && (
        <div className={styles.sectionBox}>
          <div className={styles.sectionTitle}>
            <Food24Regular className={styles.sectionIconRed} />
            <span>Fast Food Categories ({fastFoodCategories.length})</span>
            <Button
              size="small"
              appearance="subtle"
              className={styles.sectionAddBtn}
              onClick={() => handleOpenDialog('fastfood')}
            >
              + Add Food Category
            </Button>
          </div>
          <div className={styles.categoryGrid}>
            {fastFoodCategories.map((cat) => {
              const count = products.filter((p) => p.category === cat.name).length;
              const activeProfile = detectCategoryProfile(cat.name, cat.profile);
              const profileConfig = CATEGORY_PROFILES[activeProfile];
              const pStyles = profile === 'food'
                ? { tagBox: styles.tagIconBoxFood, badge: styles.profileBadgeFood }
                : profile === 'apparel'
                ? { tagBox: styles.tagIconBoxApparel, badge: styles.profileBadgeApparel }
                : profile === 'footwear'
                ? { tagBox: styles.tagIconBoxFootwear, badge: styles.profileBadgeFootwear }
                : profile === 'hardware'
                ? { tagBox: styles.tagIconBoxHardware, badge: styles.profileBadgeHardware }
                : { tagBox: styles.tagIconBoxStandard, badge: styles.profileBadgeStandard };

              return (
                <div key={cat.id} className={styles.categoryCard}>
                  <div className={styles.categoryCardLeft}>
                    <div className={mergeClasses(styles.tagIconBox, pStyles.tagBox)}>
                      <Tag20Regular className={styles.tagIcon} />
                    </div>
                    <div className={styles.categoryInfo}>
                      <Body1 className={styles.categoryTitle}>{cat.name}</Body1>
                      <div className={styles.categoryMetaRow}>
                        <span className={mergeClasses(styles.profileBadge, pStyles.badge)}>
                          {profileConfig.shortTag}
                        </span>
                        <Caption1 className={styles.productCountText}>
                          • {count} product{count !== 1 ? 's' : ''}
                        </Caption1>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="small"
                    appearance="subtle"
                    className={styles.deleteActionBtn}
                    icon={<Delete20Regular />}
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"? Products in this category will remain.`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    title="Delete category"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Omnimart Supermarket Categories Section ──────────── */}
      {hasOmnimart && (
        <div className={`${styles.sectionBox} ${styles.sectionBoxSpaced}`}>
          <div className={styles.sectionTitle}>
            <BuildingRetail24Regular className={styles.sectionIconRed} />
            <span>Omnimart Categories ({omnimartCategories.length})</span>
            <Button
              size="small"
              appearance="subtle"
              className={styles.sectionAddBtn}
              onClick={() => handleOpenDialog('minimart')}
            >
              + Add Omnimart Category
            </Button>
          </div>
          <div className={styles.categoryGrid}>
            {omnimartCategories.map((cat) => {
              const count = products.filter((p) => p.category === cat.name).length;
              const activeProfile = detectCategoryProfile(cat.name, cat.profile);
              const profileConfig = CATEGORY_PROFILES[activeProfile];
              const pStyles = activeProfile === 'food'
                ? { tagBox: styles.tagIconBoxFood, badge: styles.profileBadgeFood }
                : activeProfile === 'apparel'
                ? { tagBox: styles.tagIconBoxApparel, badge: styles.profileBadgeApparel }
                : activeProfile === 'footwear'
                ? { tagBox: styles.tagIconBoxFootwear, badge: styles.profileBadgeFootwear }
                : activeProfile === 'hardware'
                ? { tagBox: styles.tagIconBoxHardware, badge: styles.profileBadgeHardware }
                : { tagBox: styles.tagIconBoxStandard, badge: styles.profileBadgeStandard };

              return (
                <div key={cat.id} className={styles.categoryCard}>
                  <div className={styles.categoryCardLeft}>
                    <div className={mergeClasses(styles.tagIconBox, pStyles.tagBox)}>
                      <Tag20Regular className={styles.tagIcon} />
                    </div>
                    <div className={styles.categoryInfo}>
                      <Body1 className={styles.categoryTitle}>{cat.name}</Body1>
                      <div className={styles.categoryMetaRow}>
                        <span className={mergeClasses(styles.profileBadge, pStyles.badge)}>
                          {profileConfig.shortTag}
                        </span>
                        <Caption1 className={styles.productCountText}>
                          • {count} product{count !== 1 ? 's' : ''}
                        </Caption1>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="small"
                    appearance="subtle"
                    className={styles.deleteActionBtn}
                    icon={<Delete20Regular />}
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"? Products in this category will remain.`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    title="Delete category"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Create Category Dialog ─────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className={styles.dialogForm}>
            {/* Modal Header */}
            <div className={styles.dialogHeader}>
              <div className={styles.dialogHeaderLeft}>
                <div className={styles.dialogIconBox}>
                  <Tag20Regular />
                </div>
                <div>
                  <div className={styles.dialogTitleText}>Create New Category</div>
                  <div className={styles.dialogSubtitleText}>
                    Configure classification &amp; presets for {targetModule === 'fastfood' ? 'Fast Food' : 'Omnimart'}
                  </div>
                </div>
              </div>

              <Button
                size="small"
                appearance="subtle"
                icon={<Dismiss16Regular />}
                onClick={() => setIsDialogOpen(false)}
                type="button"
              />
            </div>

            {/* Form Fields with Floating Notch Labels */}
            <div className={styles.dialogFieldsContainer}>
              <Controller
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    label="Category Name"
                    required
                    placeholder="e.g. Burgers, Dairy, Snacks, Clothing, Hardware..."
                    error={categoryForm.formState.errors.name?.message}
                  />
                )}
              />

              <Controller
                control={categoryForm.control}
                name="module"
                render={({ field }) => {
                  const moduleOptions = [
                    ...(hasFastFood ? [{ value: 'fastfood', label: 'Fast Food Menu' }] : []),
                    ...(hasOmnimart ? [{ value: 'minimart', label: 'Omnimart Goods' }] : []),
                  ];
                  return (
                    <CustomSelect
                      label="Target Store Module"
                      required
                      value={field.value}
                      disabled={isSingleBusinessProfile || moduleOptions.length <= 1}
                      onChange={(val) => {
                        const newMod = val as ModuleKey;
                        field.onChange(newMod);
                        setTargetModule(newMod);
                        const forNewMod = allowedProfiles.filter((opt) => opt.module === newMod);
                        if (forNewMod.length > 0) {
                          categoryForm.setValue('profile', forNewMod[0].value);
                        }
                      }}
                      options={moduleOptions}
                    />
                  );
                }}
              />

              <div>
                <Controller
                  control={categoryForm.control}
                  name="profile"
                  render={({ field }) => (
                    <CustomSelect
                      label="Industry Profile (Size & Unit Presets)"
                      value={field.value || filteredProfileOptions[0]?.value || 'standard'}
                      disabled={isProfileLocked}
                      onChange={(val) => field.onChange(val as CategoryProfile)}
                      options={filteredProfileOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                    />
                  )}
                />
                <Caption1
                  className={mergeClasses(
                    styles.hintCaption,
                    styles.hintCaptionRow,
                    isProfileLocked && styles.hintCaptionLocked
                  )}
                >
                  {isProfileLocked ? (
                    <>
                      <span>🔒</span> Auto-selected & locked to your license business profile ({CATEGORY_PROFILES[categoryForm.watch('profile') || filteredProfileOptions[0]?.value || 'standard']?.shortTag})
                    </>
                  ) : (
                    'Industry presets filtered according to your active business license key.'
                  )}
                </Caption1>
              </div>
            </div>

            {/* Modal Actions */}
            <div className={styles.dialogActionsRow}>
              <Button
                appearance="subtle"
                type="button"
                onClick={() => setIsDialogOpen(false)}
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
