import { promises as fs } from 'node:fs'
import * as path from 'node:path'

export type FType = 'PROFILE' | 'ANCHOR' | 'FASTENER' | 'CLAMP' | 'ACCESSORY'

export interface MImage {
  kind: string
  path: string
  code?: string | null
}
export interface MSpec {
  key: string
  value: string
  unit?: string | null
}
export interface MTable {
  id: string
  label?: string | null
  columns: string[]
  rows: Record<string, unknown>[]
}
export interface MVariant {
  file: string
  sku: string
  code: string
  size?: string | null
  packSize?: string | null
  unit?: string | null
  weight?: number | null
  loadRating?: string | null
  notes?: string | null
  attributes: Record<string, unknown>
  family: string
  productSku: string
}
export interface MProduct {
  file: string
  sku: string
  productName?: string | null
  subtitle?: string | null
  categoryId?: string | null
  order?: number | null
  shortDescription?: string | null
  description?: string | null
  pageNumber?: string | null
  images: MImage[]
  specifications: MSpec[]
  technicalData?: unknown | null
  technicalTable?: unknown | null
  properties?: unknown | null
  loadCases?: unknown | null
  mountingMethod?: string | null
  family: string | null
}
export interface MFam {
  file: string
  categoryId: string
  code: string
  name: string
  type: FType
  seq: number
  codePrefix?: string | null
  extra?: Record<string, unknown> | null
  category?: string | null
  categoryAlias?: string | null
  fileBadge?: string | null
  fileDescription?: string | null
  contractKey?: string | null
  shortDescription?: string | null
  definition?: string | null
  fullName?: string | null
  productName?: string | null
  productRange?: string | null
  brand?: string | null
  pdfPage?: string | null
  mountingMethod?: string | null
  technicalData?: unknown | null
  specifications: MSpec[]
  images: MImage[]
  tables: MTable[]
  product: MProduct
  variants: MVariant[]
}
export interface MCategory {
  slug: string
  name: string
  badge?: string | null
  description?: string | null
  catalogPdf?: string | null
  sortOrder: number
  file?: string | null
  jsonName?: string | null
  jsonBadge?: string | null
  jsonPdf?: string | null
}
export interface SkipNote {
  file: string
  family?: string | null
  reason: string
}
export interface FileReport {
  file: string
  shape: string
  categories: number
  families: number
  products: number
  variants: number
  skipped: number
}
export interface Model {
  categories: MCategory[]
  families: MFam[]
  products: MProduct[]
  variants: MVariant[]
  skipNotes: SkipNote[]
  reports: FileReport[]
}

export const DATA_DIR: string =
  process.env.GREENMAN_DATA_DIR ?? 'D:\\greenman-master\\greenman-master\\data'

export const CAT_NAMES: Record<string, string> = {
  'metal-anchors': 'Metal Anchors',
  'strut-channels': 'GM41 Strut Channel Profiles',
  'c-channels': 'C Channel Profiles',
  'fasteners-general': 'Fasteners',
  'pipe-clamps-and-accessories': 'Clamps & Accessories',
}
const SORT: Record<string, number> = {
  'metal-anchors': 1,
  'strut-channels': 2,
  'c-channels': 3,
  'fasteners-general': 4,
  'pipe-clamps-and-accessories': 5,
}

const clean = (v: unknown): string =>
  v == null ? '' : String(v).replace(/\s+/g, ' ').trim()
const text = (v: unknown): string | null => {
  const s = clean(v)
  return s ? s : null
}
const num = (v: unknown): number | null => {
  if (v == null) return null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s.replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : null
}
const normAlnum = (v: unknown): string =>
  clean(v).toUpperCase().replace(/[^A-Z0-9]/g, '')

function flattenSpecs(spec: unknown): MSpec[] {
  if (!spec || typeof spec !== 'object') return []
  const out: MSpec[] = []
  if (Array.isArray(spec)) {
    for (const s of spec) {
      if (typeof s === 'string') {
        if (clean(s)) out.push({ key: 'note', value: clean(s), unit: null })
        continue
      }
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>
        const key = text(o.key ?? o.name ?? o.label ?? o.specification) ?? ''
        const value = text(o.value ?? o.detail ?? o.note) ?? ''
        if (key || value) out.push({ key, value, unit: text(o.unit) ?? null })
      }
    }
    return out
  }
  for (const [k, v] of Object.entries(spec as Record<string, unknown>)) {
    if (v == null) continue
    const value =
      typeof v === 'string' || typeof v === 'number' ? clean(v) : JSON.stringify(v)
    out.push({ key: k, value, unit: null })
  }
  return out
}

