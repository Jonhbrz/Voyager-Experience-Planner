export function formatCurrency(cents: number): string {
  const amount = Number.isFinite(cents) ? cents / 100 : 0

  return formatCurrencyAmount(amount)
}

export function formatCurrencyAmount(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0

  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount)
}
