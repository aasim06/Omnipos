import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useAppTheme } from "@/theme/AppProviders";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
  balance?: string | number;
}

export interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  labelBg?: string;
  onClear?: () => void;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  style,
  disabled = false,
  required = false,
  error,
  labelBg,
  onClear,
}: CustomSelectProps) {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options array into object format
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === "string") {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const borderColor = error
    ? "#E51937"
    : isOpen
    ? "#E51937"
    : isDark
    ? "#444444"
    : "#D1D5DB";

  const labelColor = error
    ? "#E51937"
    : isOpen
    ? "#E51937"
    : isDark
    ? "#A3A3A3"
    : "#6B7280";

  const bgCard = isDark ? "#242424" : "#FFFFFF";
  const finalLabelBg = labelBg || bgCard;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", ...style }}
      className={className}
    >
      {/* Trigger Outline Box with Floating Label Notch */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "38px",
          borderRadius: "4px",
          border: `1px solid ${borderColor}`,
          backgroundColor: bgCard,
          padding: "4px 10px",
          boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color 0.15s ease",
          userSelect: "none",
        }}
      >
        {/* Floating Label Notch */}
        {label && (
          <span
            style={{
              position: "absolute",
              top: "-8px",
              left: "10px",
              backgroundColor: finalLabelBg,
              padding: "0 4px",
              fontSize: "11px",
              fontWeight: 600,
              color: labelColor,
              lineHeight: 1,
              pointerEvents: "none",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            {label}
            {required && <span style={{ color: "#E51937" }}>*</span>}
          </span>
        )}

        {/* Selected Label Display */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span
            style={{
              fontSize: "13px",
              color: selectedOption ? (isDark ? "#FFFFFF" : "#171717") : isDark ? "#7E7E7E" : "#9CA3AF",
              fontWeight: selectedOption ? 500 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.balance !== undefined && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: Number(selectedOption.balance) < 0 ? "#E51937" : "#10B981",
                fontFamily: "monospace",
                marginLeft: "auto",
                paddingRight: "4px",
              }}
            >
              {selectedOption.balance}
            </span>
          )}
        </div>

        {/* Action Controls: Clear button and Chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "6px" }}>
          {onClear && selectedOption && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: isDark ? "#A3A3A3" : "#9CA3AF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          )}
          <ChevronDown
            size={15}
            style={{
              color: isOpen ? "#E51937" : isDark ? "#A3A3A3" : "#6B7280",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.15s ease, color 0.15s ease",
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <span style={{ fontSize: "11px", color: "#E51937", marginTop: "3px", fontWeight: 500, display: "block" }}>
          {error}
        </span>
      )}

      {/* Sleek Custom Dropdown Menu Popover */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: bgCard,
            border: `1px solid ${isDark ? "#3D3D3D" : "#E5E5E5"}`,
            borderRadius: "6px",
            boxShadow: isDark
              ? "0 8px 24px rgba(0, 0, 0, 0.45)"
              : "0 8px 24px rgba(0, 0, 0, 0.12)",
            maxHeight: "240px",
            overflowY: "auto",
            zIndex: 100,
            padding: "4px",
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div style={{ padding: "8px 10px", fontSize: "12px", color: isDark ? "#A3A3A3" : "#6B7280", textAlign: "center" }}>
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: "4px",
                    backgroundColor: isSelected
                      ? isDark
                        ? "rgba(229, 25, 55, 0.18)"
                        : "#FEF2F2"
                      : "transparent",
                    color: isSelected ? "#E51937" : isDark ? "#FFFFFF" : "#171717",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isDark ? "#383838" : "#F3F4F6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                    {opt.icon && <span>{opt.icon}</span>}
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {opt.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    {opt.balance !== undefined && (
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: Number(opt.balance) < 0 ? "#E51937" : "#10B981",
                          fontFamily: "monospace",
                        }}
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