function imagesFromDict(img: unknown, code: string | null): MImage[] {
  if (!img || typeof img !== 'object' || Array.isArray(img)) return []
  const out: MImage[] = []
  for (const [k, v] of Object.entries(img as Record<string, unknown>)) {
    const p = text(v)
    if (p) out.push({ kind: k, path: p, code })
  }
  return out
}

function imagesFromArray(
  arr: unknown,
  kind: string,
  code: string | null
): MImage[] {
  if (!Array.isArray(arr)) return []
  const out: MImage[] = []
  for (const u of arr) {
    const p = text(u)
    if (p) out.push({ kind, path: p, code })
  }
  return out
}

interface Ctx {
  file: string
  categoryId: string
  note: (family: string | null, reason: string) => void
}

// monotonic parse-order counter: preserves intra-file ordering across the model
let SEQ = 0

interface Sink {
  families: MFam[]
  products: MProduct[]
  variants: MVariant[]
}

function newFamily(
  ctx: Ctx,
  code: string,
  name: string,
  type: FType,
  init: Partial<MFam>
): MFam {
  const fam: MFam = {
    file: ctx.file,
    categoryId: ctx.categoryId,
    code,
    name,
    type,
    seq: ++SEQ,
    category: CAT_NAMES[ctx.categoryId] ?? null,
    specifications: [],
    images: [],
    tables: [],
    product: {
      file: ctx.file,
      sku: code,
      productName: name,
      specifications: [],
      images: [],
      family: code,
    },
    variants: [],
    ...init,
  }
  fam.product.order = fam.seq
  fam.product.family = code
  return fam
}

function emit(sink: Sink, fams: MFam[]) {
  for (const fam of fams) {
    sink.families.push(fam)
    sink.products.push(fam.product)
    sink.variants.push(...fam.variants)
  }
}

// ---------- Shape B: anchor-catalog.json ----------
function parseAnchors(ctx: Ctx, root: Record<string, unknown>): MFam[] {
  const fams: MFam[] = []
  const list = (root['products'] as unknown[]) ?? []
  for (const p of list as Record<string, unknown>[]) {
    const code = text(p['productCode'])
    if (!code) {
      ctx.note(null, 'anchor product without productCode')
      continue
    }
    const name = text(p['name'] ?? p['productName']) ?? code
    const specs = flattenSpecs(p['specifications'])
    const images = imagesFromDict(p['images'], code).concat(
      imagesFromArray(p['image'], 'main', code)
    )
    const fam = newFamily(ctx, code, name, 'ANCHOR', {
      shortDescription: text(p['description']),
      productName: name,
      specifications: specs,
      images,
      technicalData: (p['technicalData'] as unknown) ?? null,
    })
    fam.product.shortDescription = fam.shortDescription
    fam.product.specifications = specs
    fam.product.images = images
    fam.pdfPage = text(p['pdfPage'] ?? p['pageNumber'])
    const variants = (p['variants'] as unknown[]) ?? []
    for (const v of variants as Record<string, unknown>[]) {
      const vcode = text(v['productCode'])
      if (!vcode) {
        ctx.note(code, `anchor ${code}: variant without productCode`)
        continue
      }
      const attr: Record<string, unknown> = { ...v }
      for (const k of ['productCode', 'size', 'packSize', 'weight', 'loadRating', 'image', 'notes'])
        delete attr[k]
      fam.variants.push({
        file: ctx.file,
        sku: `${code}/${vcode}`,
        code: vcode,
        size: text(v['size']),
        packSize: text(v['packSize'] ?? v['packing']),
        unit: null,
        weight: num(v['weight']),
        loadRating: text(v['loadRating']),
        notes: text(v['notes']),
        attributes: attr,
        family: code,
        productSku: code,
      })
    }
    fams.push(fam)
  }
  return fams
}

