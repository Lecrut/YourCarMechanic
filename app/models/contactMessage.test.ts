import { describe, expect, it } from 'vitest'
import { isOpen, mapIContactMessage, replyLink } from './contactMessage'

describe('contact messages', () => {
  it('normalises unknown category and status', () => {
    const m = mapIContactMessage({ category: 'spam' as never, status: 'weird' as never })
    expect(m.category).toBe('other')
    expect(m.status).toBe('new')
  })

  it('open = not resolved and not deleted', () => {
    expect(isOpen(mapIContactMessage({ status: 'new' }))).toBe(true)
    expect(isOpen(mapIContactMessage({ status: 'inProgress' }))).toBe(true)
    expect(isOpen(mapIContactMessage({ status: 'resolved' }))).toBe(false)
    expect(isOpen(mapIContactMessage({ status: 'new', deletedAt: new Date() }))).toBe(false)
  })

  it('reply link quotes the original message', () => {
    const link = replyLink(mapIContactMessage({ name: 'Jan', email: 'jan@example.com', subject: 'Pytanie', message: 'Treść & więcej' }))
    expect(link.startsWith('mailto:jan@example.com?subject=')).toBe(true)
    expect(decodeURIComponent(link)).toContain('Re: Pytanie')
    expect(decodeURIComponent(link)).toContain('Treść & więcej')
  })
})
