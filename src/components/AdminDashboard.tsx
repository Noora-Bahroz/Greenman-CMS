import type { Payload } from 'payload'
import React from 'react'

type DashboardProps = {
  payload: Payload
  user?: { id?: string | number; email?: string; name?: string } | null
}

type SectionEntry = {
  slug: string
  title: string
  description: string
}

type Stat = {
  label: string
  value: number
  hint?: string
  href: string
  tone: 'green' | 'neutral'
}

const SECTIONS: { label: string; hint: string; entries: SectionEntry[] }[] = [
  {
    label: 'Catalogue',
    hint: 'Products, families and reference data',
    entries: [
      { slug: 'products', title: 'Products', description: 'Full product catalogue with specs, images and SKUs' },
      { slug: 'variants', title: 'Variants', description: 'SKU-level stock codes, sizes and load data' },
      { slug: 'families', title: 'Families', description: 'Product lines and their shared attributes' },
      { slug: 'categories', title: 'Categories', description: 'Structure the catalogue into groups' },
      { slug: 'specifications', title: 'Specifications', description: 'Reusable key / value technical facts' },
      { slug: 'reusable-blocks', title: 'Reusable tables', description: 'Spec, load and model tables used across families' },
    ],
  },
  {
    label: 'Publishing',
    hint: 'Blog articles and the image library',
    entries: [
      { slug: 'blogs', title: 'Blog & news', description: 'Write, schedule and publish articles' },
      { slug: 'media', title: 'Image library', description: 'Upload and organise images for products and blogs' },
    ],
  },
  {
    label: 'System',
    hint: 'People and change history',
    entries: [
      { slug: 'users', title: 'Team accounts', description: 'Who can sign in to the CMS' },
      { slug: 'roles', title: 'Roles & permissions', description: 'Admin and owner role flags' },
      { slug: 'audits', title: 'Audit trail', description: 'Change history and decision log' },
    ],
  },
]

const QUICK: { href: string; label: string }[] = [
  { href: '/admin/collections/blogs/create', label: 'Write a blog post' },
  { href: '/admin/collections/products/create', label: 'Add a product' },
  { href: '/admin/collections/media/create', label: 'Upload images' },
  { href: '/admin/collections/families/create', label: 'New product family' },
]

const fmtDate = (value?: string | number | null) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const statusPill = (status?: string) =>
  status === 'published' ? (
    <span className="gm-badge gm-badge--published">Published</span>
  ) : (
    <span className="gm-badge gm-badge--draft">Draft</span>
  )

