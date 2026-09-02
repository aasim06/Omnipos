import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "fastfood" | "minimart" | "neutral" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  fastfood: "bg-fastfood text-[#1a1300] hover:brightness-110",
  minimart: "bg-minimart text-[#00201a] hover:brightness-110",
  neutral: "bg-surface-2 text-text border border-border hover:bg-border/60",
  danger: "bg-danger text-white hover:brightness-110",
  ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "neutral", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
