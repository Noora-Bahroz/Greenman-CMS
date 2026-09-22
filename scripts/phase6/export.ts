import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

process.env.PAYLOAD_SECRET ??= 'dev-only-secret-32chars-minimum-budget-check'
process.env.DATABASE_URI = process.env.P5_DB_URI ?? 'file:payload-phase5-test.db'

const INSTALL = process.argv.includes('--install')

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')

const payload = await getPayload({ config })

const SRC_DIR: string =
  process.env.GREENMAN_DATA_DIR ?? 'D:\\greenman-master\\greenman-master\\data'
const OUT_DIR = path.join(import.meta.dirname, 'out', 'data')

// ---------------- fetch helpers ----------------
async function fetchAll(collection: string) {
  const docs: Record<string, any>[] = []
  let page = 1
  for (;;) {
    const res = await payload.find({
      collection: collection as never,
      page,
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    docs.push(...(res.docs as Record<string, any>[]))
    if (page * 100 >= res.totalDocs) break
    page++
  }
  return docs
}

function stripMeta(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripMeta)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(o)) {
      if (k === '_id' || k === '_order' || k === 'id') continue
      out[k] = stripMeta(val)
    }
    return out
  }
  return v
}

// rebuild a spec value that was JSON-stringified by the model (object/array)
function revive(specValue: unknown): unknown {
  if (typeof specValue !== 'string') return specValue
  const t = specValue.trim()
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      /* keep raw string */
    }
  }
  return specValue
}

function specDict(rows: any[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const r of rows || []) out[String(r.key)] = revive(r.value)
  return out
}
function specArr(rows: any[]): unknown[] {
  return (rows || []).map((r) => revive(r.value))
}
function specVal(rows: any[], key: string): unknown {
  const r = (rows || []).find((x) => x.key === key)
  return r ? revive(r.value) : undefined
}
function imagesDict(rows: any[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const r of rows || []) {
    const p = rowPath(r)
    if (!(String(r.kind) in out) && p) out[String(r.kind)] = p
  }
  return out
}
function imagesPaths(rows: any[]): string[] {
  return (rows || []).map(rowPath).filter((p): p is string => !!p)
}
function imagePath(rows: any[], kind: string): string | undefined {
  const r = (rows || []).find((x) => x.kind === kind)
  return r ? rowPath(r) : undefined
}
function numeric(v: unknown): unknown {
  if (v == null || v === '') return v
  const s = String(v).trim()
  if (/^[+-]?\d*\.?\d+$/.test(s)) return Number(s)
  return v
}
function fmtDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// deq: deep equality, OBJECTS key-order-insensitive, arrays order-sensitive
function deq(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((x, i) => deq(x, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a as Record<string, unknown>).sort()
    const kb = Object.keys(b as Record<string, unknown>).sort()
    if (ka.length !== kb.length) return false
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return false
      if (!deq((a as any)[ka[i]], (b as any)[kb[i]])) return false
    }
    return true
  }
  return false
}

// ---------------- data ----------------
const cats = await fetchAll('categories')
const fams = await fetchAll('families')
const prods = await fetchAll('products')
const vars = await fetchAll('variants')
const blogs = await fetchAll('blogs')
const mediaDocs = await fetchAll('media')

// ---------------- media helpers ----------------
// An admin-picked library image (images[].media / blogs.coverImage) is
// published as a static path under the website's assets/img/ folder — the same
// style of path the site has always used. Nothing else in the pipeline changes.
const mediaById = new Map(mediaDocs.map((m) => [String(m.id), m]))
function mediaStaticPath(id: unknown): string | undefined {
  if (id == null) return undefined
  const m = mediaById.get(String(id))
  if (!m) return undefined
  const fname: string | undefined = m.filename ?? String(m.url ?? '').split('/').pop()
  return fname ? `assets/img/${fname}` : undefined
}
// The image value for one image-array row: library picker wins, else the raw path.
function rowPath(r: any): string | undefined {
  const viaMedia = mediaStaticPath(r?.media)
  if (viaMedia) return viaMedia
  return r?.path ? String(r.path) : undefined
}

