import { promises as fs } from 'node:fs'
import * as path from 'node:path'

process.env.PAYLOAD_SECRET ??= 'dev-only-secret-32chars-minimum-budget-check'
process.env.DATABASE_URI = process.env.P5_DB_URI ?? 'file:payload-phase5-test.db'

const DB_FILE = process.env.P5_DB_URI ?? 'file:payload-phase5-test.db'
const CLEAN = process.argv.includes('--clean')

if (CLEAN) {
  const dbPath = DB_FILE.replace('file:', '')
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const f = dbPath + suffix
    try {
      await fs.access(f)
      await fs.unlink(f)
      console.log(`[clean] removed ${f}`)
    } catch {
      /* not present */
    }
  }
}

const { getPayload } = await import('payload')
const { default: config } = await import('@payload-config')
const { build } = await import('./model')

const payload = await getPayload({ config })
const log = payload.logger.info.bind(payload.logger)

async function upsert<T>(
  collection: string,
  whereKey: string,
  whereVal: string,
  data: Record<string, unknown>
): Promise<T> {
  const found = (await payload.find({
    collection: collection as never,
    where: { [whereKey]: { equals: whereVal } },
    limit: 1,
    overrideAccess: true,
    depth: 0,
  })) as { totalDocs: number; docs: Array<{ id: string }> }
  if (found.totalDocs > 0) {
    return (await payload.update({
      collection: collection as never,
      id: found.docs[0].id,
      data: data as never,
      overrideAccess: true,
    })) as never
  }
  return (await payload.create({
    collection: collection as never,
    data: data as never,
    overrideAccess: true,
  })) as never
}

const model = await build()

console.log('\n===== SOURCE MODEL SUMMARY =====')
for (const r of model.reports) {
  console.log(
    `  ${r.file.padEnd(30)} ${r.shape.padEnd(16)} fam=${String(r.families).padStart(3)} prod=${String(r.products).padStart(3)} var=${String(r.variants).padStart(4)} skip=${String(r.skipped).padStart(3)}`
  )
}
const tFam = model.families.length
const tProd = model.products.length
const tVar = model.variants.length
console.log(`  TOTALS: families=${tFam} products=${tProd} variants=${tVar} skipNotes=${model.skipNotes.length}`)

// ---------- 1) categories ----------
const catId = new Map<string, string>()
for (const c of model.categories) {
  const doc = await upsert<{ id: string }>('categories', 'slug', c.slug, {
    name: c.name,
    slug: c.slug,
    badge: c.badge ?? null,
    sortOrder: c.sortOrder,
    description: c.description ?? null,
    catalogPdfUrl: c.catalogPdf ?? null,
    jsonName: c.jsonName ?? null,
    jsonBadge: c.jsonBadge ?? null,
    jsonPdf: c.jsonPdf ?? null,
  })
  catId.set(c.slug, doc.id)
  log(`category ${c.slug} -> ${doc.id}`)
}

// ---------- 2) families ----------
const famId = new Map<string, string>()
for (const f of model.families) {
  const data: Record<string, unknown> = {
    code: f.code,
    name: f.name,
    type: f.type,
    file: f.file,
    contractKey: f.contractKey ?? null,
    fileBadge: f.fileBadge ?? null,
    fileDescription: f.fileDescription ?? null,
    order: f.seq,
    codePrefix: f.codePrefix ?? null,
    extra: f.extra ?? null,
    productName: f.productName ?? f.name,
    productNameAlias: null,
    category: f.category ?? '',
    categoryAlias: f.categoryAlias ?? null,
    fullName: f.fullName ?? null,
    shortDescription: f.shortDescription ?? null,
    definition: f.definition ?? null,
    brand: f.brand ?? null,
    productRange: f.productRange ?? null,
    pdfPage: f.pdfPage ?? null,
    mountingMethod: f.mountingMethod ?? null,
    technicalData: f.technicalData ?? null,
    specifications: f.specifications.map((s) => ({
      key: s.key,
      value: s.value ?? null,
      unit: s.unit ?? null,
    })),
    images: f.images.map((img) => ({ kind: img.kind, path: img.path, code: img.code ?? null })),
    tables: f.tables.map((t) => ({
      id: `${f.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tbl`,
      label: t.label ?? null,
      columns: t.columns.map((c) => ({ column: c })),
      rows: t.rows,
    })),
  }
  if (catId.has(f.categoryId)) data['categoryID'] = catId.get(f.categoryId)
  const doc = await upsert<{ id: string }>('families', 'code', f.code, data)
  famId.set(f.code, doc.id)
  log(`family ${f.code} (${f.type}) -> ${doc.id} [${f.variants.length} variants]`)
}

