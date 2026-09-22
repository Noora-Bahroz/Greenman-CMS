import { promises as fs } from 'node:fs'
import * as path from 'node:path'

process.env.PAYLOAD_SECRET ??= 'dev-only-secret-32chars-minimum-budget-check'
process.env.DATABASE_URI = process.env.P5_DB_URI ?? 'file:payload-phase5-test.db'

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')

const payload = await getPayload({ config })

const BLOG_HTML = path.join(
  process.env.GREENMAN_WEB_DIR ?? 'D:\\greenman-master\\greenman-master',
  'blog.html'
)

function extractBlogArticles(src: string): Array<Record<string, unknown>> {
  const marker = 'blogArticles = ['
  const start = src.indexOf(marker)
  if (start < 0) throw new Error('blog.html: blogArticles = [ not found')
  const body = src.slice(start + marker.length)
  // scan for the balanced closing bracket, respecting strings and template literals
  let depth = 1
  let i = 0
  let mode: 'code' | 'dq' | 'sq' | 'bt' = 'code'
  while (i < body.length) {
    const ch = body[i]
    const next = body[i + 1]
    if (mode === 'code') {
      if (ch === '"') mode = 'dq'
      else if (ch === "'") mode = 'sq'
      else if (ch === '`') mode = 'bt'
      else if (ch === '[') depth++
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
    i++
    if (next === undefined) throw new Error('blog.html: unterminated blogArticles array')
  }
  const text = '[' + body.slice(0, i + 1)
  if (!text.endsWith(']')) throw new Error('blog.html: array scan failed')
  // eslint-disable-next-line no-new-func
  const arr = new Function(`"use strict"; return (${text});`)()
  if (!Array.isArray(arr)) throw new Error('blog.html: blogArticles did not evaluate to array')
  return arr as Array<Record<string, unknown>>
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

async function upsertBlog(slug: string, data: Record<string, unknown>) {
  const found = (await payload.find({
    collection: 'blogs',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })) as { totalDocs: number; docs: Array<{ id: number | string }> }
  if (found.totalDocs > 0) {
    return payload.update({
      collection: 'blogs',
      id: found.docs[0].id,
      data: data as never,
      overrideAccess: true,
    })
  }
  return payload.create({ collection: 'blogs', data: data as never, overrideAccess: true })
}

const src = await fs.readFile(BLOG_HTML, 'utf8')
const articles = extractBlogArticles(src)

const admins = (await payload.find({
  collection: 'users',
  where: { email: { equals: 'admin@example.com' } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})) as { totalDocs: number; docs: Array<{ id: number | string }> }
const authorId = admins.totalDocs > 0 ? admins.docs[0].id : undefined

let n = 0
for (const a of articles) {
  const title = String(a.title ?? '').trim()
  if (!title) continue
  const slug = slugify(title)
  const publishedAt = a.date ? new Date(String(a.date)).toISOString() : null
  const data: Record<string, unknown> = {
    title,
    slug,
    category: a.category != null ? String(a.category) : null,
    publishedAt,
    readTime: a.readTime != null ? String(a.readTime) : null,
    excerpt: a.excerpt != null ? String(a.excerpt) : null,
    image: a.image != null ? String(a.image) : null,
    contentHtml: a.content != null ? String(a.content).trim() : null,
    featured: Boolean(a.featured),
  }
  if (authorId != null) data['author'] = authorId
  const doc = (await upsertBlog(slug, data)) as { id: number | string }
  console.log(`blog ${slug} (${String(a.date).slice(0, 18)}) -> ${doc.id}`)
  n++
}
console.log(`\nseeded ${n} blog articles from blog.html`)
await payload.db?.destroy()
process.exit(0)