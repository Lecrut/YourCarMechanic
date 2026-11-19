/** Minimal iCalendar (.ics) event – opens in Google, Apple and Outlook calendars. */
export interface CalendarEvent {
  uid: string
  title: string
  start: Date
  durationMinutes: number
  location?: string
  description?: string
}

/** `20300107T100000Z` */
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** RFC 5545 text escaping. */
const escape = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

export function toIcs(event: CalendarEvent, now = new Date()): string {
  const end = new Date(event.start.getTime() + event.durationMinutes * 60_000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Twoj mechanik//PL',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Lets the browser save the event as a file. */
export function downloadIcs(event: CalendarEvent, fileName: string) {
  const url = URL.createObjectURL(new Blob([toIcs(event)], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
