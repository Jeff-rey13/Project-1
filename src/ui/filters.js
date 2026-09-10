import { setServerFilter, setClientFilter, clearAll, hasActiveFilters, getAllTowns, getTownCounts } from '../main.js'

const TYPES = ['Engineering Topo', '3D LiDAR Interior', 'Recess Area']
const TYPE_VAR = { 'Engineering Topo': '--topo', '3D LiDAR Interior': '--lidar', 'Recess Area': '--recess' }

let initialized = false

function initFilters() {
  renderTypeChips()
  renderDateInputs()
  initialized = true
}

function renderTypeChips() {
  const wrap = document.getElementById('type-filters')
  wrap.textContent = ''
  const title = document.createElement('h2')
  title.className = 'filter-section-title'
  title.textContent = 'Survey type'
  wrap.appendChild(title)

  const row = document.createElement('div')
  row.className = 'type-chips'
  for (const t of TYPES) {
    const btn = document.createElement('button')
    btn.className = 'type-chip'
    btn.setAttribute('aria-pressed', 'false')
    btn.dataset.type = t

    const swatch = document.createElement('span')
    swatch.className = 'type-swatch'
    swatch.style.backgroundColor = `var(${TYPE_VAR[t]})`
    btn.appendChild(swatch)

    const label = document.createElement('span')
    label.textContent = t
    btn.appendChild(label)

    btn.addEventListener('click', () => {
      const current = btn.getAttribute('aria-pressed') === 'true'
      btn.setAttribute('aria-pressed', String(!current))
      const active = [...wrap.querySelectorAll('.type-chip[aria-pressed="true"]')]
        .map(b => b.dataset.type)
      setServerFilter({ types: active })
    })
    row.appendChild(btn)
  }
  wrap.appendChild(row)
}

function renderDateInputs() {
  const wrap = document.getElementById('date-filters')
  wrap.textContent = ''
  const title = document.createElement('h2')
  title.className = 'filter-section-title'
  title.textContent = 'Surveyed between'
  wrap.appendChild(title)

  const row = document.createElement('div')
  row.className = 'date-row'

  const fromWrap = document.createElement('div')
  fromWrap.className = 'date-field'
  const fromLabel = document.createElement('label')
  fromLabel.className = 'field-label'
  fromLabel.htmlFor = 'date-from'
  fromLabel.textContent = 'From'
  const fromInput = document.createElement('input')
  fromInput.type = 'date'
  fromInput.id = 'date-from'
  fromInput.className = 'date-input'
  fromInput.addEventListener('change', () => setServerFilter({ from: fromInput.value }))
  fromWrap.appendChild(fromLabel)
  fromWrap.appendChild(fromInput)

  const toWrap = document.createElement('div')
  toWrap.className = 'date-field'
  const toLabel = document.createElement('label')
  toLabel.className = 'field-label'
  toLabel.htmlFor = 'date-to'
  toLabel.textContent = 'To'
  const toInput = document.createElement('input')
  toInput.type = 'date'
  toInput.id = 'date-to'
  toInput.className = 'date-input'
  toInput.addEventListener('change', () => setServerFilter({ to: toInput.value }))
  toWrap.appendChild(toLabel)
  toWrap.appendChild(toInput)

  row.appendChild(fromWrap)
  row.appendChild(toWrap)
  wrap.appendChild(row)
}

function renderTownList(state) {
  const wrap = document.getElementById('town-filters')
  const towns = getAllTowns()
  const counts = getTownCounts()
  const selected = state.client.towns
  const maxCount = Math.max(1, ...Object.values(counts))

  wrap.textContent = ''
  const title = document.createElement('h2')
  title.className = 'filter-section-title'
  title.textContent = 'Town'
  wrap.appendChild(title)

  const list = document.createElement('div')
  list.className = 'town-list'
  list.setAttribute('role', 'listbox')
  list.setAttribute('aria-label', 'Filter by town')
  list.setAttribute('aria-multiselectable', 'true')

  for (const town of towns) {
    const c = counts[town] || 0
    const isSelected = selected.includes(town)
    const row = document.createElement('button')
    row.className = 'town-row' + (isSelected ? ' town-row-selected' : '')
    row.setAttribute('role', 'option')
    row.setAttribute('aria-selected', String(isSelected))

    const check = document.createElement('span')
    check.className = 'town-check'
    check.textContent = isSelected ? '\u2611' : '\u2610'

    const name = document.createElement('span')
    name.className = 'town-name' + (c === 0 ? ' town-name-zero' : '')
    name.textContent = town

    const countEl = document.createElement('span')
    countEl.className = 'town-count' + (c === 0 ? ' town-name-zero' : '')
    countEl.textContent = c

    const barWrap = document.createElement('span')
    barWrap.className = 'town-bar-wrap'
    if (c > 0) {
      const bar = document.createElement('span')
      bar.className = 'town-bar' + (isSelected ? ' town-bar-selected' : '')
      bar.style.width = `${(c / maxCount) * 100}%`
      barWrap.appendChild(bar)
    }

    row.appendChild(check)
    row.appendChild(name)
    row.appendChild(barWrap)
    row.appendChild(countEl)

    row.addEventListener('click', () => {
      const next = isSelected
        ? selected.filter(t => t !== town)
        : [...selected, town]
      setClientFilter({ towns: next })
    })
    list.appendChild(row)
  }
  wrap.appendChild(list)
}

function renderClearButton() {
  const wrap = document.getElementById('clear-filters-wrap')
  wrap.textContent = ''
  if (hasActiveFilters()) {
    const btn = document.createElement('button')
    btn.className = 'btn-text'
    btn.id = 'clear-all'
    btn.textContent = 'Clear filters'
    btn.addEventListener('click', clearAll)
    wrap.appendChild(btn)
  }
}

export function renderFilters(state) {
  if (!initialized) initFilters()
  renderTownList(state)
  renderClearButton()
}
