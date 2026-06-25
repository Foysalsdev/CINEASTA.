// Minimal RFC4180-style CSV parsing/building — handles quoted fields with
// embedded commas/newlines/escaped quotes ("") so spreadsheet exports
// (Excel, Google Sheets) round-trip correctly without a dependency.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  // Strip a leading UTF-8 BOM (common in Excel-exported CSVs).
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    if (row.length > 1 || row[0] !== '') rows.push(row)
    row = []
  }

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') pushField()
    else if (c === '\r') { /* skip — \n (bare or in \r\n) ends the row */ }
    else if (c === '\n') pushRow()
    else field += c
  }
  // Last field/row if the file doesn't end with a newline.
  if (field !== '' || row.length) pushRow()
  return rows
}

export interface CsvParseResult {
  headers: string[]
  records: Record<string, string>[]
}

/** Parse CSV text into header-keyed records. Headers are trimmed + lower-cased. */
export function csvToRecords(text: string): CsvParseResult {
  const rows = parseCsv(text)
  if (!rows.length) return { headers: [], records: [] }
  const headers = rows[0]!.map((h) => h.trim().toLowerCase())
  const records = rows.slice(1).map((row) => {
    const rec: Record<string, string> = {}
    headers.forEach((h, i) => {
      rec[h] = (row[i] ?? '').trim()
    })
    return rec
  })
  return { headers, records }
}

export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Parse a date cell. Accepts ISO (YYYY-MM-DD) and day-first DD/MM/YYYY or
 * DD-MM-YYYY (the local convention) — deliberately NOT `new Date(string)`,
 * whose US-centric slash parsing would silently swap day/month. Blank input
 * falls back to `fallback`; anything else unrecognized is an error so a bad
 * date never silently becomes "today" in a financial import.
 */
export function parseDateCell(raw: string, fallback: string): { value: string; error?: string } {
  const s = raw.trim()
  if (!s) return { value: fallback }
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)
  if (m) return { value: `${m[1]}-${m[2]!.padStart(2, '0')}-${m[3]!.padStart(2, '0')}` }
  m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s)
  if (m) return { value: `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}` }
  return { value: fallback, error: `Unrecognized date "${raw}"` }
}
