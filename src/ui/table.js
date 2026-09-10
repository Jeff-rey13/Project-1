import { getVisibleRows, setSelected, setSort, showMore, clearAll } from '../main.js'
import { formatDate } from '../format.js'

const TYPE_SHORT = { 'Engineering Topo': 'Topo', '3D LiDAR Interior': 'LiDAR', 'Recess Area': 'Recess' }
const TYPE_VAR = { 'Engineering Topo': '--topo', '3D LiDAR Interior': '--lidar', 'Recess Area': '--recess' }

export function renderTable(state) {
  const wrap = document.getElementById('table-wrap')
  wrap.textContent = ''

  if (state.loading) {
    renderSkeletons(wrap)
    return
  }

  if (state.error) return

  const rows = getVisibleRows()

  if (rows.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    const msg = document.createElement('span')
    msg.textContent = 'No plans match these filters. '
    const btn = document.createElement('button')
    btn.className = 'btn-text'
    btn.textContent = 'Clear filters'
    btn.addEventListener('click', clearAll)
    empty.appendChild(msg)
    empty.appendChild(btn)
    wrap.appendChild(empty)
    return
  }

  const visible = rows.slice(0, state.visibleCount)
  const table = document.createElement('table')
  table.className = 'plans-table'

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const cols = [
    { key: 'plan_id', label: 'Plan no.', sortable: true },
    { key: 'survey_type', label: 'Type', sortable: false },
    { key: 'town', label: 'Town', sortable: false },
    { key: 'block', label: 'Block', sortable: false },
    { key: 'survey_date', label: 'Surveyed', sortable: true },
    { key: 'status', label: 'Stage', sortable: false },
    { key: 'file_format', label: 'Format', sortable: false },
  ]

  for (const col of cols) {
    const th = document.createElement('th')
    th.className = 'table-header'
    if (col.sortable) {
      const btn = document.createElement('button')
      btn.className = 'sort-btn'
      btn.textContent = col.label
      if (state.sort.key === col.key) {
        const arrow = state.sort.dir === 'asc' ? ' \u25B2' : ' \u25BC'
        btn.textContent = col.label + arrow
      }
      btn.addEventListener('click', () => setSort(col.key))
      th.appendChild(btn)
    } else {
      th.textContent = col.label
    }
    headerRow.appendChild(th)
  }
  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  for (const row of visible) {
    const tr = document.createElement('tr')
    tr.className = 'table-row'
    if (row.plan_id === state.selectedId) tr.classList.add('table-row-selected')
    tr.addEventListener('click', () => setSelected(row.plan_id))

    const cells = [
      { text: row.plan_id, cls: 'cell-plan', type: null },
      { text: TYPE_SHORT[row.survey_type] || row.survey_type, cls: 'cell-type', type: row.survey_type },
      { text: row.town, cls: '', type: null },
      { text: row.block, cls: '', type: null },
      { text: formatDate(row.survey_date), cls: 'cell-date', type: null },
      { text: row.status, cls: '', type: null },
      { text: row.file_format, cls: '', type: null },
    ]

    for (const c of cells) {
      const td = document.createElement('td')
      td.className = 'table-cell'
      if (c.cls) td.classList.add(c.cls)

      if (c.type) {
        const swatch = document.createElement('span')
        swatch.className = 'type-swatch-inline'
        swatch.style.backgroundColor = `var(${TYPE_VAR[c.type]})`
        td.appendChild(swatch)
        const text = document.createTextNode(c.text)
        td.appendChild(text)
      } else {
        td.textContent = c.text
      }
      tr.appendChild(td)
    }
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  wrap.appendChild(table)

  if (visible.length < rows.length) {
    const more = document.createElement('button')
    more.className = 'btn-text show-more'
    more.textContent = 'Show 50 more'
    more.addEventListener('click', showMore)
    wrap.appendChild(more)
  }
}

function renderSkeletons(wrap) {
  const skel = document.createElement('div')
  skel.className = 'skeleton-wrap'
  for (let i = 0; i < 8; i++) {
    const row = document.createElement('div')
    row.className = 'skeleton-row'
    skel.appendChild(row)
  }
  wrap.appendChild(skel)
}
