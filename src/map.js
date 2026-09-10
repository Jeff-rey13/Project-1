import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { svy21, formatCoord } from './format.js'
import { getVisibleRows, setSelected, getState } from './main.js'

const TYPE_VAR = { 'Engineering Topo': '--topo', '3D LiDAR Interior': '--lidar', 'Recess Area': '--recess' }
let map, markersGroup, readoutEl
let typeColors = {}
let prevRowIds = null

function resolveColors() {
  const style = getComputedStyle(document.documentElement)
  for (const [type, varName] of Object.entries(TYPE_VAR)) {
    typeColors[type] = style.getPropertyValue(varName).trim()
  }
}

const flagColor = () => getComputedStyle(document.documentElement).getPropertyValue('--flag').trim()
const sheetColor = () => getComputedStyle(document.documentElement).getPropertyValue('--sheet').trim()

const SG = L.latLngBounds([1.144, 103.535], [1.494, 104.502])

export function initMap() {
  resolveColors()
  map = L.map('map', {
    center: [1.3521, 103.8198],
    zoom: 12,
    minZoom: 11,
    maxZoom: 19,
    maxBounds: SG,
    preferCanvas: true,
    zoomControl: false,
  })

  L.control.zoom({ position: 'topright' }).addTo(map)
  L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map)

  L.tileLayer('https://www.onemap.gov.sg/maps/tiles/GreyLite/{z}/{x}/{y}.png', {
    minZoom: 11,
    maxZoom: 19,
    attribution: '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>',
  }).addTo(map)

  markersGroup = L.layerGroup().addTo(map)
  buildLegend()
  buildReadout()
}

function buildLegend() {
  const legend = L.control({ position: 'topleft' })
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'map-legend')
    const types = [
      ['Engineering Topo', 'Topo'],
      ['3D LiDAR Interior', 'LiDAR'],
      ['Recess Area', 'Recess'],
    ]
    for (const [type, label] of types) {
      const row = document.createElement('div')
      row.className = 'legend-row'
      const swatch = document.createElement('span')
      swatch.className = 'legend-swatch'
      swatch.style.backgroundColor = typeColors[type]
      const text = document.createElement('span')
      text.textContent = label
      row.appendChild(swatch)
      row.appendChild(text)
      div.appendChild(row)
    }
    return div
  }
  legend.addTo(map)
}

function buildReadout() {
  const control = L.control({ position: 'bottomleft' })
  control.onAdd = () => {
    readoutEl = L.DomUtil.create('div', 'map-readout')
    readoutEl.style.display = 'none'
    return readoutEl
  }
  control.addTo(map)

  let raf = null
  map.on('mousemove', (e) => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      const [east, north] = svy21(e.latlng.lat, e.latlng.lng)
      readoutEl.textContent = `E ${formatCoord(east)}   N ${formatCoord(north)}`
      readoutEl.style.display = ''
      raf = null
    })
  })

  map.on('mouseout', () => {
    readoutEl.style.display = 'none'
  })

  if ('ontouchstart' in window) {
    readoutEl.style.display = 'none'
  }
}

export function renderMap(state) {
  if (!map) {
    initMap()
  }
  if (state.loading) return

  const rows = getVisibleRows()
  const rowIds = rows.map(r => r.plan_id).join(',') + '|' + state.selectedId
  if (rowIds === prevRowIds) return
  prevRowIds = rowIds

  markersGroup.clearLayers()
  const sheet = sheetColor()
  const flag = flagColor()

  for (const r of rows) {
    const isSelected = r.plan_id === state.selectedId
    const marker = L.circleMarker([r.lat, r.lon], {
      radius: isSelected ? 9 : 5,
      fillColor: typeColors[r.survey_type] || '#999',
      fillOpacity: 0.9,
      color: isSelected ? flag : sheet,
      weight: isSelected ? 3 : 1.5,
    })

    const tip = document.createElement('div')
    tip.className = 'marker-tooltip'
    const tipPlan = document.createElement('div')
    tipPlan.className = 'marker-tooltip-plan'
    tipPlan.textContent = r.plan_id
    const tipInfo = document.createElement('div')
    tipInfo.className = 'marker-tooltip-info'
    tipInfo.textContent = `${r.town} \u2022 ${r.status}`
    tip.appendChild(tipPlan)
    tip.appendChild(tipInfo)

    marker.bindTooltip(tip, { direction: 'top', offset: [0, -6] })
    marker.on('click', () => setSelected(r.plan_id))

    if (isSelected) {
      markersGroup.addLayer(marker)
      marker.bringToFront()
    } else {
      markersGroup.addLayer(marker)
    }
  }
}

export function flyToMarker(lat, lon) {
  if (!map) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) {
    map.setView([lat, lon], 17)
  } else {
    map.flyTo([lat, lon], 17, { duration: 0.4 })
  }
}

export function getMapBounds() {
  if (!map) return null
  const b = map.getBounds()
  return { s: b.getSouth(), n: b.getNorth(), w: b.getWest(), e: b.getEast() }
}
