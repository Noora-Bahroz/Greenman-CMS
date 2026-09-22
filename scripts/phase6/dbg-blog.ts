import { promises as fs } from 'node:fs'

const t = await fs.readFile('D:/greenman-master/greenman-master/blog.html', 'utf8')
const marker = 'const blogArticles = ['
const start = t.indexOf(marker)
if (start < 0) throw new Error('marker missing')
const body = t.slice(start + marker.length)
let depth = 1
let i = 0
let mode: 'code' | 'dq' | 'sq' | 'bt' = 'code'
let lastSwitch = ''
const transitions: string[] = []
while (i < body.length) {
  const ch = body[i]
  if (mode === 'code') {
    if (ch === '"') {
      mode = 'dq'
      transitions.push(`@${i} ->dq (${JSON.stringify(body.slice(Math.max(0, i - 30), i + 30))})`)
    } else if (ch === "'") {
      mode = 'sq'
      transitions.push(`@${i} ->sq`)
    } else if (ch === '`') {
      mode = 'bt'
      transitions.push(`@${i} ->bt`)
    } else if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) break
    }
  } else {
    if (ch === '\\') {
      i += 2
      continue
    }
    if (mode === 'bt' && ch === '`') mode = 'code'
    else if (mode === 'dq' && ch === '"') mode = 'code'
    else if (mode === 'sq' && ch === "'") mode = 'code'
  }
  if (mode === 'code' && (ch === '[' || ch === ']')) {
    console.log(`bracket @${i} =${ch} depth->${ch === '[' ? depth + 1 : depth - 1} ctx=${JSON.stringify(body.slice(Math.max(0, i - 40), i + 40))}`)
  }
  i++
  if (i >= body.length) {
    console.log('REACHED END depth=', depth, 'mode=', mode)
    break
  }
  if (transitions.length > 200) break
}
console.log('transitions:')
for (const tr of transitions) console.log('  ', tr)
console.log('stopped i=', i)
console.log('stopped i=', i, 'depth=', depth, 'tail=', JSON.stringify(body.slice(i - 2, i + 30)))
const text = '[' + body.slice(0, i + 1)
console.log('text len', text.length, 'backticks', (text.match(/`/g) || []).length)
console.log('text head:', JSON.stringify(text.slice(0, 60)))
console.log('text tail:', JSON.stringify(text.slice(-140)))
try {
  const arr = new Function('return (' + text + ');')()
  console.log('parsed typeof:', typeof arr, 'isArray:', Array.isArray(arr))
  if (Array.isArray(arr)) console.log('articles:', arr.length, 'first:', arr[0]?.title)
  else console.log('first 80 chars:', JSON.stringify(text.slice(0, 80)))
} catch (e) {
  console.log('eval error:', (e as Error).message)
}