const catById = new Map(cats.map((c) => [String(c.id), c]))
const catBySlug = new Map(cats.map((c) => [String(c.slug), c]))
const famByCode = new Map(fams.map((f) => [String(f.code), f]))
// familial product per family (product whose source file matches the family file)
const famProduct = new Map<string, any>()
for (const p of prods) {
  const fid = String(p.family ?? '')
  const cur = famProduct.get(fid)
  if (!cur || p.file === cur.file) famProduct.set(fid, p)
}
const prodsOfFile = (file: string) => prods.filter((p) => p.file === file)
const famsOfFile = (file: string) =>
  fams.filter((f) => f.file === file).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
const varsOfFam = (famCode: string) => {
  const fid = famByCode.get(famCode)?.id
  return vars.filter((v) => String(v.family) === String(fid)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

const SPEC_FILES = new Set([
  'anchor-catalog.json',
  'strut-channel-catalog.json',
  'c-channel-catalog.json',
  'fasteners-catalog.json',
  'greengrip-ggip-catalog.json',
  'greengrip-ggsh-catalog.json',
  'products.json',
])

const generated: Record<string, unknown> = {}

// ---------------- anchors ----------------
function buildAnchors(file: string): unknown {
  return {
    products: famsOfFile(file).map((f) => {
      const rows = stripMeta(f.specifications ?? []) as any[]
      const variants = varsOfFam(f.code).map((v) => {
        const attrs = (v.attributes ?? {}) as Record<string, unknown>
        const ordered: Record<string, unknown> = {
          productCode: v.code,
          size: v.size ?? undefined,
          packSize: numeric(v.packSize) ?? undefined,
        }
        const known = new Set(['drillDiameter', 'drillHoleDepth', 'maxFixtureThickness', 'effAnchorageDepth', 'installationTorque', 'tensileLoadKN', 'shearLoadKN'])
        for (const k of known) if (attrs[k] != null) ordered[k] = attrs[k]
        for (const [k, val] of Object.entries(attrs)) {
          if (!(k in ordered)) ordered[k] = val
        }
        return ordered
      })
      const o: Record<string, unknown> = {
        productCode: f.code,
        name: f.productName ?? f.name,
        description: f.shortDescription ?? undefined,
        specifications: specDict(rows),
        images: imagesDict(stripMeta(f.images ?? []) as any[]),
        variants,
      }
      if ((o.description as unknown) === undefined) delete o['description']
      return o
    }),
  }
}

// ---------------- profiles (strut / c-channel) ----------------
function buildProfiles(file: string): unknown {
  const famsF = famsOfFile(file)
  const f0 = famsF[0]
  const catSlug = String(f0.categoryID).length ? (catById.get(String(f0.categoryID))?.slug ?? '') : ''
  const catDoc = catBySlug.get(catSlug) ?? catBySlug.get(file.startsWith('c-') ? 'c-channels' : 'strut-channels')
  const products = famsF.map((f) => {
    const prod = famProduct.get(String(f.id)) ?? {}
    const rows = stripMeta(f.specifications ?? []) as any[]
    const o: Record<string, unknown> = {
      id: f.code,
      title: f.productName ?? f.name,
      description: f.shortDescription ?? '',
      images: imagesPaths(stripMeta(prod.images ?? f.images ?? []) as any[]),
      specifications: specDict(rows),
      mountingMethod: f.mountingMethod ?? undefined,
      technicalData: prod.technicalData ?? f.technicalData ?? undefined,
      properties: prod.properties ?? undefined,
      loadCases: prod.loadCases ?? undefined,
      page: numeric(f.pdfPage) ?? undefined,
    }
    for (const k of ['mountingMethod', 'technicalData', 'properties', 'loadCases', 'page'])
      if (o[k] === undefined) delete o[k]
    return o
  })
  const o: Record<string, unknown> = {
    category: {
      id: catSlug,
      name: f0?.category ?? undefined,
      badge: f0?.fileBadge ?? catDoc?.badge ?? undefined,
      description: f0?.fileDescription ?? catDoc?.description ?? undefined,
      products,
    },
  }
  for (const k of ['badge', 'description'])
    if ((o.category as any)[k] === undefined) delete (o.category as any)[k]
  return o
}

// ---------------- fasteners ----------------
function buildFasteners(file: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of famsOfFile(file)) {
    const rows = (f.specifications ?? []) as any[]
    const catKey = f.categoryAlias ?? f.category ?? undefined
    const subKey = f.category !== (f.categoryAlias ?? f.category) ? f.category : undefined
    const o: Record<string, unknown> = {
      productCode: f.code,
      productName: f.productName ?? f.name,
      fullName: f.fullName ?? undefined,
      category: catKey,
      subcategory: subKey,
      description: f.shortDescription ?? undefined,
      image: imagePath(f.images ?? [], 'image'),
      technicalDrawing: imagePath(f.images ?? [], 'technicalDrawing'),
      specifications: {
        material: specVal(rows, 'material') ?? undefined,
        finish: specVal(rows, 'finish') ?? undefined,
      },
      products: varsOfFam(f.code).map((v) => {
        const attrs = (v.attributes ?? {}) as Record<string, unknown>
        const fastener = (attrs['fastener'] ?? {}) as Record<string, unknown>
        const row: Record<string, unknown> = {
          productCode: v.code,
          size: v.size ?? undefined,
          maxRecLoads: numeric(v.loadRating) ?? undefined,
        }
        for (const [k, val] of Object.entries(fastener)) {
          if (!(k in row)) row[k] = val
        }
        return row
      }),
    }
    for (const k of ['fullName', 'subcategory', 'description'])
      if (o[k] === undefined) delete o[k]
    for (const k of ['material', 'finish'])
      if ((o.specifications as any)[k] === undefined) delete (o.specifications as any)[k]
    out[String(f.contractKey ?? f.code.toLowerCase())] = o
  }
  return out
}

// ---------------- greengrip ----------------
function greengripFamilyObject(f: any): Record<string, unknown> {
  const rows = (f.specifications ?? []) as any[]
  const o: Record<string, unknown> = {
    productName: f.productName ?? f.name,
    image: imagePath(f.images ?? [], 'image'),
    productRange: f.productRange ?? undefined,
    brand: f.brand ?? undefined,
    pageNumber: f.pdfPage ?? undefined,
    specification: specDict(rows),
    productDefinition: f.definition ?? undefined,
    products: varsOfFam(f.code).map((v) => {
      const attrs = (v.attributes ?? {}) as Record<string, unknown>
      const cr = attrs['clampingRange'] as Record<string, unknown> | undefined
      const dim = attrs['dimensions'] as Record<string, unknown> | undefined
      const extra = (attrs['extra'] ?? {}) as Record<string, unknown>
      const row: Record<string, unknown> = { productCode: v.code }
      if (cr && Object.keys(cr).length) row['clampingRange'] = cr
      if (v.notes != null) row['connectingThread'] = v.notes
      if (dim && Object.keys(dim).length) row['dimensions'] = dim
      for (const [k, val] of Object.entries(extra)) row[k] = val
      if (v.packSize != null) row['packSize'] = v.packSize
      if (v.loadRating != null) row['maxRecLoad'] = v.loadRating
      if (v.weight != null) row['weight'] = v.weight
      return row
    }),
  }
  for (const k of ['productRange', 'brand', 'pageNumber', 'productDefinition'])
    if (o[k] === undefined) delete o[k]
  if (f.extra) Object.assign(o, stripMeta(f.extra) as Record<string, unknown>)
  return o
}

function buildGreengrip(file: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const famsF = famsOfFile(file)
  for (const f of famsF) {
    if (f.contractKey == null) {
      Object.assign(out, greengripFamilyObject(f))
    } else {
      out[String(f.contractKey)] = greengripFamilyObject(f)
    }
  }
  return out
}

// ---------------- accessories ----------------
function buildAccessory(file: string): Record<string, unknown> {
  const f = famsOfFile(file)[0]
  const rows = (f.specifications ?? []) as any[]
  const extraRaw: Record<string, unknown> = f.extra ?? {}
  const extra: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(extraRaw)) {
    if (k === '__specification') continue
    extra[k] = val
  }
  const o: Record<string, unknown> = {
    title: f.name,
    code_prefix: f.codePrefix ?? undefined,
    specification: extraRaw['__specification'] ?? specArr(rows),
    definition: f.definition ?? undefined,
    items: stripMeta(f.images ?? []) as any[],
    table: undefined,
  }
  if (o['code_prefix'] === undefined) delete o['code_prefix']
  if (o['definition'] === undefined) delete o['definition']
  const tables = stripMeta(f.tables ?? []) as any[]
  if (tables.length) {
    o['table'] = tables[0].rows // source tables are ARRAYS of row objects
  } else {
    delete o['table']
  }
  o['items'] = (o['items'] as any[]).map((i) => {
    const it: Record<string, unknown> = {}
    if (i.code != null) it['code'] = i.code
    it['image'] = i.path
    return it
  })
  if (f.pdfPage != null) o['page'] = f.pdfPage
  if (Object.keys(extra).length) Object.assign(o, extra)
  return o
}

