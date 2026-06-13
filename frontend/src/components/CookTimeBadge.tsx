import { Clock } from "lucide-react";
import { formatCookTime, formatOrderCookEta } from "@/lib/cookTime";

export function CookTimeBadge({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
      <Clock className="h-3 w-3" />
      {formatCookTime(minutes)}
    </span>
  );
}

export function OrderCookEta({
  estimatedMinutes,
  createdAt,
  compact,
}: {
  estimatedMinutes: number;
  createdAt: string;
  compact?: boolean;
}) {
  if (estimatedMinutes < 1) return null;

  return (
    <p className={`inline-flex items-center gap-1.5 text-amber-800 ${compact ? "text-xs" : "text-sm font-medium"}`}>
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {formatOrderCookEta(estimatedMinutes, createdAt)}
    </p>
  );
}
