import React, { useState, useMemo, useEffect } from 'react';
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
  Camera,
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
    'cctv',
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
  catFormHintRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px',
  },
  catFormHintText: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  catFormToggleBtn: {
    backgroundColor: 'transparent',
    borderTopStyle: 'none', borderBottomStyle: 'none',
    borderLeftStyle: 'none', borderRightStyle: 'none',
    color: '#E51937',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  presetInfoBox: {
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  presetChipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    flexWrap: 'wrap',
  },
  presetChipLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
  },
  presetUnitChip: {
    fontSize: '10.5px',
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: '4px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    color: tokens.colorNeutralForeground1,
  },
});

interface ProfileOption {
  value: CategoryProfile;
  label: string;
  module: ModuleKey;
}

const ALL_PROFILE_OPTIONS: ProfileOption[] = [
  { value: 'standard', label: 'Standard Retail (General Packaged Goods)', module: 'minimart' },
  { value: 'cctv', label: 'CCTV, Security & Surveillance (DVR, NVR, Cameras, Channels)', module: 'minimart' },
  { value: 'grocery', label: 'Grocery, Supermarket & Mini Mart (Barcode, KG, Gram, Liter)', module: 'minimart' },
  { value: 'apparel', label: 'Garments, Clothing & Boutique (XS-3XL, SUIT, METER, GAZ)', module: 'minimart' },
  { value: 'footwear', label: 'Footwear & Shoes Store (Sizes 38-45, PAIR)', module: 'minimart' },
  { value: 'cosmetics', label: 'Cosmetics & Beauty Store (Shades, Volumes 50-500ml)', module: 'minimart' },
  { value: 'pharmacy', label: 'Pharmacy & Medical Store (Strip, Box, Tablets, Syrups)', module: 'minimart' },
  { value: 'electronics', label: 'Mobile, Electronics & Accessories (IMEI, Serial, Warranty)', module: 'minimart' },
  { value: 'bakery', label: 'Bakery & Sweets / Confectionery (KG, Gram, Box, Fresh)', module: 'minimart' },
  { value: 'hardware', label: 'Hardware, Sanitary & Paint Store (Meters, Feet, KG, Gallon, Tools)', module: 'minimart' },
  { value: 'electric', label: 'Electrical Store & Lighting (Cables, Switches, LED, Breakers)', module: 'minimart' },
  { value: 'food', label: 'Fast Food, Cafe & Restaurant (Portions: S, M, L, Family, KDS)', module: 'fastfood' },
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
    case 'Camera': return <Camera {...props} />;
    default: return <Package {...props} />;
  }
}

