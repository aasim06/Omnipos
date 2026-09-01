"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: CustomSelectProps) {
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

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-[#0e1015] border border-[#232734] hover:border-[#ff6b00]/50 focus:border-[#ff6b00] rounded-md px-3.5 py-2.5 text-sm text-white font-medium flex items-center justify-between transition-colors shadow-sm cursor-pointer outline-none"
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-[#8b92a0] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#ff6b00]" : ""
          }`}
        />
      </button>

      {/* Sleek Custom Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#141720] border border-[#232734] rounded-md shadow-2xl overflow-hidden max-h-60 overflow-y-auto no-scrollbar py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-sm text-left font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#ff6b00]/20 text-[#ff6b00] font-bold"
                    : "text-[#cbd5e1] hover:bg-[#1a1d28] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  {opt.icon && <span>{opt.icon}</span>}
                  <span>{opt.label}</span>
                </span>
                {isSelected && <Check size={13} className="text-[#ff6b00]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
