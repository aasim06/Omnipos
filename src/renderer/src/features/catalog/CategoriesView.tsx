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
import {
  CATEGORY_PROFILES,
  detectCategoryProfile,
  getFilteredProfileOptions,
  type ProfileOption,
} from '@/lib/categoryProfiles';
import { CustomInput, CustomSelect } from '@/components/ui';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { useAppToast, useConfirmDialog } from '../../context/AppNotificationContext';

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

import {
  useCategoriesStyles,
  getAccentIconStyle,
  getAccentBadgeStyle,
} from './categories.styles';

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
  const styles = useCategoriesStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useAppToast();
  const confirmModal = useConfirmDialog();
  const { can, businessProfiles = ['standard', 'food'], refreshModules } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  useEffect(() => {
    void refreshModules();
  }, [refreshModules]);

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      }
      setIsDialogOpen(false);
      categoryForm.reset();
      setIsCustomName(false);
      notifySuccess('Category created successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to create category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      }
      notifySuccess('Category deleted successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to delete category');
    },
  });

  const watchedCategoryModule = categoryForm.watch('module') || targetModule;

  // Profile options matching the current store module (fastfood vs minimart) filtered by active businessProfiles from license
  const filteredProfileOptions = React.useMemo<ProfileOption[]>(() => {
    return getFilteredProfileOptions(watchedCategoryModule, businessProfiles);
  }, [watchedCategoryModule, businessProfiles]);

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
    const available = getFilteredProfileOptions(selectedModule, businessProfiles);
    const selectedProfile: CategoryProfile =
      available[0]?.value || (selectedModule === 'fastfood' ? 'food' : 'standard');

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
                      style={getAccentIconStyle(profileConfig.accentColor)}
                    >
                      {renderProfileIcon(profileConfig.icon, 18, profileConfig.accentColor)}
                    </div>
                    <div className={styles.categoryInfo}>
                      <Body1 className={styles.categoryTitle}>{cat.name}</Body1>
                      <div className={styles.categoryMetaRow}>
                        <span
                          className={styles.profileBadge}
                          style={getAccentBadgeStyle(profileConfig.accentColor)}
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
                    onClick={async () => {
                      const ok = await confirmModal({
                        title: 'Delete Category',
                        message: `Delete category "${cat.name}"? Products in this category will remain.`,
                        confirmLabel: 'Delete Category',
                        intent: 'danger',
                      });
                      if (ok) {
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
                      style={getAccentIconStyle(profileConfig.accentColor)}
                    >
                      {renderProfileIcon(profileConfig.icon, 18, profileConfig.accentColor)}
                    </div>
                    <div className={styles.categoryInfo}>
                      <Body1 className={styles.categoryTitle}>{cat.name}</Body1>
                      <div className={styles.categoryMetaRow}>
                        <span
                          className={styles.profileBadge}
                          style={getAccentBadgeStyle(profileConfig.accentColor)}
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
                    onClick={async () => {
                      const ok = await confirmModal({
                        title: 'Delete Category',
                        message: `Delete category "${cat.name}"? Products in this category will remain.`,
                        confirmLabel: 'Delete Category',
                        intent: 'danger',
                      });
                      if (ok) {
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
                      const available = getFilteredProfileOptions(newMod, businessProfiles);
                      const defaultProf = available[0]?.value || (newMod === 'fastfood' ? 'food' : 'standard');
                      categoryForm.setValue('profile', defaultProf);
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
                      value={
                        filteredProfileOptions.some((opt) => opt.value === field.value)
                          ? field.value
                          : (filteredProfileOptions[0]?.value || (watchedCategoryModule === 'fastfood' ? 'food' : 'standard'))
                      }
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
                        <span key={size} className={styles.presetUnitChip}>
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
