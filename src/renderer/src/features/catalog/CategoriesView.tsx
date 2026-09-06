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
  LockClosed16Regular,
  Flash20Regular,
  Sparkle20Regular,
} from '@fluentui/react-icons';
import {
  Footprints,
  Shirt,
  ShoppingBag,
  Palette,
  HeartPulse,
  Smartphone,
  Cake,
  Utensils,
  Wrench,
  Zap,
  Package,
} from 'lucide-react';
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
    'standard',
  ]).default('standard'),
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

  /* ── 1-Click Industry Templates Modal Styles ── */
  templateDialogSurface: {
    maxWidth: '1040px',
    width: '95vw',
    maxHeight: '90vh',
    borderRadius: '16px',
    padding: '24px',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  templateDialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: '16px',
  },
  templateHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  templateIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
    flexShrink: 0,
  },
  templateDialogTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  templateDialogSubtitle: {
    fontSize: '12.5px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  successBanner: {
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#059669',
    fontWeight: 700,
    fontSize: '13px',
    marginBottom: '16px',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: '16px',
    paddingBottom: '10px',
  },
  templateCard: {
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.15s ease-in-out',
    ':hover': {
      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
      transform: 'translateY(-2px)',
    },
  },
  templateCardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  templateCardIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  templateCardMeta: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  templateCardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCardTitle: {
    fontWeight: 800,
    fontSize: '13.5px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.3',
  },
  templateCardUrdu: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  templateCardDesc: {
    fontSize: '11.5px',
    color: tokens.colorNeutralForeground2,
    margin: 0,
    lineHeight: '1.4',
  },
  templateSpecsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '6px 10px',
    borderRadius: '6px',
  },
  specLabel: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
  },
  specValue: {
    fontWeight: 600,
  },
  specDivider: {
    opacity: 0.5,
  },
  chipsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flex: 1,
  },
  chipsTitle: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  chipsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  previewChip: {
    fontSize: '10.5px',
    padding: '2px 7px',
    borderRadius: '4px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    fontWeight: 500,
  },
  templateCardFooter: {
    marginTop: 'auto',
    paddingTop: '6px',
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
  { value: 'footwear', label: 'Footwear & Shoes Store (Sizes 38-45, PAIR)', module: 'minimart' },
  { value: 'apparel', label: 'Garments, Clothing & Boutique (XS-3XL, SUIT, METER, GAZ)', module: 'minimart' },
  { value: 'grocery', label: 'Grocery, Supermarket & Mini Mart (Barcode, KG, Gram, Liter)', module: 'minimart' },
  { value: 'cosmetics', label: 'Cosmetics & Beauty Store (Shades, Volumes 50-500ml)', module: 'minimart' },
  { value: 'pharmacy', label: 'Pharmacy & Medical Store (Strip, Box, Tablets, Syrups)', module: 'minimart' },
  { value: 'electronics', label: 'Mobile, Electronics & Accessories (IMEI, Serial, Warranty)', module: 'minimart' },
  { value: 'bakery', label: 'Bakery & Sweets / Confectionery (KG, Gram, Box, Fresh)', module: 'minimart' },
  { value: 'food', label: 'Fast Food, Cafe & Restaurant (Portions: S, M, L, Family, KDS)', module: 'fastfood' },
  { value: 'hardware', label: 'Hardware, Sanitary & Paint Store (Meters, Feet, KG, Gallon, Tools)', module: 'minimart' },
  { value: 'electric', label: 'Electrical Store & Lighting (Cables, Switches, LED, Breakers)', module: 'minimart' },
  { value: 'standard', label: 'Standard Retail (General Packaged Goods)', module: 'minimart' },
];

