// Presentation-only formatting helpers (no business math here).
export function useFormat() {
  const currency = (value: number, opts: { compact?: boolean } = {}) => {
    const n = Number.isFinite(value) ? value : 0
    if (opts.compact && Math.abs(n) >= 1000) {
      const formatted = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n)
      return `৳${formatted}`
    }
    return `৳${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
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