// ---------- Shape C: strut / c-channel ----------
function parseProfiles(ctx: Ctx, root: Record<string, unknown>): MFam[] {
  const fams: MFam[] = []
  const cat = (root['category'] as Record<string, unknown>) ?? {}
  const list = (cat['products'] as unknown[]) ?? []
  for (const p of list as Record<string, unknown>[]) {
    const code = text(p['id'] ?? p['productCode'])
    if (!code) {
      ctx.note(null, 'profile product without id')
      continue
    }
    const name = text(p['title'] ?? p['name']) ?? code
    const specs = flattenSpecs(p['specifications'])
    const images = imagesFromArray(p['images'], 'image', code)
    const fam = newFamily(ctx, code, name, 'PROFILE', {
      shortDescription: text(p['description']),
      productName: name,
      category: text(cat['name']) ?? CAT_NAMES[ctx.categoryId] ?? null,
      fileBadge: cat['badge'] != null && clean(cat['badge']) ? String(cat['badge']) : null,
      fileDescription: cat['description'] != null && clean(cat['description']) ? String(cat['description']) : null,
      mountingMethod: text(p['mountingMethod']),
      technicalData: (p['technicalData'] as unknown) ?? null,
      specifications: specs,
      images,
    })
    fam.pdfPage = text(p['page'])
    fam.product.shortDescription = fam.shortDescription
    fam.product.specifications = specs
    fam.product.images = images
    fam.product.technicalData = (p['technicalData'] as unknown) ?? null
    fam.product.technicalTable = (p['technicalTable'] as unknown) ?? null
    fam.product.properties = (p['properties'] as unknown) ?? null
    fam.product.loadCases = (p['loadCases'] as unknown) ?? null
    fam.product.mountingMethod = fam.mountingMethod
    const props = (p['properties'] as Record<string, unknown>) ?? {}
    const idkey = text(props['identification'])
    if (idkey) {
      const attr: Record<string, unknown> = { ...props }
      delete attr['identification']
      delete attr['size']
      fam.variants.push({
        file: ctx.file,
        sku: `${code}/${idkey}`,
        code: idkey,
        size: text(props['size']),
        packSize: null,
        unit: 'm',
        weight: num(props['weight_kg_m'] ?? props['weight']),
        loadRating: text(props['maxRecLoads']),
        notes: text(props['material']),
        attributes: {
          profile: attr,
          loadCases: (p['loadCases'] as unknown) ?? null,
        },
        family: code,
        productSku: code,
      })
    }
    fams.push(fam)
  }
  return fams
}

// ---------- Shape D: fasteners-catalog.json ----------
function parseFasteners(ctx: Ctx, root: Record<string, unknown>): MFam[] {
  const fams: MFam[] = []
  for (const [key, v] of Object.entries(root)) {
    const f = (v as Record<string, unknown>) ?? {}
    if (!Array.isArray(f['products'])) continue
    const code = text(f['productCode']) ?? key.toUpperCase()
    const name = text(f['fullName']) ?? text(f['productName']) ?? code
    const productName = text(f['productName']) ?? name
    const specs = flattenSpecs(f['specifications'])
    const images = imagesFromDict(
      { image: f['image'], technicalDrawing: f['technicalDrawing'] },
      code
    )
    const fam = newFamily(ctx, code, name, 'FASTENER', {
      contractKey: key,
      category: text(f['subcategory'] ?? f['category']),
      categoryAlias: text(f['category']) ?? null,
      fullName: text(f['fullName']) ?? null,
      shortDescription: text(f['description']),
      productName,
      specifications: specs,
      images,
    })
    fam.product.productName = productName
    fam.product.shortDescription = fam.shortDescription
    fam.product.specifications = specs
    fam.product.images = images
    const variants = (f['products'] as unknown[]) ?? []
    for (const p of variants as Record<string, unknown>[]) {
      const vcode = text(p['productCode'])
      if (!vcode) {
        ctx.note(code, `fastener ${code}: product without productCode`)
        continue
      }
      const attr: Record<string, unknown> = { ...p }
      for (const k of ['productCode', 'size', 'packSize', 'maxRecLoads', 'unit'])
        delete attr[k]
      fam.variants.push({
        file: ctx.file,
        sku: `${code}/${vcode}`,
        code: vcode,
        size: text(p['size']),
        packSize: text(p['packSize']),
        unit: text(p['unit']) ?? null,
        weight: num(p['weight']),
        loadRating: text(p['maxRecLoads']),
        notes: null,
        attributes: { fastener: attr },
        family: code,
        productSku: code,
      })
    }
    fams.push(fam)
  }
  return fams
}