function renderProfileIcon(iconName: string, size = 18, color?: string) {
  const props = { size, color, strokeWidth: 2 };
  switch (iconName) {
    case 'Footprints': return <Footprints {...props} />;
    case 'Shirt': return <Shirt {...props} />;
    case 'ShoppingBag': return <ShoppingBag {...props} />;
    case 'Palette': return <Palette {...props} />;
    case 'HeartPulse': return <HeartPulse {...props} />;
    case 'Smartphone': return <Smartphone {...props} />;
    case 'Cake': return <Cake {...props} />;
    case 'Utensils': return <Utensils {...props} />;
    case 'Wrench': return <Wrench {...props} />;
    case 'Zap': return <Zap {...props} />;
    default: return <Package {...props} />;
  }
}

export function CategoriesView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [seedingProfile, setSeedingProfile] = useState<string | null>(null);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);
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

  const handleSeedProfile = async (profileKey: CategoryProfile, targetMod: ModuleKey) => {
    setSeedingProfile(profileKey);
    try {
      const seeded = await posApi.seedBusinessProfile(profileKey, targetMod);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSeedSuccessMessage(`Added ${seeded.length} starter categories for ${CATEGORY_PROFILES[profileKey]?.label || profileKey}!`);
      setTimeout(() => {
        setSeedSuccessMessage(null);
        setIsTemplateDialogOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to seed categories:', err);
    } finally {
      setSeedingProfile(null);
    }
  };

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

  const activeRetailProfile = useMemo(() => {
    const specific = businessProfiles.find((p) => p !== 'standard' && p !== 'food');
    return specific && CATEGORY_PROFILES[specific] ? CATEGORY_PROFILES[specific] : null;
  }, [businessProfiles]);

  const activeRetailLabel = activeRetailProfile?.label || 'Retail Store';
  const activeRetailShort = activeRetailProfile?.shortTag || 'Retail';

  const moduleOptions = useMemo(() => [
    ...(hasFastFood ? [{ value: 'fastfood', label: 'Fast Food Menu' }] : []),
    ...(hasOmnimart ? [{ value: 'minimart', label: activeRetailLabel }] : []),
  ], [hasFastFood, hasOmnimart, activeRetailLabel]);

  const isSingleBusinessProfile = businessProfiles.length === 1;
  const isProfileLocked = isSingleBusinessProfile || filteredProfileOptions.length === 1;

  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // Starter templates strictly filtered to active licensed business profile(s)
  const licensedTemplates = useMemo(() => {
    const all = (Object.entries(CATEGORY_PROFILES) as [CategoryProfile, typeof CATEGORY_PROFILES[CategoryProfile]][])
      .filter(([key]) => key !== 'standard');

    if (showAllTemplates) return all;

    const hasSpecificProfiles = businessProfiles && businessProfiles.length > 0 && !businessProfiles.includes('standard');
    if (hasSpecificProfiles) {
      const filtered = all.filter(([key]) => businessProfiles.includes(key));
      if (filtered.length > 0) return filtered;
    }
    return all;
  }, [businessProfiles, showAllTemplates]);

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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button
            appearance="secondary"
            icon={<Sparkle20Regular style={{ color: '#E51937' }} />}
            onClick={() => setIsTemplateDialogOpen(true)}
            style={{ fontWeight: 600, border: `1px solid ${tokens.colorNeutralStroke1}` }}
          >
            {isSingleBusinessProfile && licensedTemplates.length === 1
              ? `1-Click ${licensedTemplates[0][1].shortTag} Template`
              : '1-Click Industry Templates'}
          </Button>
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            className={styles.primaryBtn}
            onClick={() => handleOpenDialog()}
          >
            + New Category
          </Button>
        </div>
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
              const profileConfig = CATEGORY_PROFILES[activeProfile] || CATEGORY_PROFILES.standard;

              return (
                <div key={cat.id} className={styles.categoryCard}>
                  <div className={styles.categoryCardLeft}>
                    <div
                      className={styles.tagIconBox}
                      style={{
                        backgroundColor: `${profileConfig.accentColor}16`,
                        border: `1px solid ${profileConfig.accentColor}35`,
                        color: profileConfig.accentColor,
                      }}
                    >
                      {renderProfileIcon(profileConfig.icon, 18, profileConfig.accentColor)}
                    </div>
                    <div className={styles.categoryInfo}>
                      <Body1 className={styles.categoryTitle}>{cat.name}</Body1>
                      <div className={styles.categoryMetaRow}>
                        <span
                          className={styles.profileBadge}
                          style={{
                            backgroundColor: `${profileConfig.accentColor}18`,
                            border: `1px solid ${profileConfig.accentColor}40`,
                            color: profileConfig.accentColor,
                          }}
                        >
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
            <span>{activeRetailShort} Categories ({omnimartCategories.length})</span>
            <Button
              size="small"
              appearance="subtle"
              className={styles.sectionAddBtn}
              onClick={() => handleOpenDialog('minimart')}
            >
              + Add {activeRetailShort} Category
            </Button>
          </div>
          <div className={styles.categoryGrid}>
            {omnimartCategories.map((cat) => {
              const count = products.filter((p) => p.category === cat.name).length;
              const activeProfile = detectCategoryProfile(cat.name, cat.profile);
              const profileConfig = CATEGORY_PROFILES[activeProfile] || CATEGORY_PROFILES.standard;

              return (
                <div key={cat.id} className={styles.categoryCard}>
                  <div className={styles.categoryCardLeft}>
                    <div
                      className={styles.tagIconBox}
                      style={{
                        backgroundColor: `${profileConfig.accentColor}16`,
                        border: `1px solid ${profileConfig.accentColor}35`,
                        color: profileConfig.accentColor,
                      }}
                    >
                      {renderProfileIcon(profileConfig.icon, 18, profileConfig.accentColor)}
                    </div>
                    <div className={styles.categoryInfo}>
                      <Body1 className={styles.categoryTitle}>{cat.name}</Body1>
                      <div className={styles.categoryMetaRow}>
                        <span
                          className={styles.profileBadge}
                          style={{
                            backgroundColor: `${profileConfig.accentColor}18`,
                            border: `1px solid ${profileConfig.accentColor}40`,
                            color: profileConfig.accentColor,
                          }}
                        >
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

      {/* ── 1-Click Industry Starter Templates Dialog ────────── */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={(_, data) => setIsTemplateDialogOpen(data.open)}>
        <DialogSurface className={styles.templateDialogSurface}>
          <div className={styles.templateDialogHeader}>
            <div className={styles.templateHeaderLeft}>
              <div className={styles.templateIconBox}>
                <Sparkle20Regular style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <div className={styles.templateDialogTitle}>
                  {licensedTemplates.length === 1 && !showAllTemplates
                    ? `1-Click ${licensedTemplates[0][1].shortTag} Starter Template`
                    : '1-Click Industry Starter Templates'}
                </div>
                <div className={styles.templateDialogSubtitle}>
                  {licensedTemplates.length === 1 && !showAllTemplates
                    ? `Instantly populate recommended default categories, size matrices, and standard units for your licensed vertical (${licensedTemplates[0][1].label}) in 1 click.`
                    : 'Choose your business vertical to instantly populate recommended default categories, size matrices, and standard units in 1 click.'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {businessProfiles && businessProfiles.length > 0 && !businessProfiles.includes('standard') && (
                <button
                  type="button"
                  onClick={() => setShowAllTemplates((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: tokens.colorNeutralForeground2,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {showAllTemplates ? 'Show My License Only' : 'Show All Industries'}
                </button>
              )}
              <Button
                size="small"
                appearance="subtle"
                icon={<Dismiss16Regular />}
                onClick={() => setIsTemplateDialogOpen(false)}
                type="button"
              />
            </div>
          </div>

          {seedSuccessMessage && (
            <div className={styles.successBanner}>
              {seedSuccessMessage}
            </div>
          )}

          <div
            className={styles.templateGrid}
            style={licensedTemplates.length === 1 ? { maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column' } : undefined}
          >
            {licensedTemplates.map(([key, profile]) => {
                const targetMod: ModuleKey = key === 'food' ? 'fastfood' : 'minimart';
                const isModuleEnabled = (targetMod === 'fastfood' && hasFastFood) || (targetMod === 'minimart' && hasOmnimart);
                const isCurrentSeeding = seedingProfile === key;

                return (
                  <div
                    key={key}
                    className={styles.templateCard}
                    style={{
                      borderTop: `3px solid ${profile.accentColor}`,
                      opacity: isModuleEnabled ? 1 : 0.6,
                    }}
                  >
                    <div className={styles.templateCardTop}>
                      <div
                        className={styles.templateCardIcon}
                        style={{
                          backgroundColor: `${profile.accentColor}18`,
                          border: `1px solid ${profile.accentColor}35`,
                          color: profile.accentColor,
                        }}
                      >
                        {renderProfileIcon(profile.icon, 20, profile.accentColor)}
                      </div>
                      <div className={styles.templateCardMeta}>
                        <div className={styles.templateCardTitleRow}>
                          <span className={styles.templateCardTitle}>{profile.label}</span>
                        </div>
                      </div>
                    </div>

                    <p className={styles.templateCardDesc}>{profile.description}</p>

                    <div className={styles.templateSpecsRow}>
                      <span className={styles.specLabel}>Units:</span>
                      <span className={styles.specValue}>{profile.suggestedUnits.slice(0, 3).join(', ')}</span>
                      {profile.suggestedSizes.length > 0 && (
                        <>
                          <span className={styles.specDivider}>•</span>
                          <span className={styles.specLabel}>Sizes:</span>
                          <span className={styles.specValue}>
                            {profile.suggestedSizes.slice(0, 3).join(', ')}...
                          </span>
                        </>
                      )}
                    </div>

                    <div className={styles.chipsContainer}>
                      <div className={styles.chipsTitle}>Categories Preview:</div>
                      <div className={styles.chipsWrapper}>
                        {profile.defaultCategories.map((cName) => (
                          <span key={cName} className={styles.previewChip}>
                            {cName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.templateCardFooter}>
                      <Button
                        size="small"
                        appearance="primary"
                        disabled={!isModuleEnabled || seedingProfile !== null}
                        onClick={() => handleSeedProfile(key, targetMod)}
                        style={{
                          backgroundColor: isModuleEnabled ? profile.accentColor : tokens.colorNeutralBackgroundDisabled,
                          color: '#ffffff',
                          fontWeight: 700,
                          borderRadius: '8px',
                          width: '100%',
                        }}
                      >
                        {isCurrentSeeding
                          ? 'Adding Categories...'
                          : !isModuleEnabled
                          ? `Disabled (${targetMod === 'fastfood' ? 'Food' : 'Mart'} module off)`
                          : `Populate ${profile.shortTag} Template`}
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogSurface>
      </Dialog>

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
                    Configure classification &amp; presets for {targetModule === 'fastfood' ? 'Fast Food Menu' : activeRetailLabel}
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
                    placeholder="e.g. Boots, Joggers, Slippers, Casual, Formal..."
                    error={categoryForm.formState.errors.name?.message}
                  />
                )}
              />

              {!isSingleBusinessProfile && moduleOptions.length > 1 && (
                <Controller
                  control={categoryForm.control}
                  name="module"
                  render={({ field }) => (
                    <CustomSelect
                      label="Target Store Module"
                      required
                      value={field.value}
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
                  )}
                />
              )}

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
                      <LockClosed16Regular style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle' }} /> Auto-selected & locked to your license business profile ({CATEGORY_PROFILES[categoryForm.watch('profile') || filteredProfileOptions[0]?.value || 'standard']?.shortTag})
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