export function CategoriesView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { can, businessProfiles = ['standard', 'food'] } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomName, setIsCustomName] = useState(false);
  const [targetModule, setTargetModule] = useState<ModuleKey>(hasFastFood ? 'fastfood' : 'minimart');

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
      module: hasFastFood ? 'fastfood' : 'minimart',
      profile: hasFastFood ? 'food' : 'standard',
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const pConfig = CATEGORY_PROFILES[data.profile] || CATEGORY_PROFILES.standard;
      const newCat: Category = {
        id: uid('cat_'),
        module: data.module,
        name: data.name.trim(),
        profile: data.profile,
        suggestedSizes: pConfig.suggestedSizes,
        suggestedUnits: pConfig.suggestedUnits,
      };
      return await posApi.saveCategory(newCat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      categoryForm.reset();
      setIsCustomName(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const watchedCategoryModule = categoryForm.watch('module') || targetModule;

  // Profile options matching the current store module (fastfood vs minimart)
  const filteredProfileOptions = React.useMemo<ProfileOption[]>(() => {
    return ALL_PROFILE_OPTIONS.filter((opt: ProfileOption) => opt.module === watchedCategoryModule);
  }, [watchedCategoryModule]);

  const watchedCategoryProfile = categoryForm.watch('profile') || (watchedCategoryModule === 'fastfood' ? 'food' : 'standard');
  const currentProfileConfig = CATEGORY_PROFILES[watchedCategoryProfile as CategoryProfile] || CATEGORY_PROFILES.standard;

  // Target Store Module options - strictly Food and Mart only
  const moduleOptions = React.useMemo(() => {
    const opts = [
      ...(hasFastFood ? [{ value: 'fastfood', label: 'Food' }] : []),
      ...(hasOmnimart ? [{ value: 'minimart', label: 'Mart' }] : []),
    ];
    return opts.length > 0 ? opts : [
      { value: 'fastfood', label: 'Food' },
      { value: 'minimart', label: 'Mart' },
    ];
  }, [hasFastFood, hasOmnimart]);

  const existingCategoryNames = React.useMemo(() => {
    return new Set(categories.filter((c) => c.module === watchedCategoryModule).map((c) => c.name.toLowerCase().trim()));
  }, [categories, watchedCategoryModule]);

  const { data: defaultTemplates = [] } = useQuery({
    queryKey: ['default-category-templates', watchedCategoryProfile, watchedCategoryModule],
    queryFn: () => posApi.fetchDefaultCategories(watchedCategoryProfile, watchedCategoryModule),
  });

  const defaultCategoryOptions = React.useMemo(() => {
    const list = defaultTemplates.length > 0
      ? defaultTemplates.map((t) => t.name)
      : (CATEGORY_PROFILES[watchedCategoryProfile as CategoryProfile]?.defaultCategories || []);

    return list.map((catName) => {
      const isAlreadyAdded = existingCategoryNames.has(catName.toLowerCase().trim());
      return {
        value: catName,
        label: isAlreadyAdded ? `${catName} (Already Added)` : catName,
        disabled: isAlreadyAdded,
      };
    });
  }, [defaultTemplates, watchedCategoryProfile, existingCategoryNames]);

  const handleOpenDialog = (module?: ModuleKey) => {
    const selectedModule: ModuleKey = module || (hasFastFood ? 'fastfood' : 'minimart');
    const selectedProfile: CategoryProfile = selectedModule === 'fastfood' ? 'food' : 'standard';

    setTargetModule(selectedModule);
    setIsCustomName(false);

    const config = CATEGORY_PROFILES[selectedProfile] || CATEGORY_PROFILES.standard;
    const catList = config.defaultCategories || [];
    const existingInMod = new Set(categories.filter((c) => c.module === selectedModule).map((c) => c.name.toLowerCase().trim()));
    const firstAvailable = catList.find((name) => !existingInMod.has(name.toLowerCase().trim())) || catList[0] || '';

    categoryForm.reset({
      name: firstAvailable,
      module: selectedModule,
      profile: selectedProfile,
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (isDialogOpen && defaultCategoryOptions.length > 0 && !isCustomName) {
      const currentName = categoryForm.getValues('name');
      const currentOpt = defaultCategoryOptions.find((opt) => opt.value === currentName);
      if (!currentOpt || currentOpt.disabled) {
        const firstAvail = defaultCategoryOptions.find((opt) => !opt.disabled)?.value || defaultCategoryOptions[0].value;
        categoryForm.setValue('name', firstAvail);
      }
    }
  }, [isDialogOpen, defaultCategoryOptions, categoryForm, isCustomName]);

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

        <div>
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
            <span>Mart Categories ({omnimartCategories.length})</span>
            <Button
              size="small"
              appearance="subtle"
              className={styles.sectionAddBtn}
              onClick={() => handleOpenDialog('minimart')}
            >
              + Add Mart Category
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
                    Configure classification &amp; presets for {targetModule === 'fastfood' ? 'Food' : 'Mart'}
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
              {/* 1. Target Store Module */}
              <Controller
                control={categoryForm.control}
                name="module"
                render={({ field }) => (
                  <CustomSelect
                    label="Target Store Module"
                    required
                    value={field.value}
                    options={moduleOptions}
                    onChange={(val) => {
                      const newMod = val as ModuleKey;
                      field.onChange(newMod);
                      setTargetModule(newMod);
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
                      value={field.value || (watchedCategoryModule === 'fastfood' ? 'food' : 'standard')}
                      onChange={(val) => {
                        const newProf = val as CategoryProfile;
                        field.onChange(newProf);
                        if (!isCustomName) {
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
                      options={filteredProfileOptions.map((opt) => ({
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
                    {isCustomName ? 'Type any custom category name' : 'Choose preset category or type custom'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomName(!isCustomName);
                      if (!isCustomName) {
                        categoryForm.setValue('name', '');
                      } else {
                        categoryForm.setValue('name', defaultCategoryOptions[0]?.value || '');
                      }
                    }}
                    className={styles.catFormToggleBtn}
                  >
                    {isCustomName ? '← Choose from Presets' : '+ Custom Name'}
                  </button>
                </div>
                {isCustomName ? (
                  <Controller
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <CustomInput
                        label="Category Name"
                        required
                        autoFocus
                        placeholder="e.g. Formal Shoes, Burgers..."
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
                        onChange={(val) => field.onChange(val)}
                        options={defaultCategoryOptions}
                        error={categoryForm.formState.errors.name?.message}
                      />
                    )}
                  />
                )}
              </div>

              {/* 4. Sab Se Neechay: Preset Units & Sizes preview */}
              {currentProfileConfig && (
                <div className={styles.presetInfoBox}>
                  {currentProfileConfig.suggestedUnits && currentProfileConfig.suggestedUnits.length > 0 && (
                    <div className={styles.presetChipRow}>
                      <span className={styles.presetChipLabel}>Preset Units:</span>
                      {currentProfileConfig.suggestedUnits.map((unit) => (
                        <span
                          key={unit}
                          className={styles.presetUnitChip}
                        >
                          {unit}
                        </span>
                      ))}
                    </div>
                  )}

                  {currentProfileConfig.suggestedSizes && currentProfileConfig.suggestedSizes.length > 0 && (
                    <div className={styles.presetChipRow}>
                      <span className={styles.presetChipLabel}>Preset Sizes:</span>
                      {currentProfileConfig.suggestedSizes.map((size) => (
                        <span
                          key={size}
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: `${currentProfileConfig.accentColor}18`,
                            border: `1px solid ${currentProfileConfig.accentColor}40`,
                            color: currentProfileConfig.accentColor,
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
