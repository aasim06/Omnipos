import React, { useState } from 'react';
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
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Delete20Regular,
  Food24Regular,
  BuildingRetail24Regular,
  Dismiss16Regular,
  Grid20Regular,
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
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
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
});

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

  const handleOpenDialog = (module: ModuleKey = 'fastfood') => {
    setTargetModule(module);
    categoryForm.reset({
      name: '',
      module,
      profile: module === 'fastfood' ? 'food' : 'standard',
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
          <Subtitle1
            as="h1"
            style={{ fontWeight: 800, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Store Categories Manager
          </Subtitle1>
          <Caption1
            as="p"
            style={{ color: tokens.colorNeutralForeground2, margin: 0, display: 'block', fontSize: '13px', marginTop: '2px' }}
          >
            Configure and organize category classifications across Fast Food and Omnimart supermarket
          </Caption1>
        </div>

        <Button
          appearance="primary"
          icon={<Add20Regular />}
          style={{ backgroundColor: '#E51937', borderRadius: tokens.borderRadiusMedium, fontWeight: 600 }}
          onClick={() => handleOpenDialog('fastfood')}
        >
          + New Category
        </Button>
      </div>

      {/* ── Fast Food Categories Section ──────────────────────── */}
      <div>
        <div className={styles.sectionTitle}>
          <Food24Regular style={{ color: '#E51937', width: 20, height: 20 }} />
          <span>Fast Food Categories ({fastFoodCategories.length})</span>
          <Button
            size="small"
            appearance="subtle"
            style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#E51937' }}
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
            return (
              <div key={cat.id} className={styles.categoryCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: `${profileConfig.accentColor}18`,
                      border: `1px solid ${profileConfig.accentColor}33`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: profileConfig.accentColor,
                      flexShrink: 0,
                    }}
                  >
                    <Tag20Regular style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, fontSize: '14.5px' }}>
                      {cat.name}
                    </Body1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${profileConfig.accentColor}18`,
                          color: profileConfig.accentColor,
                          border: `1px solid ${profileConfig.accentColor}33`,
                        }}
                      >
                        {profileConfig.shortTag}
                      </span>
                      <Caption1 style={{ color: tokens.colorNeutralForeground2, fontSize: '11.5px' }}>
                        • {count} product{count !== 1 ? 's' : ''}
                      </Caption1>
                    </div>
                  </div>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Delete20Regular style={{ color: '#D13438' }} />}
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

      {/* ── Omnimart Supermarket Categories Section ──────────── */}
      <div style={{ marginTop: '10px' }}>
        <div className={styles.sectionTitle}>
          <BuildingRetail24Regular style={{ color: '#E51937', width: 20, height: 20 }} />
          <span>Omnimart Categories ({omnimartCategories.length})</span>
          <Button
            size="small"
            appearance="subtle"
            style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#E51937' }}
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
            return (
              <div key={cat.id} className={styles.categoryCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: `${profileConfig.accentColor}18`,
                      border: `1px solid ${profileConfig.accentColor}33`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: profileConfig.accentColor,
                      flexShrink: 0,
                    }}
                  >
                    <Tag20Regular style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, fontSize: '14.5px' }}>
                      {cat.name}
                    </Body1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${profileConfig.accentColor}18`,
                          color: profileConfig.accentColor,
                          border: `1px solid ${profileConfig.accentColor}33`,
                        }}
                      >
                        {profileConfig.shortTag}
                      </span>
                      <Caption1 style={{ color: tokens.colorNeutralForeground2, fontSize: '11.5px' }}>
                        • {count} product{count !== 1 ? 's' : ''}
                      </Caption1>
                    </div>
                  </div>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Delete20Regular style={{ color: '#D13438' }} />}
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

      {/* ── Create Category Dialog ─────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface
          style={{
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
          }}
        >
          <form
            onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
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

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
              <div>
                <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>
                  Category Name
                </Label>
                <Controller
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      {...field}
                      appearance="outline"
                      placeholder="e.g. Burgers, Dairy, Snacks, Clothing, Hardware..."
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
                <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>
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
                      <option value="fastfood">Fast Food Menu</option>
                      <option value="minimart">Omnimart Goods</option>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>
                  Industry Profile (Size &amp; Unit Presets)
                </Label>
                <Controller
                  control={categoryForm.control}
                  name="profile"
                  render={({ field }) => (
                    <Select
                      appearance="outline"
                      style={{ width: '100%' }}
                      value={field.value || 'standard'}
                      onChange={(_, d) => field.onChange(d.value as CategoryProfile)}
                    >
                      <option value="standard">Standard Retail (Grocery &amp; General Goods)</option>
                      <option value="apparel">Apparel &amp; Clothing (Sizes: XS, S, M, L, XL, XXL, 3XL)</option>
                      <option value="footwear">Footwear &amp; Shoes (Sizes: 38 to 45)</option>
                      <option value="hardware">Hardware, Iron &amp; Paint (KG, Feet, Meters, Litres, Bags)</option>
                      <option value="food">Restaurant &amp; Fast Food (Portions: Regular, S, M, L, Family)</option>
                    </Select>
                  )}
                />
                <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '5px', display: 'block', fontSize: '11px', lineHeight: 1.4 }}>
                  Auto-enables size matrices, measurement units, and decimal quantities when creating products.
                </Caption1>
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
                onClick={() => setIsDialogOpen(false)}
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
