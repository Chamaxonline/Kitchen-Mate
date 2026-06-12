import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-sm shadow-stone-200/50 ${padding ? "p-5 sm:p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
