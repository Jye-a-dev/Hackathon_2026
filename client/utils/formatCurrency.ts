// ─────────────────────────────────────────────
// utils/formatCurrency.ts
// ─────────────────────────────────────────────

/**
 * Format số tiền VNĐ hiển thị thân thiện
 * VD: 1500000 → "1.500.000 đ"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' đ';
}

/**
 * Format dạng compact
 * VD: 1500000 → "1,5tr đ" | 500000 → "500k đ"
 */
export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = Number.isInteger(millions)
      ? millions.toString()
      : millions.toFixed(1);
    return `${formatted}tr đ`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k đ`;
  }
  return `${amount} đ`;
}
