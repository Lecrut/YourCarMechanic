import type { MarkdownBlock, MarkdownSpan } from '~/types/markdown'

/** Splits `**bold**` out of a line of text. */
export function parseInline(text: string): MarkdownSpan[] {
  return text.split('**')
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter(span => span.text)
}

/**
 * Minimal Markdown → blocks: `#`–`###` headings, paragraphs (consecutive lines joined),
 * `-`/`*` and `1.` lists and `**bold**`. Enough for the static legal documents, rendered with Vuetify classes.
 */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', spans: parseInline(paragraph.join(' ')) })
    paragraph = []
  }

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    const item = /^(?:([-*])|\d+\.)\s+(.*)$/.exec(line)
    if (!line) {
      flush()
    }
    else if (heading) {
      flush()
      blocks.push({ type: 'heading', level: heading[1]!.length as 1 | 2 | 3, spans: parseInline(heading[2]!) })
    }
    else if (item) {
      flush()
      const ordered = !item[1]
      const last = blocks.at(-1)
      if (last?.type === 'list' && last.ordered === ordered) last.items.push(parseInline(item[2]!))
      else blocks.push({ type: 'list', ordered, items: [parseInline(item[2]!)] })
    }
    else {
      paragraph.push(line)
    }
  }
  flush()
  return blocks
}
