// Small date helpers working in local time with "yyyy-mm-dd" strings.
export const toISO = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};
export const todayISO = () => toISO(new Date());
export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const daysBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const fmtDate = (s: string) =>
  s ? parseISO(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
export const fmtShort = (s: string) =>
  s ? parseISO(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
export const monthKey = (s: string) => s.slice(0, 7);
