import '@fontsource-variable/archivo/wdth.css'
import './styles/app.css'
import { fetchPlans } from './api.js'
import { filterByClient, countByTowns, countByStages, allTowns, sortRows } from './facets.js'
import { pluralPlans } from './format.js'
import { exportCSV } from './csv.js'
import { renderFilters } from './ui/filters.js'
import { renderStages } from './ui/stages.js'
import { renderMap } from './map.js'
import { renderTable } from './ui/table.js'
import { renderDetails } from './ui/details.js'
import { openFilterSheet } from './ui/sheet.js'

const state = {
  rows: [],
  loading: true,
  error: null,
  server: { types: [], from: '', to: '', query: '', bounds: null },
  client: { towns: [], stages: [] },
  sort: { key: 'survey_date', dir: 'desc' },
  visibleCount: 50,
  selectedId: null,
}

let requestId = 0
let debounceTimer = null

export function getState() { return state }

export function setState(patch) {
  Object.assign(state, patch)
  renderAll()
}

export function setServerFilter(patch) {
  Object.assign(state.server, patch)
  loadPlans()
}

export function setClientFilter(patch) {
  Object.assign(state.client, patch)
  state.visibleCount = 50
  const visible = getVisibleRows()
  if (state.selectedId && !visible.find(r => r.plan_id === state.selectedId)) {
    state.selectedId = null
  }
  renderAll()
}

export function setSort(key) {
  if (state.sort.key === key) {
    state.sort.dir = state.sort.dir === 'desc' ? 'asc' : 'desc'
  } else {
    state.sort.key = key
    state.sort.dir = key === 'survey_date' ? 'desc' : 'asc'
  }
  renderAll()
}

export function setSelected(id) {
  state.selectedId = state.selectedId === id ? null : id
  renderAll()
}

export function showMore() {
  state.visibleCount += 50
  renderAll()
}

export function clearAll() {
  state.server = { types: [], from: '', to: '', query: '', bounds: null }
  state.client = { towns: [], stages: [] }
  state.visibleCount = 50
  state.selectedId = null
  document.getElementById('search').value = ''
  const from = document.getElementById('date-from')
  const to = document.getElementById('date-to')
  if (from) from.value = ''
  if (to) to.value = ''
  document.querySelectorAll('.type-chip').forEach(b => {
    b.setAttribute('aria-pressed', 'false')
  })
  loadPlans()
}

export function getVisibleRows() {
  const filtered = filterByClient(state.rows, state.client)
  return sortRows(filtered, state.sort)
}

export function getTownCounts() {
  return countByTowns(state.rows, state.client.stages)
}

export function getStageCounts() {
  return countByStages(state.rows, state.client.towns)
}

export function getAllTowns() {
  return allTowns(state.rows)
}

export function hasActiveFilters() {
  const s = state.server
  const c = state.client
  return s.types.length > 0 || s.from || s.to || s.query || s.bounds
    || c.towns.length > 0 || c.stages.length > 0
}

function activeFilterCount() {
  let n = 0
  if (state.server.types.length) n++
  if (state.server.from || state.server.to) n++
  if (state.server.query) n++
  if (state.client.towns.length) n++
  if (state.client.stages.length) n++
  return n
}

function renderAll() {
  renderResultsBar()
  renderFilters(state)
  renderStages(state)
  renderMap(state)
  renderTable(state)
  renderDetails(state)
}

function renderResultsBar() {
  const el = document.getElementById('results-bar')
  el.textContent = ''

  // Mobile filter button
  const filterBtn = document.createElement('button')
  filterBtn.className = 'filter-btn-mobile'
  filterBtn.id = 'filter-toggle'
  const count = activeFilterCount()
  filterBtn.textContent = count > 0 ? `Filters (${count})` : 'Filters'
  filterBtn.addEventListener('click', openFilterSheet)
  el.appendChild(filterBtn)

  if (state.loading) {
    const span = document.createElement('span')
    span.className = 'result-count'
    span.textContent = 'Loading...'
    el.appendChild(span)
    return
  }

  if (state.error) {
    const msg = document.createElement('span')
    msg.className = 'result-count'
    msg.textContent = "Plans didn't load. Check your connection, then retry. "
    const btn = document.createElement('button')
    btn.className = 'btn-text'
    btn.textContent = 'Retry'
    btn.addEventListener('click', loadPlans)
    el.appendChild(msg)
    el.appendChild(btn)
    return
  }

  const visible = getVisibleRows()
  const countEl = document.createElement('span')
  countEl.className = 'result-count'
  countEl.textContent = pluralPlans(visible.length)
  el.appendChild(countEl)

  if (visible.length > 0) {
    const btn = document.createElement('button')
    btn.className = 'btn-primary'
    btn.id = 'download-csv'
    btn.textContent = `Download CSV (${visible.length})`
    btn.addEventListener('click', () => exportCSV(visible))
    el.appendChild(btn)
  }
}

async function loadPlans() {
  const id = ++requestId
  setState({ loading: true, error: null })
  try {
    const data = await fetchPlans(state.server)
    if (id !== requestId) return
    setState({ rows: data, loading: false })
  } catch (err) {
    if (id !== requestId) return
    setState({ loading: false, error: err.message })
  }
}

// Search debounce
const searchInput = document.getElementById('search')
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    setServerFilter({ query: searchInput.value })
  }, 300)
})

// Keyboard shortcut: / focuses search
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault()
    searchInput.focus()
  }
})

loadPlans()
