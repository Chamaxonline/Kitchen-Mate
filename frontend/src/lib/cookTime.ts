import { parseApiDate } from "./dates";

export function formatCookTime(minutes: number): string {
  if (minutes < 1) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function estimateOrderCookMinutes(lines: { cookTimeMinutes: number }[]): number {
  if (lines.length === 0) return 0;
  return Math.max(...lines.map((l) => l.cookTimeMinutes));
}

export function elapsedMinutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - parseApiDate(iso).getTime()) / 60000));
}

export function formatOrderCookEta(estimatedMinutes: number, createdAt: string): string {
  const elapsed = elapsedMinutesSince(createdAt);
  const remaining = Math.max(0, estimatedMinutes - elapsed);
  if (remaining === 0) return `Est. ${formatCookTime(estimatedMinutes)} · due now`;
  return `Est. ${formatCookTime(estimatedMinutes)} · ~${formatCookTime(remaining)} left`;
}
