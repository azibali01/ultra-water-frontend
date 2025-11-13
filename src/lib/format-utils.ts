export function formatCurrency(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return "-";
  try {
    // Use Pakistani locale and PKR currency so formatting (symbol, grouping) matches PKR
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(n);
  } catch {
    return `Rs ${n.toFixed(2)}`;
  }
}

export function formatDate(d: string | Date | undefined | null) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

// Remove legacy parenthetical suffixes like " (Thickness: ..., Color: ...)" from product names
export function sanitizeItemName(name?: string | null) {
  if (!name) return "";
  try {
    // Strip any trailing " (Thickness: ... , Color: ... )" or similar parentheses at end
    return String(name).replace(/\s*\([^)]*(Thickness\:|Color\:)[^)]*\)\s*$/i, "").trim();
  } catch {
    return String(name);
  }
}
