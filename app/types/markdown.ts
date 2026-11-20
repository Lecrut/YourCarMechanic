/** A piece of inline text; `bold` for `**…**`. */
export interface MarkdownSpan {
  text: string
  bold: boolean
}

/** One block of a parsed Markdown document (only what the legal documents use). */
export type MarkdownBlock
  = | { type: 'heading', level: 1 | 2 | 3, spans: MarkdownSpan[] }
    | { type: 'paragraph', spans: MarkdownSpan[] }
    | { type: 'list', ordered: boolean, items: MarkdownSpan[][] }
