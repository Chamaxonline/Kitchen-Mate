/** API stores UTC but may serialize without a Z suffix; always treat as UTC. */
export function parseApiDate(iso: string): Date {
  if (!iso) return new Date(NaN);
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
  return new Date(`${iso}Z`);
}

export function localDateKey(date: Date | string): string {
  const d = typeof date === "string" ? parseApiDate(date) : date;
  return d.toLocaleDateString("en-CA");
}

export function isToday(iso: string): boolean {
  return localDateKey(iso) === localDateKey(new Date());
}

export function formatDateTime(iso: string): string {
  return parseApiDate(iso).toLocaleString();
}

export function formatTime(iso: string): string {
  return parseApiDate(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