// ---------------- products.json ----------------
function buildProductsJson(): Record<string, unknown> {
  const displayColors = prodsOfFile('products.json')
  const display = new Map<string, any[]>()
  for (const p of displayColors) {
    const slug = String(p.categoryId ?? '')
    if (!display.has(slug)) display.set(slug, [])
    display.get(slug)!.push(p)
  }
  const orderOfCat = (slug: string) =>
    Math.min(...(display.get(slug) ?? []).map((p) => p.order ?? 1e9))
  const catSlugs = [...display.keys()].sort((a, b) => orderOfCat(a) - orderOfCat(b))
  const categories = catSlugs.map((slug) => {
    const c = catBySlug.get(slug)
    const products = (display.get(slug) ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((p) => {
        const o: Record<string, unknown> = {
          id: p.sku,
          title: p.productName ?? undefined,
          subtitle: p.subtitle ?? undefined,
          description: p.shortDescription ?? undefined,
          images: imagesPaths(stripMeta(p.images ?? []) as any[]),
          specifications: specDict((p.specifications ?? []) as any[]),
          technicalData: p.technicalData ?? undefined,
          technicalTable: p.technicalTable ?? undefined,
        }
        for (const k of ['title', 'subtitle', 'description', 'technicalData', 'technicalTable'])
          if (o[k] === undefined) delete o[k]
        return o
      })
    const o: Record<string, unknown> = {
      id: slug,
      name: c?.jsonName ?? c?.name ?? undefined,
      badge: c?.jsonBadge ?? undefined,
      catalogPdf: c?.jsonPdf ?? undefined,
      products,
    }
    for (const k of ['name', 'badge', 'catalogPdf'])
      if (o[k] === undefined) delete o[k]
    return o
  })
  return { categories }
}

// ---------------- blog.json ----------------
// A blog is shown on the website when Status != 'draft'. The body shown is:
//   1) the visual rich-text editor (`body`), converted to HTML, OR
//   2) the legacy raw-HTML field (`contentHtml`) when the editor is empty.
function blogBodyHtml(b: Record<string, any>): string | undefined {
  if (b.body && typeof b.body === 'object' && b.body?.root) {
    try {
      const html = convertLexicalToHTML({ data: b.body, disableContainer: true })
      if (html && html.trim().length) return html
    } catch (e) {
      console.warn('[blog] lexical->html conversion failed for', b.id, e)
    }
  }
  return b.contentHtml ?? undefined
}

function buildBlogJson(): Record<string, unknown> {
  const published = blogs.filter((b) => (b.status ?? 'published') !== 'draft')
  const sorted = published
    .slice()
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
  return {
    articles: sorted.map((b, i) => {
      const o: Record<string, unknown> = {
        id: i + 1,
        title: b.title,
        excerpt: b.excerpt ?? undefined,
        category: b.category ?? undefined,
        image: (b.coverImage ? mediaStaticPath(b.coverImage) : undefined) ?? (b.image ?? undefined),
        date: fmtDate(b.publishedAt),
        readTime: b.readTime ?? undefined,
        featured: Boolean(b.featured),
        content: blogBodyHtml(b),
      }
      for (const k of ['excerpt', 'category', 'image', 'date', 'readTime', 'content'])
        if (o[k] === undefined) delete o[k]
      return o
    }),
  }
}

// ---------------- generate ----------------
generated['anchor-catalog.json'] = buildAnchors('anchor-catalog.json')
generated['strut-channel-catalog.json'] = buildProfiles('strut-channel-catalog.json')
generated['c-channel-catalog.json'] = buildProfiles('c-channel-catalog.json')
generated['fasteners-catalog.json'] = buildFasteners('fasteners-catalog.json')
generated['greengrip-ggip-catalog.json'] = buildGreengrip('greengrip-ggip-catalog.json')
generated['greengrip-ggsh-catalog.json'] = buildGreengrip('greengrip-ggsh-catalog.json')
generated['products.json'] = buildProductsJson()
generated['blog.json'] = buildBlogJson()

const accessoryFiles = (await fs.readdir(SRC_DIR))
  .filter((f) => f.endsWith('-catalog.json') && !SPEC_FILES.has(f))
  .sort()
for (const f of accessoryFiles) {
  generated[f] = buildAccessory(f)
}

await fs.mkdir(OUT_DIR, { recursive: true })

// ---------------- fidelity diff ----------------
interface DiffRow {
  file: string
  equal: boolean
  byteEqual: boolean
  detail: string
}
// whitespace-normalized copy (source text() collapses runs at import time)
function wsnorm(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(wsnorm)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = wsnorm(val)
    return out
  }
  if (typeof v === 'string') return v.replace(/\s+/g, ' ').trim()
  return v
}