// ---------- Shape E: greengrip ----------
function greengripFamily(
  ctx: Ctx,
  code: string,
  f: Record<string, unknown>,
  fams: MFam[],
  origKey: string | null
) {
  const name = text(f['productName']) ?? code
  const specs = flattenSpecs(f['specification'] ?? f['specifications'])
  const images = imagesFromDict({ image: f['image'] }, code)
  const fam = newFamily(ctx, code, name, 'CLAMP', {
    contractKey: origKey,
    productName: name,
    productRange: text(f['productRange']),
    brand: text(f['brand']),
    definition: text(f['productDefinition'] ?? f['definition']),
    // preserve '' pageNumber (present-but-empty, e.g. GGCH) vs null (absent)
    pdfPage:
      f['pageNumber'] == null
        ? null
        : String(f['pageNumber']).trim() === ''
          ? ''
          : text(f['pageNumber']),
    specifications: specs,
    images,
  })
  {
    const modeled = new Set([
      'productName',
      'image',
      'productRange',
      'brand',
      'pageNumber',
      'specification',
      'specifications',
      'productDefinition',
      'definition',
      'products',
    ])
    const extra: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(f)) {
      if (!modeled.has(k)) extra[k] = v
    }
    if (Object.keys(extra).length) fam.extra = extra
  }
  fam.product.productName = name
  fam.product.shortDescription = fam.definition
  fam.product.specifications = specs
  fam.product.images = images
  const variants = (f['products'] as unknown[]) ?? []
  for (const p of variants as Record<string, unknown>[]) {
    const vcode = text(p['productCode'])
    if (!vcode) {
      ctx.note(code, `greengrip ${code}: product without productCode`)
      continue
    }
    const cr = (p['clampingRange'] as Record<string, unknown>) ?? {}
    const dims = (p['dimensions'] as Record<string, unknown>) ?? {}
    const rawSize = p['size']
    const size =
      (typeof rawSize === 'string' || typeof rawSize === 'number' ? text(rawSize) : null) ??
      text(cr['mm'] ?? cr['inch'] ?? cr['DN']) ??
      text(dims['mm'] ?? dims['inch']) ??
      null
    const attr: Record<string, unknown> = { ...p }
    for (const k of [
      'productCode',
      'clampingRange',
      'dimensions',
      'packSize',
      'connectingThread',
      'maxRecLoad',
      'notes',
    ])
      delete attr[k]
    fam.variants.push({
      file: ctx.file,
      sku: `${code}/${vcode}`,
      code: vcode,
      size,
      packSize: text(p['packSize']),
      unit: null,
      weight: num(p['weight']),
      loadRating: text(p['maxRecLoad']),
      notes: text(p['connectingThread']),
      attributes: {
        clampingRange: cr,
        dimensions: dims,
        ...(Object.keys(attr).length ? { extra: attr } : {}),
      },
      family: code,
      productSku: code,
    })
  }
  fams.push(fam)
}

function parseGreengrip(ctx: Ctx, root: Record<string, unknown>): MFam[] {
  const fams: MFam[] = []
  // root itself may be a family ('GreenGrip ... GGIP' with products[])
  if (Array.isArray(root['products']) && text(root['productName'])) {
    const m = /\b([A-Z]{2,6})\s*$/.exec(clean(root['productName']))
    const rootCode = m ? m[1] : ctx.file.replace('greengrip-', '').replace('-catalog.json', '').toUpperCase()
    greengripFamily(ctx, rootCode, root, fams, null)
  }
  for (const [key, v] of Object.entries(root)) {
    const f = (v as Record<string, unknown>) ?? {}
    if (!Array.isArray(f['products'])) continue
    greengripFamily(ctx, key.toUpperCase(), f, fams, key)
  }
  return fams
}

