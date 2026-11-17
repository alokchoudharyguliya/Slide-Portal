import { Check, Copy } from 'lucide-react'
import { isValidElement, useState, type ReactNode } from 'react'
import { highlight } from '../lib/highlight'

function textFrom(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textFrom).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textFrom(node.props.children)
  return ''
}

export function CodePanel({
  title = 'Example',
  language = 'text',
  code,
  children,
}: {
  title?: string
  language?: string
  code?: string
  children?: ReactNode
}) {
  const source = (code ?? textFrom(children)).replace(/\n$/, '')
  const lines = highlight(source, language)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <figure className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-2xl bg-[#1b2330] shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] ring-1 ring-black/20">
      <figcaption className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-sm text-slate-100">
        <span className="font-mono text-[13px] font-medium text-emerald-300" aria-hidden="true">
          &gt;_
        </span>
        <span className="font-medium">{title}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="m-0 flex-1 overflow-auto px-4 py-3.5 font-mono text-[13px] leading-6 text-slate-100">
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className="flex min-h-6">
            <span className="w-7 shrink-0 select-none pr-3 text-right text-slate-500">{lineIndex + 1}</span>
            <span className="min-w-0 whitespace-pre">
              {line.length === 0
                ? ' '
                : line.map((token, tokenIndex) => (
                    <span key={tokenIndex} style={{ color: token.color }}>
                      {token.text}
                    </span>
                  ))}
            </span>
          </div>
        ))}
      </pre>
    </figure>
  )
}
