// Pure functions: client-side filtering, counting and sorting

export function filterByClient(rows, { towns, stages }) {
  let result = rows
  if (towns.length) result = result.filter(r => towns.includes(r.town))
  if (stages.length) result = result.filter(r => stages.includes(r.status))
  return result
}

export function countByTowns(rows, stages) {
  const filtered = stages.length ? rows.filter(r => stages.includes(r.status)) : rows
  const counts = {}
  for (const r of filtered) counts[r.town] = (counts[r.town] || 0) + 1
  return counts
}

export function countByStages(rows, towns) {
  const filtered = towns.length ? rows.filter(r => towns.includes(r.town)) : rows
  const counts = {}
  for (const r of filtered) counts[r.status] = (counts[r.status] || 0) + 1
  return counts
}

export function allTowns(rows) {
  return [...new Set(rows.map(r => r.town))].sort()
}

export function sortRows(rows, { key, dir }) {
  const m = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = a[key] ?? ''
    const vb = b[key] ?? ''
    return va < vb ? -m : va > vb ? m : 0
  })
}