// ---------- 3) products ----------
const prodId = new Map<string, string>()
for (const p of model.products) {
  const data: Record<string, unknown> = {
    sku: p.sku,
    file: p.file,
    subtitle: p.subtitle ?? null,
    categoryId: p.categoryId ?? null,
    order: p.order ?? null,
    productName: p.productName ?? p.sku,
    description: p.description ?? p.shortDescription ?? null,
    shortDescription: p.shortDescription ?? null,
    mountingMethod: p.mountingMethod ?? null,
    technicalData: p.technicalData ?? null,
    technicalTable: p.technicalTable ?? null,
    properties: p.properties ?? null,
    loadCases: p.loadCases ?? null,
    specifications: p.specifications.map((s) => ({
      key: s.key,
      value: s.value ?? null,
      unit: s.unit ?? null,
    })),
    images: p.images.map((img) => ({ kind: img.kind, path: img.path, code: img.code ?? null })),
  }
  if (p.family && famId.has(p.family)) data['family'] = famId.get(p.family)
  const famName = p.family && famId.has(p.family) ? p.family : '?'
  const doc = await upsert<{ id: string }>('products', 'sku', p.sku, data)
  prodId.set(p.sku, doc.id)
  log(`product ${p.sku} (family=${famName}) -> ${doc.id}`)
}

// ---------- 4) variants ----------
const vOrder = new Map<string, number>()
for (const v of model.variants) {
  const data: Record<string, unknown> = {
    sku: v.sku,
    file: v.file,
    code: v.code,
    order: vOrder.get(v.productSku) ?? 0,
    size: v.size ?? null,
    packSize: v.packSize ?? null,
    unit: v.unit ?? 'pcs',
    weight: v.weight ?? null,
    loadRating: v.loadRating ?? null,
    notes: v.notes ?? null,
    attributes: v.attributes ?? null,
  }
  if (famId.has(v.family)) data['family'] = famId.get(v.family)
  if (prodId.has(v.productSku)) data['product'] = prodId.get(v.productSku)
  vOrder.set(v.productSku, (vOrder.get(v.productSku) ?? 0) + 1)
  const doc = await upsert<{ id: string }>('variants', 'sku', v.sku, data)
  log(`variant ${v.sku} -> ${doc.id}`)
}

// ---------- 5) specification rows (family-level) ----------
const specJobs: Promise<unknown>[] = []
for (const f of model.families) {
  const fid = famId.get(f.code)
  if (!fid) continue
  const existing = await payload.find({
    collection: 'specifications',
    where: { family: { equals: fid } },
    limit: 1000,
    overrideAccess: true,
    depth: 0,
  })
  for (const old of existing.docs) {
    await payload.delete({ collection: 'specifications', id: old.id, overrideAccess: true })
  }
  f.specifications.forEach((s, i) => {
    specJobs.push(
      payload.create({
        collection: 'specifications',
        data: {
          family: fid as never,
          key: s.key,
          value: s.value ?? '',
          unit: s.unit ?? '',
          order: i,
          fullCopy: s.value ?? '',
        },
        overrideAccess: true,
      })
    )
  })
}
await Promise.all(specJobs)
const specRows = specJobs.length

// ---------- manifest ----------
const manifest = {
  generatedAt: new Date().toISOString(),
  dbUri: DB_FILE,
  model: {
    categories: model.categories.length,
    families: tFam,
    products: tProd,
    variants: tVar,
    specRoots: tFam + tProd,
  },
  perFile: model.reports,
  skipNotes: model.skipNotes,
}
const out = path.join(import.meta.dirname, 'manifest.json')
await fs.writeFile(out, JSON.stringify(manifest, null, 2), 'utf8')

console.log('\n===== IMPORT COMPLETE =====')
console.log(`categories: ${model.categories.length}`)
console.log(`families:   ${tFam}`)
console.log(`products:   ${tProd}`)
console.log(`variants:   ${tVar}`)
console.log(`spec rows:  ${specRows}`)
console.log(`skip notes: ${model.skipNotes.length}`)
console.log(`manifest:   ${out}`)

await Promise.all([])
process.exit(0)