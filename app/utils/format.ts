import type { Range } from '~/types/priceList'

/** "850 m", "4,2 km", "37 km". */
export function formatDistance(km: number, locale = 'pl'): string {
  if (km < 1) return `${Math.round(km * 10) * 100} m`
  const value = km < 10 ? Math.round(km * 10) / 10 : Math.round(km)
  return `${value.toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB')} km`
}

export const formatRange = (r: Range) => (r.min === r.max ? `${r.min} PLN` : `${r.min} – ${r.max} PLN`)

/** `1.25` → "1 h 15 min", `0.5` → "30 min", `2` → "2 h". */
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min'
}

/** "30 min – 1 h", or a single value when both ends are equal. */
export const formatDurationRange = (r: Range) =>
  r.min === r.max ? formatDuration(r.min) : `${formatDuration(r.min)} – ${formatDuration(r.max)}`
