/**
 * Money from the API arrives as a Decimal string (`"4500.00"`); a few aggregate fields can come
 * back as a plain number. This only formats — fee math is never recomputed on the client
 * (prompt.md §5).
 */
export function formatMoney(amount: string | number | null | undefined): string {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) return '₹0';
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
