import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "success" | "warning" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-orange-200",
  secondary: "bg-stone-100 text-stone-800 hover:bg-stone-200",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  ghost: "bg-transparent text-stone-600 hover:bg-stone-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const sizeClass =
    size === "sm" ? "px-3 py-2 text-sm" : size === "lg" ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${sizeClass} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
