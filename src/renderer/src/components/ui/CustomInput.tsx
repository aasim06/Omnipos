import React, { useState } from 'react';
import { useAppTheme } from '@/theme/AppProviders';

export interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onClear?: () => void;
  containerStyle?: React.CSSProperties;
  labelBg?: string;
}

export const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      label,
      error,
      icon,
      leftIcon,
      rightElement,
      onClear,
      containerStyle,
      labelBg,
      className = '',
      style,
      disabled,
      required,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const { mode } = useAppTheme();
    const isDark = mode === 'dark';
    const [isFocused, setIsFocused] = useState(false);
    const activeIcon = icon || leftIcon;

    const borderColor = error
      ? '#E51937'
      : isFocused
      ? '#E51937'
      : isDark
      ? '#444444'
      : '#D1D5DB';

    const labelColor = error
      ? '#E51937'
      : isFocused
      ? '#E51937'
      : isDark
      ? '#A3A3A3'
      : '#6B7280';

    const bgCard = isDark ? '#242424' : '#FFFFFF';
    const finalLabelBg = labelBg || bgCard;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', ...containerStyle }} className={className}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            minHeight: '38px',
            borderRadius: '4px',
            border: `1px solid ${borderColor}`,
            backgroundColor: bgCard,
            padding: '4px 10px',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        >
          {label && (
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                left: '10px',
                backgroundColor: finalLabelBg,
                padding: '0 4px',
                fontSize: '11px',
                fontWeight: 600,
                color: labelColor,
                lineHeight: 1,
                pointerEvents: 'none',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {label}
              {required && <span style={{ color: '#E51937' }}>*</span>}
            </span>
          )}

          {activeIcon && (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px', color: isDark ? '#A3A3A3' : '#6B7280', flexShrink: 0 }}>
              {activeIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            required={required}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '13px',
              color: isDark ? '#FFFFFF' : '#171717',
              fontFamily: 'inherit',
              padding: 0,
              ...style,
            }}
            {...rest}
          />

          {rightElement && (
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '6px', flexShrink: 0 }}>
              {rightElement}
            </div>
          )}

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: isDark ? '#A3A3A3' : '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {error && (
          <span style={{ fontSize: '11px', color: '#E51937', marginTop: '3px', fontWeight: 500 }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

CustomInput.displayName = 'CustomInput';