// drop undefined-valued keys (JSON.stringify does this; deq must too)
function prune(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(prune)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === undefined) continue
      out[k] = prune(val)
    }
    return out
  }
  return v
}

const diffs: DiffRow[] = []
for (const [file, raw] of Object.entries(generated).sort()) {
  const data = prune(raw)
  const outJson = JSON.stringify(data, null, 2) + '\n'
  const outPath = path.join(OUT_DIR, file)
  await fs.writeFile(outPath, outJson, 'utf8')
  let eq = false
  let byteEq = false
  let detail = 'generated (no original to diff)'
  try {
    const originalText = await fs.readFile(path.join(SRC_DIR, file), 'utf8')
    const original = JSON.parse(originalText)
    byteEq = originalText.trim() === outJson.trim()
    eq = deq(original, data)
    if (!eq && deq(wsnorm(original), wsnorm(data))) {
      eq = true
      detail = 'values equal after whitespace normalization'
    } else if (!eq) {
      detail = summarizeDiff(original, data)
    } else if (!byteEq) {
      detail = 'values equal (JSON key/wrapping differences)'
    } else {
      detail = 'identical'
    }
  } catch {
    detail = 'new file (not in source data/)'
  }
  diffs.push({ file, equal: eq, byteEqual: byteEq, detail })
}

