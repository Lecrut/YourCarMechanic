export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** `day` at `hour`:00 local time. */
export function atHour(day: Date, hour: number): Date {
  const d = startOfDay(day)
  d.setHours(hour)
  return d
}

/** `dd.mm.yyyy hh:mm` */
export function formatDateToString(date: Date | string): string {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** `dd.mm.yyyy` */
export const formatDate = (date: Date | string) => formatDateToString(date).slice(0, 10)

/** e.g. "Poniedziałek, 24.11" – localised weekday label used in the availability table. */
export function formatDayLabel(date: Date, locale: string): string {
  const label = date.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** `yyyy-MM-ddTHH:mm` in local time, for <input type="datetime-local">. */
export function toLocalInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/** Parses the value of <input type="datetime-local"> as local time. */
export const fromLocalInput = (value: string) => new Date(value)
