import type { FlatSlide } from '../lib/tree'
import { MarkdownView } from './MarkdownView'

export function PrintDeck({
  courseTitle,
  slides,
  assets,
}: {
  courseTitle: string
  slides: FlatSlide[]
  assets?: Record<string, string>
}) {
  return (
    <div className="print-deck" aria-hidden="true">
      {slides.map(({ item, trail }) => (
        <article className="print-slide" key={item.id}>
          <p className="print-kicker">{trail ? `${courseTitle} · ${trail}` : courseTitle}</p>
          <h1>{item.title}</h1>
          {item.content.trim() ? <MarkdownView content={item.content} assets={assets} /> : null}
        </article>
      ))}
    </div>
  )
}