// ---------- Shape A: accessory ----------
function parseAccessory(ctx: Ctx, root: Record<string, unknown>): MFam[] {
  const fams: MFam[] = []
  const title = text(root['title']) ?? ctx.file.replace(/-catalog\.json$/, '').toUpperCase()
  const spec = flattenSpecs(root['specification'])
  const def = text(root['definition'])
  const tablesRaw = (root['table'] as unknown[]) ?? []
  const codes: string[] = []
  for (const row of tablesRaw as Record<string, unknown>[]) {
    const c = text(row['Product Code'])
    if (c) codes.push(normAlnum(c))
  }
  const prefix = text(root['code_prefix'])
  let code = prefix ? prefix.replace(/[^A-Z]/g, '') : ''
  if (!code && codes.length) {
    const counts = new Map<string, number>()
    for (const c of codes) {
      const letters = /^[A-Z]+/.exec(c.replace(/[^A-Z]/g, ' '))?.[0] ?? ''
      if (letters) counts.set(letters, (counts.get(letters) ?? 0) + 1)
    }
    let best = ''
    let bestN = 0
    for (const [k, n] of counts) {
      if (n > bestN || (n === bestN && k.length > best.length)) {
        best = k
        bestN = n
      }
    }
    if (best) code = best
  }
  if (!code) code = title.replace(/[^A-Z]/g, '').slice(0, 6)
  const fam = newFamily(ctx, code, title, 'ACCESSORY', {
    shortDescription: def ?? title,
    definition: def,
    pdfPage: text(root['page']),
    codePrefix: text(root['code_prefix']),
    specifications: spec,
  })
  {
    const modeled = new Set([
      'title',
      'code_prefix',
      'specification',
      'definition',
      'items',
      'table',
      'page',
    ])
    const extra: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(root)) {
      if (!modeled.has(k)) extra[k] = v
    }
    // verbatim specification (shape varies: array | dict) for exact round-trip
    if (root['specification'] != null) extra['__specification'] = root['specification']
    if (Object.keys(extra).length) fam.extra = extra
  }
  fam.product.shortDescription = fam.shortDescription
  fam.product.specifications = spec
  if (Array.isArray(root['items'])) {
    for (const it of root['items'] as Record<string, unknown>[]) {
      const p = text(it['image'])
      if (p)
        fam.images.push({
          kind: text(it['name']) ?? 'gallery',
          path: p,
          code: text(it['code']) ?? null,
        })
    }
    fam.product.images = fam.images
  }
  if (tablesRaw.length) {
    fam.tables.push({
      id: 'spec-table',
      label: title,
      columns: Object.keys((tablesRaw[0] as Record<string, unknown>) ?? {}),
      rows: tablesRaw as Record<string, unknown>[],
    })
  }
  fam.product.technicalTable = fam.tables.length ? (tablesRaw as unknown) : null
  for (const row of tablesRaw as Record<string, unknown>[]) {
    const vcode = text(row['Product Code'])
    if (!vcode) {
      ctx.note(code, `accessory ${code}: table row without Product Code`)
      continue
    }
    let loadRating: string | null = null
    for (const lk of ['Load Isolated', 'Load fixed on profile', 'Load']) {
      const lv = row[lk]
      if (lv != null && clean(lv) && clean(lv) !== '-') {
        loadRating = clean(lv)
        break
      }
    }
    const attr: Record<string, unknown> = { ...row }
    for (const k of ['Product Code', 'Dimensions', 'Weight', 'Load', 'Load Isolated', 'Load fixed on profile'])
      delete attr[k]
    fam.variants.push({
      file: ctx.file,
      sku: `${code}/${vcode}`,
      code: vcode,
      size: text(row['Dimensions'] ?? row['dimensions']),
      packSize: null,
      unit: null,
      weight: num(row['Weight']),
      loadRating,
      notes: null,
      attributes: { generic: attr },
      family: code,
      productSku: code,
    })
  }
  fams.push(fam)
  return fams
}