function summarizeDiff(orig: unknown, gen: unknown, max = 6): string {
  if (Array.isArray(orig) || Array.isArray(gen)) {
    if (Array.isArray(orig) && Array.isArray(gen)) {
      if (orig.length !== gen.length) return `array length ${orig.length} != ${gen.length}`
      for (let i = 0; i < Math.min(orig.length, max); i++) {
        if (!deq(orig[i], gen[i])) return `array[${i}] differs: ${summarizeDiff(orig[i], gen[i])}`
      }
    } else return 'array/object shape mismatch'
    return 'array differences beyond sample'
  }
  if (orig && gen && typeof orig === 'object' && typeof gen === 'object') {
    const ok = new Set(Object.keys(gen as Record<string, unknown>))
    const missing = Object.keys(orig as Record<string, unknown>).filter((k) => !ok.has(k))
    if (missing.length) return `missing keys: ${missing.slice(0, max).join(', ')}`
    for (const k of Object.keys(gen as Record<string, unknown>)) {
      if (!deq((orig as any)[k], (gen as any)[k]))
        return `key '${k}': ${summarizeDiff((orig as any)[k], (gen as any)[k])}`
    }
  }
  return `value ${JSON.stringify(orig)} != ${JSON.stringify(gen)}`
}

// ---------------- report ----------------
const okCount = diffs.filter((d) => d.equal).length
const bad = diffs.filter((d) => !d.equal)
console.log(`\n===== PHASE 6 EXPORT FIDELITY =====`)
console.log(`files:     ${diffs.length}`)
console.log(`exact:     ${diffs.filter((d) => d.byteEqual).length}`)
console.log(`value-eq:  ${okCount}`)
console.log(`mismatch:  ${bad.length}`)
for (const d of bad) console.log(`  [DIFF] ${d.file}: ${d.detail.slice(0, 160)}`)
for (const d of diffs.filter((x) => !x.byteEqual && x.equal))
  console.log(`  [wrap]  ${d.file}: ${d.detail}`)

