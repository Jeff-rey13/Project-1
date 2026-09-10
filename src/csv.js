// CSV export with formula injection protection
import { svy21, formatDate } from './format.js'

const RISKY = /^[=+\-@\t\r]/
function cell(v) {
  let s = String(v ?? '')
  if (typeof v === 'string' && RISKY.test(s)) s = "'" + s
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCSV(rows) {
  const headers = ['Plan no.', 'Type', 'Town', 'Block', 'Surveyed', 'Stage', 'Format', 'Surveyor', 'Lat', 'Lon', 'SVY21 E', 'SVY21 N']
  const lines = [headers.join(',')]
  for (const r of rows) {
    const [e, n] = svy21(r.lat, r.lon)
    lines.push([
      r.plan_id, r.survey_type, r.town, r.block,
      formatDate(r.survey_date), r.status, r.file_format,
      r.surveyor, r.lat, r.lon, e.toFixed(2), n.toFixed(2)
    ].map(cell).join(','))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const now = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `plan-room_${now}_${rows.length}-plans.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
