import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { makeStyles, tokens, mergeClasses } from '@fluentui/react-components';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
  balance?: string | number;
  disabled?: boolean;
}

export interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  labelBg?: string;
  onClear?: () => void;
}

const useStyles = makeStyles({
  container: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  containerOpen: {
    zIndex: 1000,
  },
  triggerBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '32px',
    borderRadius: '4px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStrokeAccessible,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '4px 10px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    boxSizing: 'border-box',
    cursor: 'pointer',
    opacity: 1,
    boxShadow: 'none',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
    userSelect: 'none',
  },
  triggerBoxOpen: {
    // Windows 11 TextBox focus: 2px accent underline, no glow
    borderBottomColor: '#E51937',
    borderBottomWidth: '2px',
    paddingBottom: '3px',
    boxShadow: 'none',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  triggerBoxError: {
    borderBottomColor: '#E51937',
    borderBottomWidth: '2px',
    paddingBottom: '3px',
  },
  triggerBoxDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: 'transparent',
    padding: '0',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 400,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1.2,
    userSelect: 'none',
    transitionProperty: 'color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
  },
  labelOpen: {
    color: tokens.colorNeutralForeground1,
  },
  labelError: {
    color: '#E51937',
  },
  requiredStar: {
    color: '#E51937',
  },
  selectedDisplay: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  selectedText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    fontWeight: 400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  placeholderText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground4,
    fontWeight: 400,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  balanceText: {
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'monospace',
    marginLeft: 'auto',
    paddingRight: '4px',
  },
  balancePositive: {
    color: '#10B981',
  },
  balanceNegative: {
    color: '#E51937',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
    marginLeft: '6px',
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
  },
  chevron: {
    color: tokens.colorNeutralForeground3,
    transitionProperty: 'transform, color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
  },
  chevronOpen: {
    color: tokens.colorNeutralForeground2,
    transform: 'rotate(180deg)',
  },
  errorText: {
    fontSize: '11px',
    color: '#E51937',
    marginTop: '3px',
    fontWeight: 500,
    display: 'block',
  },
  dropdownPopover: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
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
    borderRadius: '8px',
    boxShadow: tokens.shadow16,
    maxHeight: '240px',
    overflowY: 'auto',
    zIndex: 1000,
    padding: '4px',
  },
  dropdownPopoverUp: {
    top: 'auto',
    bottom: 'calc(100% + 4px)',
    boxShadow: tokens.shadow16,
  },
  noOptions: {
    padding: '8px 10px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
  optionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    minHeight: '32px',
    padding: '6px 12px',
    boxSizing: 'border-box',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground1,
    fontWeight: 400,
    fontSize: '14px',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  // Win11 list selection: subtle fill + short accent pill
  optionItemSelected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    fontWeight: 600,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Selected,
    },
    '::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      width: '3px',
      height: '16px',
      marginTop: '-8px',
      borderRadius: '2px',
      backgroundColor: '#E51937',
    },
  },
  optionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    overflow: 'hidden',
  },
  optionLabel: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  optionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  optionBalance: {
    fontSize: '11.5px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  optionItemDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
});

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  required = false,
  error,
  labelBg,
  onClear,
}: CustomSelectProps): React.JSX.Element {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options array into object format
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart drop-up detection when space below is tight
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 200 && rect.top > spaceBelow) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    } else {
      setDropUp(false);
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={mergeClasses(styles.container, isOpen && styles.containerOpen, className)}
    >
      {/* Label */}
      {label && (
        <label
          className={mergeClasses(
            styles.label,
            (isOpen || error) && styles.labelOpen,
            error && styles.labelError
          )}
          style={labelBg ? { backgroundColor: labelBg } : undefined}
        >
          {label}
          {required && <span className={styles.requiredStar}>*</span>}
        </label>
      )}

      {/* Trigger Outline Box */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={mergeClasses(
          styles.triggerBox,
          isOpen && styles.triggerBoxOpen,
          error && styles.triggerBoxError,
          disabled && styles.triggerBoxDisabled
        )}
      >

        {/* Selected Label Display */}
        <div className={styles.selectedDisplay}>
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span className={selectedOption ? styles.selectedText : styles.placeholderText}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.balance !== undefined && (
            <span
              className={mergeClasses(
                styles.balanceText,
                Number(selectedOption.balance) < 0 ? styles.balanceNegative : styles.balancePositive
              )}
            >
              {selectedOption.balance}
            </span>
          )}
        </div>

        {/* Action Controls: Clear button and Chevron */}
        <div className={styles.controlsRow}>
          {onClear && selectedOption && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className={styles.clearBtn}
              title="Clear"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={mergeClasses(styles.chevron, isOpen && styles.chevronOpen)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <span className={styles.errorText}>
          {error}
        </span>
      )}

      {/* Sleek Custom Dropdown Menu Popover */}
      {isOpen && (
        <div className={mergeClasses(styles.dropdownPopover, dropUp && styles.dropdownPopoverUp)}>
          {normalizedOptions.length === 0 ? (
            <div className={styles.noOptions}>
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={mergeClasses(
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    opt.disabled && styles.optionItemDisabled
                  )}
                >
                  <div className={styles.optionContent}>
                    {opt.icon && <span>{opt.icon}</span>}
                    <span className={styles.optionLabel}>
                      {opt.label}
                    </span>
                  </div>

                  <div className={styles.optionMeta}>
                    {opt.balance !== undefined && (
                      <span
                        className={mergeClasses(
                          styles.optionBalance,
                          Number(opt.balance) < 0 ? styles.balanceNegative : styles.balancePositive
                        )}
                      >
                        {opt.balance}
                      </span>
                    )}
                    {isSelected && <Check size={14} color="#E51937" />}
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
