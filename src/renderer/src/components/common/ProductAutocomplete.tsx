import React, { useState, useRef, useEffect } from 'react';
import { makeStyles, tokens, mergeClasses } from '@fluentui/react-components';
import { Food24Filled, BuildingRetail24Regular } from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product } from '@shared/types';
import { CustomInput } from '@/components/ui';

export interface ProductAutocompleteProps {
  id?: string;
  value?: string;
  onChange: (value: string, product?: Product) => void;
  onSelectProduct?: (product: Product) => void;
  filterModule?: 'fastfood' | 'minimart' | 'all';
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
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    color: '#E51937',
    padding: '1px 5px',
    borderRadius: '4px',
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
  value = '',
  onChange,
  onSelectProduct,
  filterModule = 'all',
  placeholder = 'Search by product name, SKU or barcode...',
  required = false,
  label,
  error,
  disabled = false,
  style,
  labelBg,
}: ProductAutocompleteProps): React.JSX.Element {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Products via shared query cache
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    staleTime: 60000,
  });

  // Filter by module if requested
  const filteredByModule = allProducts.filter((p) => {
    if (filterModule === 'all') return true;
    if (filterModule === 'fastfood') {
      return (
        p.module === 'fastfood' ||
        ['Burger', 'Pizza', 'Sides', 'Beverages', 'Fast Food', 'Snacks', 'Food', 'Kitchen'].includes(p.category)
      );
    }
    if (filterModule === 'minimart') {
      return p.module === 'minimart';
    }
    return true;
  });

  const availableProducts = filteredByModule.length > 0 ? filteredByModule : allProducts;

  // Filter suggestions by search query (name, SKU barcode, category, variant barcode)
  const query = (value || '').toLowerCase().trim();
  const suggestions = availableProducts.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      (p.skuCode && p.skuCode.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.id && p.id.toLowerCase().includes(query)) ||
      (p.variants &&
        p.variants.some(
          (v) =>
            (v.skuCode && v.skuCode.toLowerCase().includes(query)) ||
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
    onChange(prod.name, prod);
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
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0) {
              handleSelect(suggestions[0]);
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
              No items match &quot;{value}&quot;. Custom name will be used.
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
