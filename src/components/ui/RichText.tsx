import type { ReactNode } from 'react'

/**
 * Renderiza texto con un subconjunto mínimo y seguro de Markdown:
 * párrafos, listas (- * 1.) y **negritas**. Nunca interpreta HTML.
 */

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }

function parse(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) continue

    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBERED.exec(line)
    const kind = bullet ? 'ul' : numbered ? 'ol' : null
    const content = (bullet ?? numbered)?.[1]

    if (kind && content !== undefined) {
      const last = blocks[blocks.length - 1]
      if (last && last.kind === kind) last.items.push(content)
      else blocks.push({ kind, items: [content] })
    } else {
      blocks.push({ kind: 'p', text: line.trim() })
    }
  }
  return blocks
}

export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {parse(text).map((block, i) => {
        if (block.kind === 'p') return <p key={i}>{inline(block.text)}</p>
        const Tag = block.kind === 'ul' ? 'ul' : 'ol'
        return (
          <Tag key={i} className={`space-y-1 pl-5 ${block.kind === 'ul' ? 'list-disc' : 'list-decimal'}`}>
            {block.items.map((item, j) => (
              <li key={j}>{inline(item)}</li>
            ))}
          </Tag>
        )
      })}
    </div>
  )
}
