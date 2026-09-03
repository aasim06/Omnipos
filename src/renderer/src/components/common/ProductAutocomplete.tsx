import React, { useState, useRef, useEffect } from 'react';
import {
  tokens,
  Input,
  Label,
  Caption1,
} from '@fluentui/react-components';
import { Food24Filled, BuildingRetail24Regular } from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product } from '@shared/types';

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
}

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
}: ProductAutocompleteProps): React.JSX.Element {
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
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', ...style }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label required={required} htmlFor={id} style={{ fontWeight: 600 }}>
            {label}
          </Label>
          <Caption1 style={{ color: tokens.colorBrandForeground1, fontSize: '11px', fontWeight: 600 }}>
            {availableProducts.length} items available
          </Caption1>
        </div>
      )}

      <Input
        id={id}
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
        style={{ width: '100%' }}
      />

      {error && (
        <span style={{ color: tokens.colorPaletteRedForeground1, fontSize: '12px', fontWeight: 500 }}>
          {error}
        </span>
      )}

      {/* Floating Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 2500,
            marginTop: '4px',
            backgroundColor: tokens.colorNeutralBackground1,
            borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
            borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
            borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
            borderRadius: '10px',
            boxShadow: tokens.shadow16,
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '6px',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Catalog Quick Select ({suggestions.length} items)
          </div>

          {suggestions.length === 0 ? (
            <div style={{ padding: '12px 10px', textAlign: 'center', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground3)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Thumbnail Preview */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: tokens.colorNeutralBackground2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${tokens.colorNeutralStroke2}`,
                    }}
                  >
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : prod.module === 'fastfood' ? (
                      <Food24Filled style={{ width: 16, height: 16, color: tokens.colorBrandForeground1 }} />
                    ) : (
                      <BuildingRetail24Regular style={{ width: 16, height: 16, color: tokens.colorNeutralForeground2 }} />
                    )}
                  </div>

                  {/* Name & Category / SKU */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: tokens.colorNeutralForeground1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span>{prod.category || 'Product'}</span>
                      {prod.skuCode && (
                        <span style={{ fontFamily: 'monospace', backgroundColor: tokens.colorNeutralBackground3, padding: '1px 5px', borderRadius: '4px', fontSize: '10.5px' }}>
                          SKU: {prod.skuCode}
                        </span>
                      )}
                      {matchedVariant && (
                        <span style={{ backgroundColor: 'rgba(229, 25, 55, 0.12)', color: '#E51937', padding: '1px 5px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                          Variant: {matchedVariant.label} {matchedVariant.skuCode ? `(${matchedVariant.skuCode})` : ''}
                        </span>
                      )}
                      {prod.openingStock !== undefined && (
                        <span>• {prod.openingStock} in stock</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: '12px', fontWeight: 700, color: tokens.colorBrandForeground1 }}>
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
