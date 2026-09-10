import { getVisibleRows, setSelected } from '../main.js'
import { formatDate, svy21, formatCoord } from '../format.js'
import { flyToMarker } from '../map.js'

const TYPE_SHORT = { 'Engineering Topo': 'Topo', '3D LiDAR Interior': 'LiDAR', 'Recess Area': 'Recess' }
const TYPE_VAR = { 'Engineering Topo': '--topo', '3D LiDAR Interior': '--lidar', 'Recess Area': '--recess' }
const STAGES = ['Requested', 'Fieldwork', 'Processing', 'QC', 'Approved']

let prevId = null

export function renderDetails(state) {
  const wrap = document.getElementById('details-wrap')

  if (!state.selectedId) {
    if (prevId) {
      wrap.textContent = ''
      prevId = null
    }
    return
  }

  if (state.selectedId === prevId) return
  prevId = state.selectedId

  const rows = getVisibleRows()
  const plan = rows.find(r => r.plan_id === state.selectedId)
  if (!plan) {
    wrap.textContent = ''
    prevId = null
    return
  }

  wrap.textContent = ''
  const panel = document.createElement('div')
  panel.className = 'details-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', `Details for ${plan.plan_id}`)

  const [easting, northing] = svy21(plan.lat, plan.lon)

  // Title block grid
  const grid = document.createElement('div')
  grid.className = 'title-block'

  // Row 1: Plan no. | Stage
  grid.appendChild(makeRow([
    makeCell('Plan no.', plan.plan_id, 'tb-cell-wide tb-cell-plan'),
    makeCell('Stage', plan.status, 'tb-cell-narrow'),
  ]))

  // Row 2: Survey type | Town | Block
  const typeCell = makeCell('Survey type', '', 'tb-cell-third')
  const swatch = document.createElement('span')
  swatch.className = 'type-swatch-inline'
  swatch.style.backgroundColor = `var(${TYPE_VAR[plan.survey_type]})`
  const typeText = document.createTextNode(' ' + (TYPE_SHORT[plan.survey_type] || plan.survey_type))
  typeCell.querySelector('.tb-value').appendChild(swatch)
  typeCell.querySelector('.tb-value').appendChild(typeText)

  grid.appendChild(makeRow([
    typeCell,
    makeCell('Town', plan.town, 'tb-cell-third'),
    makeCell('Block', plan.block, 'tb-cell-third'),
  ]))

  // Row 3: Surveyed | Surveyor | Format
  grid.appendChild(makeRow([
    makeCell('Surveyed', formatDate(plan.survey_date), 'tb-cell-third'),
    makeCell('Surveyor', plan.surveyor, 'tb-cell-third'),
    makeCell('Format', plan.file_format, 'tb-cell-third'),
  ]))

  // Row 4: SVY21
  const coordCell = makeCell('SVY21', `E ${formatCoord(easting)}      N ${formatCoord(northing)}`, 'tb-cell-full tb-cell-coord')
  grid.appendChild(makeRow([coordCell]))

  // Row 5: Workflow
  const wfRow = document.createElement('div')
  wfRow.className = 'tb-row'
  const wfCell = document.createElement('div')
  wfCell.className = 'tb-cell tb-cell-full'
  const wfLabel = document.createElement('span')
  wfLabel.className = 'tb-label'
  wfLabel.textContent = 'Workflow'
  wfCell.appendChild(wfLabel)
  const wfLine = document.createElement('div')
  wfLine.className = 'workflow-line'

  const stageIdx = STAGES.indexOf(plan.status)
  for (let i = 0; i < STAGES.length; i++) {
    const s = document.createElement('span')
    s.className = 'wf-station'
    const dot = document.createElement('span')
    dot.className = 'wf-dot'
    if (i < stageIdx) dot.classList.add('wf-dot-done')
    else if (i === stageIdx) dot.classList.add('wf-dot-current')
    else dot.classList.add('wf-dot-future')
    const name = document.createElement('span')
    name.className = 'wf-name'
    name.textContent = STAGES[i]
    s.appendChild(dot)
    s.appendChild(name)
    wfLine.appendChild(s)
  }
  wfCell.appendChild(wfLine)
  wfRow.appendChild(wfCell)
  grid.appendChild(wfRow)

  panel.appendChild(grid)

  // Actions
  const actions = document.createElement('div')
  actions.className = 'details-actions'

  const zoomBtn = document.createElement('button')
  zoomBtn.className = 'btn-secondary'
  zoomBtn.textContent = 'Zoom to plan'
  zoomBtn.addEventListener('click', () => flyToMarker(plan.lat, plan.lon))

  const copyBtn = document.createElement('button')
  copyBtn.className = 'btn-secondary'
  copyBtn.textContent = 'Copy plan no.'
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(plan.plan_id).then(() => {
      copyBtn.textContent = 'Copied'
      setTimeout(() => { copyBtn.textContent = 'Copy plan no.' }, 1500)
    })
  })

  const closeBtn = document.createElement('button')
  closeBtn.className = 'btn-secondary details-close'
  closeBtn.textContent = 'Close'
  closeBtn.addEventListener('click', () => setSelected(null))

  actions.appendChild(zoomBtn)
  actions.appendChild(copyBtn)
  actions.appendChild(closeBtn)
  panel.appendChild(actions)

  wrap.appendChild(panel)

  // Esc to close
  const onKey = (e) => {
    if (e.key === 'Escape') {
      setSelected(null)
      document.removeEventListener('keydown', onKey)
    }
  }
  document.addEventListener('keydown', onKey)

  // Focus the panel
  panel.setAttribute('tabindex', '-1')
  panel.focus()
}

function makeRow(cells) {
  const row = document.createElement('div')
  row.className = 'tb-row'
  for (const c of cells) row.appendChild(c)
  return row
}

function makeCell(label, value, cls) {
  const cell = document.createElement('div')
  cell.className = 'tb-cell ' + (cls || '')
  const lbl = document.createElement('span')
  lbl.className = 'tb-label'
  lbl.textContent = label
  const val = document.createElement('span')
  val.className = 'tb-value'
  if (value) val.textContent = value
  cell.appendChild(lbl)
  cell.appendChild(val)
  return cell
}
