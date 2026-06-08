export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `PKR ${formatted}`;
}
