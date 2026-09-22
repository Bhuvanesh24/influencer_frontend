/**
 * Free public IFSC lookup (Razorpay's open IFSC API — no auth, no rate-limit key needed) used
 * only to auto-fill the Bank Name field (prompt.md §6.2: "auto-filled from IFSC lookup if you
 * wire a free IFSC API, else manual text"). This is a convenience only — the field stays
 * editable, and any failure here is silent (falls back to manual entry).
 */
export async function fetchBankNameForIfsc(ifsc: string): Promise<string | null> {
  try {
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
    if (!response.ok) return null;
    const data: { BANK?: string } = await response.json();
    return data.BANK ?? null;
  } catch {
    return null;
  }
}