// ---------- Shape F: products.json (display layer) ----------
function parseProductsJson(
  ctx: Ctx,
  root: Record<string, unknown>,
  famIndex: Map<string, Set<string>>
): { fams: never[]; prods: MProduct[]; catMeta: MCategory[] } {
  const prods: MProduct[] = []
  const catMeta: MCategory[] = []
  let order = 0
  for (const c of root['categories'] as Record<string, unknown>[]) {
    const id = text(c['id'])
    if (!id) continue
    catMeta.push({
      slug: id,
      name: CAT_NAMES[id] ?? text(c['name']) ?? id,
      badge: text(c['badge']) ?? null,
      description: text(c['description']) ?? null,
      catalogPdf: text(c['catalogPdf']) ?? null,
      // products.json display-layer metadata (verbatim, for round-trip):
      jsonName: text(c['name']) ?? CAT_NAMES[id] ?? id,
      jsonBadge: text(c['badge']) ?? null,
      jsonPdf: text(c['catalogPdf']) ?? null,
      sortOrder: SORT[id] ?? 99,
      file: ctx.file,
    })
    const famCodes = famIndex.get(id) ?? new Set<string>()
    const list = (c['products'] as unknown[]) ?? []
    for (const p of list as Record<string, unknown>[]) {
      const psku = text(p['id'])
      if (!psku) {
        ctx.note(null, `products.json ${id}: product without id`)
        continue
      }
      const subtitle = text(p['subtitle']) ?? ''
      const idNorm = normAlnum(psku.replace(/^anchor[-_]/, ''))
      const subNorm = normAlnum(subtitle)
      let match = ''
      for (const fcode of famCodes) {
        if (fcode.length >= 3 && (idNorm.startsWith(fcode) || subNorm.startsWith(fcode))) {
          if (fcode.length > match.length) match = fcode
        }
      }
      const specRows = flattenSpecs(p['specifications'])
      const pImages = imagesFromArray(p['images'], 'image', psku)
      prods.push({
        file: ctx.file,
        sku: psku,
        productName: text(p['title']),
        subtitle: subtitle || null,
        categoryId: id,
        order: order++,
        shortDescription: text(p['description']),
        description: text(p['description']),
        images: pImages,
        specifications: specRows,
        technicalData: (p['technicalData'] as unknown) ?? null,
        technicalTable: (p['technicalTable'] as unknown) ?? null,
        family: match || null,
      })
    }
  }
  return { fams: [], prods, catMeta }
}

