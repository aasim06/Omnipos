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
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Category, Product, ModuleKey } from '@shared/types';
import { uid } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '14px',
  },
  categoryCard: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    ':hover': {
      boxShadow: tokens.shadow8,
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
        name: data.name,
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
    categoryForm.reset({ name: '', module });
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
            return (
              <div key={cat.id} className={styles.categoryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, fontSize: '14px' }}>
                    {cat.name}
                  </Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                    Fast Food • {count} product{count !== 1 ? 's' : ''}
                  </Caption1>
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
            return (
              <div key={cat.id} className={styles.categoryCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, fontSize: '14px' }}>
                    {cat.name}
                  </Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                    Omnimart • {count} product{count !== 1 ? 's' : ''}
                  </Caption1>
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
        <DialogSurface style={{ maxWidth: '440px', width: '92vw', borderRadius: '12px', padding: '24px' }}>
          <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)}>
            <DialogBody style={{ padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <DialogTitle style={{ fontSize: '17px', fontWeight: 800, color: tokens.colorNeutralForeground1, margin: 0 }}>
                  Create New Category
                </DialogTitle>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Dismiss16Regular />}
                  onClick={() => setIsDialogOpen(false)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Category Name</Label>
                  <Controller
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        {...field}
                        appearance="outline"
                        placeholder="e.g. Burgers, Dairy, Snacks..."
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
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Target Store Module</Label>
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
              </div>

              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                  style={{ backgroundColor: '#E51937', borderRadius: '8px', fontWeight: 600 }}
                >
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
