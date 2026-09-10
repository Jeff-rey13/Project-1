import { setClientFilter, getStageCounts } from '../main.js'

const STAGES = ['Requested', 'Fieldwork', 'Processing', 'QC', 'Approved']

export function renderStages(state) {
  const wrap = document.getElementById('stages-bar')
  const counts = getStageCounts()
  const selected = state.client.stages
  const anySelected = selected.length > 0

  wrap.textContent = ''

  const line = document.createElement('div')
  line.className = 'stages-line'

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i]
    const c = counts[stage] || 0
    const isOn = selected.includes(stage)

    const station = document.createElement('button')
    station.className = 'stage-station'
    station.setAttribute('aria-pressed', String(isOn))
    station.setAttribute('aria-label', `${stage}: ${c}`)

    const num = document.createElement('span')
    num.className = 'stage-count'
    if (anySelected && !isOn) num.classList.add('stage-count-muted')
    num.textContent = c

    const dot = document.createElement('span')
    dot.className = 'stage-dot'
    dot.classList.add(`stage-dot-${i + 1}`)
    if (isOn) dot.classList.add('stage-dot-selected')

    const label = document.createElement('span')
    label.className = 'stage-label'
    label.textContent = stage

    station.appendChild(dot)
    station.appendChild(label)
    station.appendChild(num)

    station.addEventListener('click', () => {
      const next = isOn
        ? selected.filter(s => s !== stage)
        : [...selected, stage]
      setClientFilter({ stages: next })
    })

    line.appendChild(station)
  }
  wrap.appendChild(line)
}
