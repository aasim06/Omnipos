import React, { useState } from 'react';
import { makeStyles, tokens, mergeClasses } from '@fluentui/react-components';

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

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: '38px',
    borderRadius: '6px',
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
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '4px 10px',
    boxSizing: 'border-box',
    boxShadow: 'none',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
    opacity: 1,
    cursor: 'text',
  },
  wrapperFocused: {
    borderTopColor: '#E51937',
    borderBottomColor: '#E51937',
    borderLeftColor: '#E51937',
    borderRightColor: '#E51937',
    boxShadow: '0 0 0 2px rgba(229, 25, 55, 0.15)',
  },
  wrapperError: {
    borderTopColor: '#E51937',
    borderBottomColor: '#E51937',
    borderLeftColor: '#E51937',
    borderRightColor: '#E51937',
  },
  wrapperDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  label: {
    position: 'absolute',
    top: '-8px',
    left: '10px',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '0 4px',
    fontSize: '11px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    lineHeight: 1,
    pointerEvents: 'none',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  labelFocused: {
    color: '#E51937',
  },
  labelError: {
    color: '#E51937',
  },
  requiredStar: {
    color: '#E51937',
  },
  activeIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '8px',
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  input: {
    width: '100%',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    outlineStyle: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    fontFamily: 'inherit',
    padding: 0,
  },
  rightElementWrapper: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '6px',
    flexShrink: 0,
  },
  clearBtn: {
    backgroundColor: 'transparent',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    cursor: 'pointer',
    padding: '2px',
    color: tokens.colorNeutralForeground4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '4px',
  },
  errorText: {
    fontSize: '11px',
    color: '#E51937',
    marginTop: '3px',
    fontWeight: 500,
  },
});

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
    const styles = useStyles();
    const [isFocused, setIsFocused] = useState(false);
    const activeIcon = icon || leftIcon;

    return (
      <div
        className={mergeClasses(styles.container, className)}
        style={containerStyle}
      >
        <div
          className={mergeClasses(
            styles.wrapper,
            isFocused && styles.wrapperFocused,
            error && styles.wrapperError,
            disabled && styles.wrapperDisabled
          )}
        >
          {label && (
            <span
              className={mergeClasses(
                styles.label,
                (isFocused || error) && styles.labelFocused,
                error && styles.labelError
              )}
              style={labelBg ? { backgroundColor: labelBg } : undefined}
            >
              {label}
              {required && <span className={styles.requiredStar}>*</span>}
            </span>
          )}

          {activeIcon && (
            <div className={styles.activeIconWrapper}>
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
            className={styles.input}
            style={style}
            {...rest}
          />

          {rightElement && (
            <div className={styles.rightElementWrapper}>
              {rightElement}
            </div>
          )}

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className={styles.clearBtn}
            >
              ✕
            </button>
          )}
        </div>

        {error && (
          <span className={styles.errorText}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

CustomInput.displayName = 'CustomInput';
