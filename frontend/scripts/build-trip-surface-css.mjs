import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const vuePath = path.join(root, 'src/views/TripView.vue')
const outPath = path.join(root, 'src/components/trip/tripRootSurface.css')

const s = fs.readFileSync(vuePath, 'utf8')
const start = s.indexOf('<style scoped>')
const end = s.indexOf('</style>', start)
if (start === -1 || end === -1) process.exit(1)
let css = s.slice(start + '<style scoped>'.length, end)

const skipPrefixes = new Set([
  '.trip-page-skeleton',
  '.trip-skel-header',
  '.trip-skel-h1',
  '.trip-skel-sub',
  '.trip-skel-desc',
  '.trip-skel-day',
  '.trip-skel-daytitle',
  '.trip-skel-act-rows',
  '.trip-skel-act-row',
  '.trip-skel-dot',
  '.trip-skel-act-line',
  '.trip-not-found',
])

const lines = css.split('\n')
const out = []
let inKeyframes = false
let inMedia = false

for (const line of lines) {
  const trimmed = line.trim()
  if (trimmed.startsWith('@keyframes')) {
    inKeyframes = true
    out.push(line)
    continue
  }
  if (inKeyframes) {
    out.push(line)
    if (trimmed === '}') inKeyframes = false
    continue
  }
  if (trimmed.startsWith('@media')) {
    inMedia = true
    out.push(line)
    continue
  }
  if (inMedia && trimmed === '}') {
    inMedia = false
    out.push(line)
    continue
  }
  if (trimmed === '' || trimmed.startsWith('/*')) {
    out.push(line)
    continue
  }
  if (trimmed === '}' || trimmed.startsWith('}')) {
    out.push(line)
    continue
  }

  let l = line
  if (l.includes(':global(.dark)')) {
    l = l.replace(/:global\(\s*\.dark\s*\)/g, 'html.dark .trip-root.trip-surface')
  }
  if (l.includes(':deep(')) {
    l = l.replace(/:deep\(\s*/g, '.trip-root.trip-surface ').replace(/\)\s*/g, ' ')
  }

  const indent = l.match(/^\s*/)[0]
  const rest = l.slice(indent.length)
  const firstWord = rest.split(/[\s,{]/)[0]
  if (
    firstWord.startsWith('.')
    && !skipPrefixes.has(firstWord.replace(/,$/, ''))
    && !rest.startsWith('.trip-root.trip-surface')
  ) {
    out.push(indent + '.trip-root.trip-surface ' + rest)
  } else {
    out.push(l)
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, out.join('\n'))
console.log('Wrote', outPath, 'lines', out.length)