const report = {
  generatedAt: new Date().toISOString(),
  dbUri: process.env.DATABASE_URI,
  outDir: OUT_DIR,
  installed: INSTALL,
  files: diffs,
}
const reportPath = path.join(import.meta.dirname, 'fidelity-report.json')
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(`report:   ${reportPath}`)

// ---------------- optional install ----------------
// Copy admin-uploaded media (referenced as assets/img/<file> in the generated
// data) into the website's assets/img/ folder, then install the data files.
const CMS_MEDIA_DIR = path.resolve(process.cwd(), 'media')
async function installMediaFiles() {
  const imgDir = path.resolve(SRC_DIR, '..', 'assets', 'img')
  const seen = new Set<string>()
  const refs = JSON.stringify(generated).match(/assets\/img\/[^"\\]+/g) ?? []
  for (const ref of refs) {
    const fname = ref.split('/').pop()!
    if (!fname || seen.has(fname)) continue
    seen.add(fname)
    const src = path.join(CMS_MEDIA_DIR, fname)
    try {
      const st = await fs.stat(src)
      if (!st.isFile()) continue
      await fs.mkdir(imgDir, { recursive: true })
      await fs.copyFile(src, path.join(imgDir, fname))
      console.log(`[media] copied ${fname} -> ${path.join(imgDir, fname)}`)
    } catch {
      console.warn(`[media] skipped missing file: ${src}`)
    }
  }
}
async function install() {
  await installMediaFiles()
  for (const file of Object.keys(generated)) {
    await fs.copyFile(path.join(OUT_DIR, file), path.join(SRC_DIR, file))
  }
  console.log(`installed ${Object.keys(generated).length} files -> ${SRC_DIR}`)
}
if (INSTALL) await install()

if (payload.db && typeof payload.db.destroy === 'function') await payload.db.destroy()
process.exit(0)