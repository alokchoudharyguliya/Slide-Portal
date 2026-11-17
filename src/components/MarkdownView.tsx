import { Children, isValidElement, type ReactNode } from 'react'
import Markdown, { defaultUrlTransform } from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { CodePanel } from './CodePanel'

function Pre({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children)[0]
  if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) {
    return <pre>{children}</pre>
  }
  const language = /language-([\w-]+)/.exec(child.props.className ?? '')?.[1] ?? 'text'
  return <CodePanel language={language}>{child.props.children}</CodePanel>
}

function slideUrl(url: string) {
  if (url.startsWith('asset:')) return url
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(url)) return url
  return defaultUrlTransform(url)
}

export function MarkdownView({ content, assets }: { content: string; assets?: Record<string, string> }) {
  return (
    <div className="prose-slide">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}
        urlTransform={slideUrl}
        components={{ pre: Pre, img: (props) => <SlideImage {...props} assets={assets} /> }}
      >
        {content}
      </Markdown>
    </div>
  )
}

function SlideImage({ src, alt, assets }: { src?: string; alt?: string; assets?: Record<string, string> }) {
  const id = src?.startsWith('asset:') ? src.slice('asset:'.length) : ''
  const resolved = id ? assets?.[id] : src
  if (!resolved) return null
  return <img src={resolved} alt={alt ?? ''} data-asset={id || undefined} />
}
