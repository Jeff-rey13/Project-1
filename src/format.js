import proj4 from 'proj4'

proj4.defs('EPSG:3414', '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs')
const toSvy = proj4('EPSG:4326', 'EPSG:3414')

export const svy21 = (lat, lon) => toSvy.forward([lon, lat])

const dateFmt = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric', month: 'short', year: 'numeric'
})

export function formatDate(isoStr) {
  if (!isoStr) return ''
  const [y, m, d] = isoStr.split('-').map(Number)
  return dateFmt.format(new Date(y, m - 1, d))
}

const numFmt = new Intl.NumberFormat('en-SG')

export function formatNumber(n) {
  return numFmt.format(n)
}

export function pluralPlans(n) {
  return `${formatNumber(n)} ${n === 1 ? 'plan' : 'plans'}`
}

const coordFmt = new Intl.NumberFormat('en-SG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatCoord(val) {
  return coordFmt.format(val)
}