export const Dashboard: React.FC<DashboardProps> = async ({ payload, user }) => {
  const counts: Record<string, number> = {}
  for (const { entries } of SECTIONS) {
    for (const { slug } of entries) {
      try {
        const res = await payload.find({ collection: slug as never, limit: 1, depth: 0 })
        counts[slug] = res.totalDocs
      } catch {
        counts[slug] = -1
      }
    }
  }

  let publishedBlogs = 0
  try {
    const res = await payload.find({ collection: 'blogs', limit: 1, depth: 0, where: { status: { equals: 'published' } } })
    publishedBlogs = res.totalDocs
  } catch {
    publishedBlogs = -1
  }

  const stats: Stat[] = [
    { label: 'Products', value: counts['products'], href: '/admin/collections/products', tone: 'green' },
    { label: 'Variants', value: counts['variants'], href: '/admin/collections/variants', tone: 'neutral' },
    { label: 'Families', value: counts['families'], href: '/admin/collections/families', tone: 'neutral' },
    { label: 'Categories', value: counts['categories'], href: '/admin/collections/categories', tone: 'neutral' },
    {
      label: 'Blog articles',
      value: counts['blogs'],
      hint: publishedBlogs > 0 ? `${publishedBlogs} published` : undefined,
      href: '/admin/collections/blogs',
      tone: 'neutral',
    },
    { label: 'Media assets', value: counts['media'], href: '/admin/collections/media', tone: 'neutral' },
  ]

  type RecentRow = {
    id: string | number
    title: string
    href: string
    type: string
    status?: string
    updated: string
  }
  const recent: RecentRow[] = []
  try {
    const products = await payload.find({ collection: 'products', limit: 5, depth: 0, sort: '-updatedAt' })
    for (const doc of products.docs as Record<string, unknown>[]) {
      recent.push({
        id: String(doc.id),
        title: String(doc.productName || doc.sku || doc.id),
        href: `/admin/collections/products/${doc.id}`,
        type: 'Product',
        updated: fmtDate(doc.updatedAt as string),
      })
    }
  } catch {
    /* ignore */
  }
  try {
    const blogs = await payload.find({ collection: 'blogs', limit: 5, depth: 0, sort: '-updatedAt' })
    for (const doc of blogs.docs as Record<string, unknown>[]) {
      recent.push({
        id: String(doc.id),
        title: String(doc.title || doc.id),
        href: `/admin/collections/blogs/${doc.id}`,
        type: 'Blog',
        status: String(doc.status || 'draft'),
        updated: fmtDate(doc.updatedAt as string),
      })
    }
  } catch {
    /* ignore */
  }
  recent.sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 8)

  const total = Object.values(counts).reduce((a, b) => (b > 0 ? a + b : a), 0)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const name = user?.name || user?.email || 'there'

  return (
    <div className="gm-dashboard">
      <div className="gm-hero">
        <div>
          <div className="gm-hero__eyebrow">Greenman CMS</div>
          <h1 className="gm-hero__title">Welcome back, {name}</h1>
          <p className="gm-hero__sub">
            Manage your catalogue, publish content and keep your team in sync. {today}
          </p>
        </div>
        <div className="gm-hero__stat">
          <span className="gm-hero__stat-num">{total.toLocaleString()}</span>
          <span className="gm-hero__stat-label">records managed</span>
        </div>
      </div>

      <div className="gm-stats">
        {stats.map((s) => (
          <a key={s.label} className={`gm-stat gm-stat--${s.tone}`} href={s.href}>
            <div className="gm-stat__label">{s.label}</div>
            <div className="gm-stat__value">{s.value >= 0 ? s.value.toLocaleString() : '—'}</div>
            {s.hint ? <div className="gm-stat__hint">{s.hint}</div> : null}
          </a>
        ))}
      </div>

      <div className="gm-recent">
        <div className="gm-recent__head">
          <h2 className="gm-section__title">Recent content</h2>
          <p className="gm-section__hint">Latest updates across your catalogue and blog</p>
        </div>
        <div className="gm-table">
          <div className="gm-table__row gm-table__row--head">
            <span>Title</span>
            <span>Type</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {recent.length === 0 ? (
            <div className="gm-table__row gm-table__row--empty">No content yet — create your first record to get started.</div>
          ) : (
            recent.slice(0, 8).map((r) => (
              <a key={`${r.type}-${r.id}`} className="gm-table__row" href={r.href}>
                <span className="gm-table__title">{r.title}</span>
                <span>
                  <span className={`gm-type gm-type--${r.type.toLowerCase()}`}>{r.type}</span>
                </span>
                <span>{r.status ? statusPill(r.status) : <span className="gm-badge gm-badge--muted">—</span>}</span>
                <span className="gm-table__muted">{r.updated}</span>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="gm-quick">
        {QUICK.map((q) => (
          <a key={q.href} className="gm-chip" href={q.href}>
            <span className="gm-chip__plus">+</span> {q.label}
          </a>
        ))}
      </div>

      {SECTIONS.map((section) => (
        <section className="gm-section" key={section.label}>
          <div className="gm-section__head">
            <h2 className="gm-section__title">{section.label}</h2>
            <p className="gm-section__hint">{section.hint}</p>
          </div>
          <div className="gm-cards">
            {section.entries.map((e) => {
              const n = counts[e.slug]
              return (
                <a key={e.slug} className="gm-card" href={`/admin/collections/${e.slug}`}>
                  <div className="gm-card__top">
                    <span className="gm-card__title">{e.title}</span>
                    {n >= 0 ? <span className="gm-card__count">{n.toLocaleString()}</span> : null}
                  </div>
                  <p className="gm-card__desc">{e.description}</p>
                  <span className="gm-card__go">Manage &rsaquo;</span>
                </a>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export default Dashboard