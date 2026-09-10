// Mobile and tablet filter sheet.
// The real sidebar sections are moved into the sheet rather than cloned, so their
// existing wiring and live counts keep working. They are moved back on close.

const SECTION_IDS = ['type-filters', 'date-filters', 'town-filters', 'clear-filters-wrap']
const desktop = window.matchMedia('(min-width: 1100px)')
let overlay = null

export function openFilterSheet() {
  if (overlay) { closeSheet(); return }

  overlay = document.createElement('div')
  overlay.className = 'sidebar-overlay'
  overlay.addEventListener('click', closeSheet)

  const sheet = document.createElement('div')
  sheet.className = 'sidebar-sheet'
  sheet.setAttribute('role', 'dialog')
  sheet.setAttribute('aria-modal', 'true')
  sheet.setAttribute('aria-label', 'Filters')
  sheet.setAttribute('tabindex', '-1')
  sheet.addEventListener('click', (e) => e.stopPropagation())

  const closeBtn = document.createElement('button')
  closeBtn.className = 'sidebar-sheet-close'
  closeBtn.textContent = 'Close filters'
  closeBtn.addEventListener('click', closeSheet)
  sheet.appendChild(closeBtn)

  for (const id of SECTION_IDS) {
    const section = document.getElementById(id)
    if (section) sheet.appendChild(section)
  }

  overlay.appendChild(sheet)
  document.body.appendChild(overlay)
  document.addEventListener('keydown', onKey)
  desktop.addEventListener('change', onDesktop)
  sheet.focus()
}

export function closeSheet() {
  if (!overlay) return

  const sidebar = document.getElementById('sidebar')
  const notice = document.getElementById('notice-desktop')
  for (const id of SECTION_IDS) {
    const section = document.getElementById(id)
    if (section) sidebar.insertBefore(section, notice)
  }

  document.removeEventListener('keydown', onKey)
  desktop.removeEventListener('change', onDesktop)
  overlay.remove()
  overlay = null

  const btn = document.getElementById('filter-toggle')
  if (btn) btn.focus()
}

function onKey(e) {
  if (e.key === 'Escape') closeSheet()
}

function onDesktop(e) {
  if (e.matches) closeSheet()
}
