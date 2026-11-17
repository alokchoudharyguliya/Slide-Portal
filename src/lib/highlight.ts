export type Token = {
  text: string
  color: string
}

const palette = {
  text: '#e2e8f0',
  comment: '#86efac',
  keyword: '#7dd3fc',
  string: '#fcd34d',
  number: '#c4b5fd',
  punct: '#94a3b8',
  func: '#93c5fd',
  negate: '#fda4af',
}

const keywords = new Set([
  'and',
  'as',
  'async',
  'await',
  'cd',
  'class',
  'const',
  'def',
  'default',
  'do',
  'done',
  'echo',
  'elif',
  'else',
  'except',
  'export',
  'extends',
  'false',
  'fi',
  'for',
  'from',
  'function',
  'git',
  'if',
  'import',
  'in',
  'lambda',
  'let',
  'new',
  'None',
  'not',
  'npm',
  'null',
  'of',
  'or',
  'pass',
  'raise',
  'return',
  'source',
  'then',
  'true',
  'True',
  'False',
  'try',
  'typeof',
  'undefined',
  'var',
  'while',
  'with',
  'yield',
])

const hashComments = new Set([
  'bash',
  'py',
  'python',
  'rb',
  'ruby',
  'sh',
  'shell',
  'toml',
  'yaml',
  'yml',
  'zsh',
])

const slashComments = new Set([
  'javascript',
  'js',
  'jsx',
  'ts',
  'tsx',
  'typescript',
])

export function highlight(code: string, language: string): Token[][] {
  const lang = language.toLowerCase()
  return code.split('\n').map((line) => highlightLine(line, lang))
}

function highlightLine(line: string, lang: string): Token[] {
  if (line.length === 0) return []

  if (lang === 'gitignore' || lang === 'ignore' || lang === 'text' || lang === 'txt' || lang === 'plaintext') {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) return [{ text: line, color: palette.comment }]
    if (trimmed.startsWith('!')) return [{ text: line, color: palette.negate }]
    return [{ text: line, color: palette.text }]
  }

  if (lang === 'diff') {
    if (line.startsWith('+')) return [{ text: line, color: palette.comment }]
    if (line.startsWith('-')) return [{ text: line, color: palette.negate }]
    if (line.startsWith('@@') || line.startsWith('diff')) return [{ text: line, color: palette.keyword }]
    return [{ text: line, color: palette.text }]
  }

  const tokens: Token[] = []
  let index = 0

  while (index < line.length) {
    const rest = line.slice(index)

    if (hashComments.has(lang) && rest.startsWith('#')) {
      tokens.push({ text: rest, color: palette.comment })
      break
    }

    if (slashComments.has(lang) && rest.startsWith('//')) {
      tokens.push({ text: rest, color: palette.comment })
      break
    }

    const stringMatch = /^(["'`])(?:\\.|(?!\1).)*\1/.exec(rest)
    if (stringMatch) {
      tokens.push({ text: stringMatch[0], color: palette.string })
      index += stringMatch[0].length
      continue
    }

    const numberMatch = /^\b\d+(?:\.\d+)?\b/.exec(rest)
    if (numberMatch) {
      tokens.push({ text: numberMatch[0], color: palette.number })
      index += numberMatch[0].length
      continue
    }

    const wordMatch = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest)
    if (wordMatch) {
      const word = wordMatch[0]
      const next = line[index + word.length]
      tokens.push({
        text: word,
        color: keywords.has(word) ? palette.keyword : next === '(' ? palette.func : palette.text,
      })
      index += word.length
      continue
    }

    const punctMatch = /^[{}()[\].,:;=+\-*/<>!|&]+/.exec(rest)
    if (punctMatch) {
      tokens.push({ text: punctMatch[0], color: palette.punct })
      index += punctMatch[0].length
      continue
    }

    tokens.push({ text: rest[0] ?? '', color: palette.text })
    index += 1
  }

  return tokens
}
