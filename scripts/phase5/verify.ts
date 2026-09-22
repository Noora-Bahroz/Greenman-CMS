import { promises as fs } from 'node:fs'
import * as path from 'node:path'

process.env.PAYLOAD_SECRET ??= 'dev-only-secret-32chars-minimum-budget-check'
process.env.DATABASE_URI = process.env.P5_DB_URI ?? 'file:payload-phase5-test.db'

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')
const { build, CAT_NAMES } = await import('./model')

const payload = await getPayload({ config })

function stable(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (Array.isArray(v)) return `[${v.map((x) => stable(x)).join(',')}]`
  if (typeof v === 'object') {
    const keys = Object.keys(v as Record<string, unknown>).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(',')}}`
  }
  return JSON.stringify(v)
}

// Payload adds _id/_order/id to array rows; normalize to source-shaped sets.
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
function setOf(v: unknown): string[] {
  const cleaned = stripMeta(v)
  return (cleaned as unknown[]).map((x) => stable(x)).sort()
}
function cmpFamArrays(
  fcode: string,
  field: string,
  cmsRow: unknown,
  exp: unknown
) {
  const a = setOf(cmsRow)
  const b = setOf(exp)
  if (JSON.stringify(a) !== JSON.stringify(b))
    fail(`family ${fcode}: ${field} mismatch`)
}

async function fetchAll(collection: string, where?: Record<string, unknown>) {
  const docs: unknown[] = []
  let page = 1
  for (;;) {
    const res = await payload.find({
      collection: collection as never,
      where: where as never,
      page,
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    docs.push(...res.docs)
    if (page * 100 >= res.totalDocs) break
    page++
  }
  return { docs, total: docs.length }
}

const model = await build()

// Pre-index expected
const expCat = new Map<string, string>() // slug -> sortOrder key stable
const expFam = new Map(model.families.map((f) => [f.code, f]))
const expProd = new Map(model.products.map((p) => [p.sku, p]))
const expVar = new Map(model.variants.map((v) => [v.sku, v]))
const expSpecCount = new Map(model.families.map((f) => [f.code, f.specifications.length]))

// Index CMS (in-memory compare)
const cmsCats = (await fetchAll('categories')).docs as Record<string, unknown>[]
const cmsFams = (await fetchAll('families')).docs as Record<string, unknown>[]
const cmsProds = (await fetchAll('products')).docs as Record<string, unknown>[]
const cmsVars = (await fetchAll('variants')).docs as Record<string, unknown>[]
const cmsSpecs = (await fetchAll('specifications')).docs as Record<string, unknown>[]

const famByCode = new Map(cmsFams.map((d) => [String(d['code']), d]))
const catBySlug = new Map(cmsCats.map((d) => [String(d['slug']), d]))
const prodBySku = new Map(cmsProds.map((d) => [String(d['sku']), d]))
const varBySku = new Map(cmsVars.map((d) => [String(d['sku']), d]))
const specsByFam = new Map<string, Record<string, unknown>[]>()
for (const s of cmsSpecs) {
  const fid = String(s['family'])
  if (!specsByFam.has(fid)) specsByFam.set(fid, [])
  specsByFam.get(fid)!.push(s)
}

const failures: string[] = []
const fail = (msg: string) => failures.push(msg)

// ---------- 1) top-level counts ----------
console.log(`CMS totals: categories=${cmsCats.length} families=${cmsFams.length} products=${cmsProds.length} variants=${cmsVars.length} specRows=${cmsSpecs.length}`)
if (cmsCats.length !== model.categories.length)
  fail(`category count: CMS ${cmsCats.length} != model ${model.categories.length}`)
if (cmsFams.length !== model.families.length)
  fail(`family count: CMS ${cmsFams.length} != model ${model.families.length}`)
if (cmsProds.length !== model.products.length)
  fail(`product count: CMS ${cmsProds.length} != model ${model.products.length}`)
if (cmsVars.length !== model.variants.length)
  fail(`variant count: CMS ${cmsVars.length} != model ${model.variants.length}`)

// ---------- 2) categories ----------
for (const c of model.categories) {
  const row = catBySlug.get(c.slug)
  if (!row) {
    fail(`category missing: ${c.slug}`)
    continue
  }
  if (String(row['name']) !== c.name) fail(`category ${c.slug}: name '${row['name']}' != '${c.name}'`)
  if (String(row['sortOrder'] ?? '') !== String(c.sortOrder))
    fail(`category ${c.slug}: sortOrder ${row['sortOrder']} != ${c.sortOrder}`)
  // description == model value ONLY if model set one
  if (c.description != null && String(row['description'] ?? '') !== c.description)
    fail(`category ${c.slug}: description mismatch`)
}

// ---------- 3) families ----------
for (const f of model.families) {
  const row = famByCode.get(f.code)
  if (!row) {
    fail(`family missing: ${f.code}`)
    continue
  }
  const j = (r: unknown) => String(r ?? '').trim()
  if (row['type'] !== f.type) fail(`family ${f.code}: type ${row['type']} != ${f.type}`)
  if (j(row['name']) !== j(f.name)) fail(`family ${f.code}: name '${row['name']}' != '${f.name}'`)
  if (j(row['category']) !== j(f.category ?? CAT_NAMES[f.categoryId] ?? ''))
    fail(`family ${f.code}: category '${row['category']}' != '${f.category}'`)
  if (j(row['productName']) !== j(f.productName ?? f.name))
    fail(`family ${f.code}: productName '${row['productName']}' != '${f.productName ?? f.name}'`)
  if (j(row['categoryAlias']) !== j(f.categoryAlias ?? ''))
    fail(`family ${f.code}: categoryAlias mismatch`)
  if (j(row['fullName']) !== j(f.fullName ?? '')) fail(`family ${f.code}: fullName mismatch`)
  if (j(row['shortDescription']) !== j(f.shortDescription ?? ''))
    fail(`family ${f.code}: shortDescription mismatch`)
  if (j(row['definition']) !== j(f.definition ?? '')) fail(`family ${f.code}: definition mismatch`)
  if (j(row['brand']) !== j(f.brand ?? '')) fail(`family ${f.code}: brand mismatch`)
  if (j(row['pdfPage']) !== j(f.pdfPage ?? '')) fail(`family ${f.code}: pdfPage mismatch`)
  if (stable(row['technicalData'] ?? null) !== stable(f.technicalData ?? null))
    fail(`family ${f.code}: technicalData mismatch`)
  cmpFamArrays(f.code, 'specifications', row['specifications'], f.specifications)
  cmpFamArrays(f.code, 'images', row['images'], f.images)
  if (row['tables']) {
    const expTables = f.tables.map((t) => ({
      label: t.label ?? '',
      columns: t.columns.map((c) => ({ column: c })),
      rows: t.rows,
    }))
    cmpFamArrays(f.code, 'tables', row['tables'], expTables)
  }
  const expCatId = catBySlug.get(f.categoryId)?.['id']
  if (expCatId && row['categoryID'] !== expCatId)
    fail(`family ${f.code}: categoryID ${row['categoryID']} != ${expCatId}`)
}

// ---------- 4) products ----------
for (const p of model.products) {
  const row = prodBySku.get(p.sku)
  if (!row) {
    fail(`product missing: ${p.sku}`)
    continue
  }
  const expFid = p.family ? famByCode.get(p.family)?.['id'] : null
  if (expFid && row['family'] !== expFid)
    fail(`product ${p.sku}: family rel ${row['family']} != ${expFid} (${p.family})`)
  if (stable(row['technicalData'] ?? null) !== stable(p.technicalData ?? null))
    fail(`product ${p.sku}: technicalData mismatch`)
  if (stable(row['technicalTable'] ?? null) !== stable(p.technicalTable ?? null))
    fail(`product ${p.sku}: technicalTable mismatch`)
  if (stable(row['properties'] ?? null) !== stable(p.properties ?? null))
    fail(`product ${p.sku}: properties mismatch`)
  if (stable(row['loadCases'] ?? null) !== stable(p.loadCases ?? null))
    fail(`product ${p.sku}: loadCases mismatch`)
  cmpFamArrays(`product ${p.sku}`, 'images', row['images'], p.images)
  cmpFamArrays(`product ${p.sku}`, 'specifications', row['specifications'], p.specifications)
}

// ---------- 5) variants ----------
for (const v of model.variants) {
  const row = varBySku.get(v.sku)
  if (!row) {
    fail(`variant missing: ${v.sku}`)
    continue
  }
  if (String(row['code'] ?? '') !== v.code) fail(`variant ${v.sku}: code '${row['code']}' != '${v.code}'`)
  if (String(row['size'] ?? '') !== String(v.size ?? '')) fail(`variant ${v.sku}: size '${row['size']}' != '${v.size}'`)
  const expUnit = v.unit ?? 'pcs'
  if (String(row['unit'] ?? '') !== expUnit) fail(`variant ${v.sku}: unit '${row['unit']}' != '${expUnit}'`)
  if (String(row['packSize'] ?? '') !== String(v.packSize ?? ''))
    fail(`variant ${v.sku}: packSize '${row['packSize']}' != '${v.packSize}'`)
  if (String(row['loadRating'] ?? '') !== String(v.loadRating ?? ''))
    fail(`variant ${v.sku}: loadRating '${row['loadRating']}' != '${v.loadRating}'`)
  if (v.weight != null && Number(row['weight']) !== v.weight)
    fail(`variant ${v.sku}: weight ${row['weight']} != ${v.weight}`)
  if (stable(row['attributes'] ?? null) !== stable(v.attributes))
    fail(`variant ${v.sku}: attributes mismatch
  expected: ${stable(v.attributes)}
  got:      ${stable(row['attributes'] ?? null)}`)
  if (v.productSku && prodBySku.get(v.productSku)) {
    const expPid = prodBySku.get(v.productSku)!['id']
    if (row['product'] !== expPid) fail(`variant ${v.sku}: product rel ${row['product']} != ${expPid}`)
  }
}

// ---------- 6) specification rows ----------
for (const f of model.families) {
  const fid = famByCode.get(f.code)?.['id'] as number | string | undefined
  if (fid == null) continue
  const rows = specsByFam.get(String(fid)) ?? []
  const expect = expSpecCount.get(f.code) ?? 0
  if (rows.length !== expect) {
    fail(`family ${f.code}: spec rows ${rows.length} != expected ${expect}`)
    continue
  }
  const gotKeys = rows.map((r) => `${r['key']}|${r['value']}`).sort()
  const expKeys = f.specifications.map((s) => `${s.key}|${s.value ?? ''}`).sort()
  const ga = JSON.stringify(gotKeys)
  const ea = JSON.stringify(expKeys)
  if (ga !== ea) fail(`family ${f.code}: spec key/value set mismatch`)
}

// ---------- report ----------
console.log(`\nfailures: ${failures.length}`)
const report = {
  generatedAt: new Date().toISOString(),
  dbUri: process.env.DATABASE_URI,
  cms: {
    categories: cmsCats.length,
    families: cmsFams.length,
    products: cmsProds.length,
    variants: cmsVars.length,
    specRows: cmsSpecs.length,
  },
  model: {
    categories: model.categories.length,
    families: model.families.length,
    products: model.products.length,
    variants: model.variants.length,
  },
  ok: failures.length === 0,
  failures,
}
const out = path.join(import.meta.dirname, 'verify-report.json')
await fs.writeFile(out, JSON.stringify(report, null, 2), 'utf8')
console.log(`report:   ${out}`)
for (const f of failures.slice(0, 60)) console.log(`  FAIL ${f}`)
if (failures.length > 60) console.log(`  ... and ${failures.length - 60} more`)
process.exit(failures.length === 0 ? 0 : 1)