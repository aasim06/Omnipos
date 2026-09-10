import React, { useState, useRef, useEffect } from 'react';
import { makeStyles, tokens, mergeClasses } from '@fluentui/react-components';
import { Food24Filled, BuildingRetail24Regular } from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product } from '@shared/types';
import { CustomInput } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

export interface ProductAutocompleteProps {
  id?: string;
  value?: string;
  onChange: (value: string, product?: Product) => void;
  onSelectProduct?: (product: Product) => void;
  clearOnSelect?: boolean;
  filterModule?: 'fastfood' | 'minimart' | 'all';
  filterCategory?: string;
  filterCategories?: string[];
  placeholder?: string;
  required?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  labelBg?: string;
}

const useStyles = makeStyles({
  container: {
    position: 'relative',
    width: '100%',
  },
  countBadge: {
    fontSize: '10.5px',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
    marginRight: '6px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 2500,
    marginTop: '4px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderRadius: '10px',
    boxShadow: tokens.shadow16,
    maxHeight: '220px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '6px',
  },
  dropdownHeader: {
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  noItems: {
    padding: '12px 10px',
    textAlign: 'center',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '7px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '0.12s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  thumb: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbIconBrand: {
    width: '16px',
    height: '16px',
    color: tokens.colorBrandForeground1,
  },
  thumbIconNeutral: {
    width: '16px',
    height: '16px',
    color: tokens.colorNeutralForeground2,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: '13px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
    flexWrap: 'wrap',
  },
  skuBadge: {
    fontFamily: 'monospace',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '10.5px',
  },
  variantBadge: {
    fontSize: '10.5px',
    fontWeight: 700,
  },
  priceText: {
    fontSize: '12px',
    fontWeight: 700,
    color: tokens.colorBrandForeground1,
  },
});

export function ProductAutocomplete({
  id = 'product-autocomplete',
  value: controlledValue,
  onChange,
  onSelectProduct,
  clearOnSelect = false,
  filterModule = 'all',
  filterCategory,
  filterCategories,
  placeholder = 'Search by product name, SKU or barcode...',
  required = false,
  label,
  error,
  disabled = false,
  style,
  labelBg,
}: ProductAutocompleteProps): React.JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(controlledValue ?? '');

  // Synchronize internal value when controlled value changes externally
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const displayValue = controlledValue !== undefined ? controlledValue : internalValue;

  // Fetch products Cache-First (<5ms)
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    staleTime: 1000 * 60 * 5,
  });

  const isCategoryFiltered = !!filterCategory;
  const isMultipleCategoryFiltered = !!filterCategories && filterCategories.length > 0;
  const isAnyCategoryFiltered = isCategoryFiltered || isMultipleCategoryFiltered;

  // Filter products by Module and Category if specified
  const filteredByModule = allProducts.filter((p) => {
    if (isCategoryFiltered) {
      if ((p.category || '').toLowerCase() !== filterCategory!.toLowerCase()) {
        return false;
      }
    } else if (isMultipleCategoryFiltered) {
      const pCat = (p.category || '').toLowerCase();
      if (!filterCategories!.some((c) => c.toLowerCase() === pCat)) {
        return false;
      }
    }
    if (filterModule === 'all') return true;
    if (filterModule === 'fastfood') {
      return (
        p.module === 'fastfood' ||
        p.itemRole === 'raw_ingredient' ||
        p.itemRole === 'food_menu' ||
        ['Burger', 'Pizza', 'Sides', 'Beverages', 'Fast Food', 'Snacks', 'Food', 'Kitchen', 'Raw Materials'].includes(p.category)
      );
    }
    if (filterModule === 'minimart') {
      return p.module === 'minimart' || p.itemRole === 'retail_product';
    }
    return true;
  });

  // When filtering by a category or category group, show strictly those items (even if 0)
  const availableProducts = isAnyCategoryFiltered
    ? filteredByModule
    : (filteredByModule.length > 0 ? filteredByModule : allProducts);

  // Filter suggestions by search query (name, SKU barcode, category, variant barcode)
  const query = (displayValue || '').toLowerCase().trim();
  const suggestions = availableProducts.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      (p.skuCode && p.skuCode.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.id && p.id.toLowerCase().includes(query)) ||
      (p.variants &&
        p.variants.some(
          (v) =>
            (v.skuCode && v.skuCode.toLowerCase().includes(query)) ||
            ((v as any).barcode && (v as any).barcode.toLowerCase().includes(query)) ||
            (v.label && v.label.toLowerCase().includes(query))
        ))
    );
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (prod: Product) => {
    if (clearOnSelect) {
      setInternalValue('');
      onChange?.('', prod);
    } else {
      setInternalValue(prod.name);
      onChange?.(prod.name, prod);
    }
    if (onSelectProduct) {
      onSelectProduct(prod);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={styles.container} style={style}>
      <CustomInput
        id={id}
        label={label}
        labelBg={labelBg}
        required={required}
        value={displayValue}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          const val = e.target.value;
          setInternalValue(val);
          onChange?.(val);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const rawTerm = (displayValue || '').trim().toLowerCase();
            if (suggestions.length > 0) {
              handleSelect(suggestions[0]);
            } else if (rawTerm) {
              // Direct barcode / SKU fallback lookup across all products
              const match = allProducts.find(
                (p) =>
                  (p.barcode && p.barcode.toLowerCase() === rawTerm) ||
                  (p.skuCode && p.skuCode.toLowerCase() === rawTerm) ||
                  (p.id && p.id.toLowerCase() === rawTerm) ||
                  `sku-${p.id.slice(-6)}`.toLowerCase() === rawTerm ||
                  (p.variants &&
                    p.variants.some(
                      (v) =>
                        (v.skuCode && v.skuCode.toLowerCase() === rawTerm) ||
                        ((v as any).barcode && (v as any).barcode.toLowerCase() === rawTerm)
                    )) ||
                  p.name.toLowerCase() === rawTerm ||
                  p.name.toLowerCase().includes(rawTerm)
              );
              if (match) {
                handleSelect(match);
              }
            }
          }
        }}
        error={error}
        rightElement={
          availableProducts.length > 0 ? (
            <span className={styles.countBadge}>
              {availableProducts.length} items
            </span>
          ) : undefined
        }
      />

      {/* Floating Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            Catalog Quick Select ({suggestions.length} items)
          </div>

          {suggestions.length === 0 ? (
            <div className={styles.noItems}>
              {isCategoryFiltered ? (
                <div style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, marginBottom: '4px' }}>
                    No products found in &quot;{filterCategory}&quot;
                  </div>
                  <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, marginBottom: '10px' }}>
                    Is category mein abhi tak koi item create nahi kiya gaya.
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate(
                        `/catalog/new?category=${encodeURIComponent(filterCategory!)}&module=${filterModule || 'minimart'}&returnUrl=/inventory/stock-in`
                      );
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 14px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#ffffff',
                      backgroundColor: '#E51937',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    + Add New Product in &quot;{filterCategory}&quot;
                  </button>
                </div>
              ) : (
                `No items match "${value}". Custom name will be used.`
              )}
            </div>
          ) : (
            suggestions.slice(0, 20).map((prod) => {
              const matchedVariant = query && prod.variants
                ? prod.variants.find(
                    (v) =>
                      (v.skuCode && v.skuCode.toLowerCase().includes(query)) ||
                      (v.label && v.label.toLowerCase().includes(query))
                  )
                : null;

              return (
                <div
                  key={prod.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(prod);
                  }}
                  className={styles.itemRow}
                >
                  {/* Thumbnail Preview */}
                  <div className={styles.thumb}>
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className={styles.thumbImg} />
                    ) : prod.module === 'fastfood' ? (
                      <Food24Filled className={styles.thumbIconBrand} />
                    ) : (
                      <BuildingRetail24Regular className={styles.thumbIconNeutral} />
                    )}
                  </div>

                  {/* Name & Category / SKU */}
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>
                      {prod.name}
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{prod.category || 'Product'}</span>
                      {prod.skuCode && (
                        <span className={styles.skuBadge}>
                          SKU: {prod.skuCode}
                        </span>
                      )}
                      {matchedVariant && (
                        <span className={styles.variantBadge}>
                          Variant: {matchedVariant.label} {matchedVariant.skuCode ? `(${matchedVariant.skuCode})` : ''}
                        </span>
                      )}
                      {prod.openingStock !== undefined && (
                        <span>• {prod.openingStock} in stock</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className={styles.priceText}>
                    PKR {(matchedVariant && matchedVariant.price !== undefined ? matchedVariant.price : prod.price).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
