import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown } from '~/utils/markdown'

describe('parseMarkdown', () => {
  it('parses headings, paragraphs and lists', () => {
    const blocks = parseMarkdown('# Tytuł\n\nPierwsza linia\ndruga linia\n\n- a\n- b\n1. jeden\n2. dwa\n\n## Sekcja')
    expect(blocks).toEqual([
      { type: 'heading', level: 1, spans: [{ text: 'Tytuł', bold: false }] },
      { type: 'paragraph', spans: [{ text: 'Pierwsza linia druga linia', bold: false }] },
      { type: 'list', ordered: false, items: [[{ text: 'a', bold: false }], [{ text: 'b', bold: false }]] },
      { type: 'list', ordered: true, items: [[{ text: 'jeden', bold: false }], [{ text: 'dwa', bold: false }]] },
      { type: 'heading', level: 2, spans: [{ text: 'Sekcja', bold: false }] },
    ])
  })

  it('splits bold text', () => {
    expect(parseInline('**Klient** – osoba')).toEqual([
      { text: 'Klient', bold: true },
      { text: ' – osoba', bold: false },
    ])
  })
})
