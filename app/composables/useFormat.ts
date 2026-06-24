// Presentation-only formatting helpers (no business math here).
export function useFormat() {
  // Always show the FULL amount with thousands separators (e.g. ৳4,50,000).
  // `compact` is accepted for backward-compatibility but intentionally ignored —
  // the app shows full numbers, never abbreviated (450K) values.
  const currency = (value: number, _opts: { compact?: boolean } = {}) => {
    const n = Number.isFinite(value) ? value : 0
    return `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`
  }

  const number = (value: number) =>
    new Intl.NumberFormat('en-US').format(Number.isFinite(value) ? value : 0)

  const percent = (value: number) =>
    `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`

  const date = (value: string) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const relative = (value: string) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    const diff = Date.now() - d.getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days <= 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date(value)
  }

  return { currency, number, percent, date, relative }
}