export async function build(): Promise<Model> {
  const files = (await fs.readdir(DATA_DIR))
    .filter((f) => f.endsWith('.json'))
    .sort()
  const sink: Sink = { families: [], products: [], variants: [] }
  const catMap = new Map<string, MCategory>()
  const skipNotes: SkipNote[] = []
  const reports: FileReport[] = []

  for (const file of files) {
    const fp = path.join(DATA_DIR, file)
    const root = JSON.parse(await fs.readFile(fp, 'utf-8')) as Record<string, unknown>
    const report: FileReport = {
      file,
      shape: 'p5-unknown',
      categories: 0,
      families: 0,
      products: 0,
      variants: 0,
      skipped: 0,
    }
    const ctx: Ctx = {
      file,
      categoryId: 'none',
      note: (family, reason) => {
        report.skipped++
        skipNotes.push({ file, family, reason })
      },
    }
    const ensureCat = (id: string, meta?: Partial<MCategory>) => {
      if (!catMap.has(id)) {
        catMap.set(id, {
          slug: id,
          name: CAT_NAMES[id] ?? id,
          sortOrder: SORT[id] ?? 99,
          file,
        })
      }
      if (meta) {
        const e = catMap.get(id)!
        if (meta.badge && e.badge == null) e.badge = meta.badge
        if (meta.description && e.description == null) e.description = meta.description
        if (meta.catalogPdf && e.catalogPdf == null) e.catalogPdf = meta.catalogPdf
        if (meta.jsonName && e.jsonName == null) e.jsonName = meta.jsonName
        if (meta.jsonBadge && e.jsonBadge == null) e.jsonBadge = meta.jsonBadge
        if (meta.jsonPdf && e.jsonPdf == null) e.jsonPdf = meta.jsonPdf
      }
    }

    if (file === 'products.json') {
      report.shape = 'display-layer'
      const famIndex = new Map<string, Set<string>>()
      for (const f of sink.families) {
        if (!famIndex.has(f.categoryId)) famIndex.set(f.categoryId, new Set())
        famIndex.get(f.categoryId)!.add(normAlnum(f.code))
      }
      const res = parseProductsJson(ctx, root, famIndex)
      sink.products.push(...res.prods)
      for (const m of res.catMeta) {
        ensureCat(m.slug, m)
        report.categories++
      }
      report.products += sink.products.filter((p) => p.file === file).length
      reports.push(report)
      continue
    }

    let fams: MFam[] = []
    if (file === 'anchor-catalog.json') {
      report.shape = 'anchor-catalog'
      ctx.categoryId = 'metal-anchors'
      ensureCat('metal-anchors')
      fams = parseAnchors(ctx, root)
    } else if (
      file === 'c-channel-catalog.json' ||
      file === 'strut-channel-catalog.json'
    ) {
      const cat = (root['category'] as Record<string, unknown>) ?? {}
      const id = text(cat['id']) ?? (file.includes('c-channel') ? 'c-channels' : 'strut-channels')
      ctx.categoryId = id
      report.shape = 'profile-catalog'
      report.categories++
      ensureCat(id, {
        badge: text(cat['badge']) ?? undefined,
        description: text(cat['description']) ?? undefined,
        catalogPdf: text(cat['catalogPdf']) ?? undefined,
      })
      fams = parseProfiles(ctx, root)
    } else if (file === 'fasteners-catalog.json') {
      report.shape = 'fasteners-catalog'
      ctx.categoryId = 'fasteners-general'
      ensureCat('fasteners-general')
      fams = parseFasteners(ctx, root)
    } else if (file.startsWith('greengrip-')) {
      report.shape = 'greengrip'
      ctx.categoryId = 'pipe-clamps-and-accessories'
      ensureCat('pipe-clamps-and-accessories')
      fams = parseGreengrip(ctx, root)
    } else if (file.endsWith('-catalog.json')) {
      report.shape = 'accessory'
      ctx.categoryId = 'pipe-clamps-and-accessories'
      ensureCat('pipe-clamps-and-accessories')
      fams = parseAccessory(ctx, root)
    } else {
      report.shape = 'p5-unhandled'
      ctx.note(null, `unhandled shape: ${file}`)
    }

    report.families += fams.length
    report.products += fams.reduce((n, f) => n + (f.product ? 1 : 0), 0)
    report.variants += fams.reduce((n, f) => n + f.variants.length, 0)
    emit(sink, fams)
    reports.push(report)
  }

  // resolve cross-file family-code collisions by deterministic rename
  {
    const groups = new Map<string, MFam[]>()
    for (const f of sink.families) {
      const list = groups.get(f.code) ?? []
      list.push(f)
      groups.set(f.code, list)
    }
    const used = new Set<string>()
    for (const [code, fams] of groups) {
      fams.forEach((f, i) => {
        if (i === 0) {
          used.add(f.code)
          return
        }
        const tag = f.file.replace(/-catalog\.json$/, '').split('-').at(-1) ?? f.file
        let final = `${code}-${tag}`
        let n = 1
        while (used.has(final)) final = `${code}-${tag}-${n++}`
        used.add(final)
        f.code = final
        f.product.sku = final
        f.product.family = final
        for (const v of f.variants) {
          v.family = final
          v.productSku = final
          v.sku = `${final}/${v.code}`
        }
        skipNotes.push({
          file: f.file,
          family: code,
          reason: `family code '${code}' collided across files; renamed to '${final}' (distinct products retained)`,
        })
      })
    }
  }

  // uniqueness guards --- variants: source rows can SHARE a productCode (e.g.
  // GBGTA10230 rows 17/18, greengrip 'GGTC'), so re-unique SKUs rather than drop.
  const famSeen = new Set<string>()
  sink.families = sink.families.filter((f) =>
    famSeen.has(f.code) ? false : (famSeen.add(f.code), true)
  )
  const prodSeen = new Set<string>()
  sink.products = sink.products.filter((p) =>
    prodSeen.has(p.sku) ? false : (prodSeen.add(p.sku), true)
  )
  {
    const varSeen = new Set<string>()
    let skippedDupe = 0
    const reunique: MVariant[] = []
    for (const v of sink.variants) {
      if (varSeen.has(v.sku)) {
        let n = 2
        let base = `${v.sku}-${n}`
        while (varSeen.has(base)) base = `${v.sku}-${n++}`
        v.sku = base
        skippedDupe++
      }
      varSeen.add(v.sku)
      reunique.push(v)
    }
    sink.variants = reunique
    if (skippedDupe > 0) console.log(`[model] re-uniqued ${skippedDupe} duplicate-source variant SKUs`)
  }

  return {
    categories: [...catMap.values()].sort((a, b) => a.sortOrder - b.sortOrder),
    families: sink.families,
    products: sink.products,
    variants: sink.variants,
    skipNotes,
    reports,
  }
}