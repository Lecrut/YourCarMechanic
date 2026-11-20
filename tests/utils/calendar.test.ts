import { describe, expect, it } from 'vitest'
import { toIcs } from '~/utils/calendar'

describe('calendar export', () => {
  it('produces a valid, escaped VEVENT', () => {
    const ics = toIcs({
      uid: 'fixes-1@test',
      title: 'Wizyta: AutoFix, Kraków',
      start: new Date('2030-01-07T10:00:00Z'),
      durationMinutes: 60,
      location: 'ul. Długa 5; Kraków',
    }, new Date('2030-01-01T00:00:00Z'))
    expect(ics).toContain('DTSTART:20300107T100000Z')
    expect(ics).toContain('DTEND:20300107T110000Z')
    expect(ics).toContain('SUMMARY:Wizyta: AutoFix\\, Kraków')
    expect(ics).toContain('LOCATION:ul. Długa 5\\; Kraków')
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
  })
})
