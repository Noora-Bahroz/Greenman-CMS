import type { Payload } from 'payload'
import React from 'react'

type DashboardProps = {
  payload: Payload
  user?: { id?: string | number; email?: string; name?: string } | null
}

type Kpi = {
  key: string
  label: string
  value: number
  note: string
  href: string
  accent: boolean
}

const ICONS: Record<string, React.ReactNode> = {
  products: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  variants: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="7" rx="1.5" />
      <rect x="4" y="14" width="16" height="7" rx="1.5" />
      <path d="M9 6.5h6M9 17.5h6" />
    </svg>
  ),
  families: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  ),
  blogs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </svg>
  ),
}

const fmtDate = (value?: string | number | null) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const initials = (title: string) =>
  title
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '·'

type RecentRow = {
  id: string | number
  title: string
  href: string
  type: 'Product' | 'Blog'
  status?: string
  updated: string
}

export const Dashboard: React.FC<DashboardProps> = async ({ payload, user }) => {
  const count = async (slug: string): Promise<number> => {
    try {
      const res = await payload.find({ collection: slug as never, limit: 1, depth: 0 })
      return res.totalDocs
    } catch {
      return -1
    }
  }

  const [products, variants, families, blogs] = await Promise.all([
    count('products'),
    count('variants'),
    count('families'),
    count('blogs'),
  ])

  let publishedBlogs = 0
  try {
    const res = await payload.find({
      collection: 'blogs',
      limit: 1,
      depth: 0,
      where: { status: { equals: 'published' } },
    })
    publishedBlogs = res.totalDocs
  } catch {
    /* ignore */
  }

  const kpis: Kpi[] = [
    { key: 'products', label: 'Products', value: products, note: 'Full product catalogue', href: '/admin/collections/products', accent: true },
    { key: 'variants', label: 'Variants', value: variants, note: 'SKU-level records', href: '/admin/collections/variants', accent: false },
    { key: 'families', label: 'Families', value: families, note: 'Product lines', href: '/admin/collections/families', accent: false },
    { key: 'blogs', label: 'Blog articles', value: blogs, note: publishedBlogs > 0 ? `${publishedBlogs} published` : 'Published content', href: '/admin/collections/blogs', accent: false },
  ]

  const recent: RecentRow[] = []
  try {
    const docs = await payload.find({ collection: 'products', limit: 5, depth: 0, sort: '-updatedAt' })
    for (const doc of docs.docs as Record<string, unknown>[]) {
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
    const docs = await payload.find({ collection: 'blogs', limit: 5, depth: 0, sort: '-updatedAt' })
    for (const doc of docs.docs as Record<string, unknown>[]) {
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
  recent.sort((a, b) => b.updated.localeCompare(a.updated))
  const recentView = recent.slice(0, 8)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const name = user?.name || user?.email || 'there'

  const statusPill = (status: string) =>
    status === 'published' ? (
      <span className="gm-badge gm-badge--published">Published</span>
    ) : (
      <span className="gm-badge gm-badge--draft">Draft</span>
    )

  const QUICK: { href: string; label: string }[] = [
    { href: '/admin/collections/products/create', label: 'New product' },
    { href: '/admin/collections/blogs/create', label: 'New blog post' },
    { href: '/admin/collections/media/create', label: 'Upload image' },
    { href: '/admin/collections/families/create', label: 'New family' },
  ]

  const plus = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )

  return (
    <div className="gm-dash">
      <header className="gm-head">
        <div className="gm-head__intro">
          <p className="gm-head__eyebrow">Overview</p>
          <h1 className="gm-head__title">Welcome back, {name}</h1>
          <p className="gm-head__sub">Manage your Greenman catalogue, content and publishing from one place.</p>
          <p className="gm-head__meta">{today}</p>
        </div>
        <div className="gm-head__actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a className="gm-btn gm-btn--secondary" href="/admin/collections/audits">
            View audit trail
          </a>
          <a className="gm-btn gm-btn--primary" href="/admin/collections/products/create">
            {plus}
            New product
          </a>
        </div>
      </header>

      <section className="gm-kpis" aria-label="Overview">
        {kpis.map((k) => (
          <a key={k.key} className={`gm-kpi${k.accent ? ' gm-kpi--accent' : ''}`} href={k.href}>
            <span className="gm-kpi__icon">{ICONS[k.key]}</span>
            <span className="gm-kpi__label">{k.label}</span>
            <span className="gm-kpi__value">{k.value >= 0 ? k.value.toLocaleString() : '—'}</span>
            <span className="gm-kpi__note">{k.note}</span>
          </a>
        ))}
      </section>

      <section className="gm-recent">
        <div className="gm-recent__head">
          <div>
            <h2 className="gm-recent__title">Recent items</h2>
            <p className="gm-recent__hint">Latest updates across your catalogue and blog</p>
          </div>
          <a className="gm-recent__view" href="/admin/collections/products">
            View all
          </a>
        </div>
        <div className="gm-table">
          <div className="gm-table__row gm-table__row--head">
            <span>Item</span>
            <span>Type</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {recentView.length === 0 ? (
            <div className="gm-table__row gm-table__row--empty">
              No content yet — create your first record to get started.
            </div>
          ) : (
            recentView.map((r) => (
              <a key={`${r.type}-${r.id}`} className="gm-table__row" href={r.href}>
                <span className="gm-table__title">
                  <span className={`gm-avatar${r.type === 'Blog' ? ' gm-avatar--brand' : ''}`}>{initials(r.title)}</span>
                  <span className="gm-table__title-text">{r.title}</span>
                </span>
                <span className={`gm-type gm-type--${r.type.toLowerCase()}`}>{r.type}</span>
                <span>{r.status ? statusPill(r.status) : <span className="gm-badge gm-badge--neutral">Catalogue</span>}</span>
                <span className="gm-table__muted">{r.updated}</span>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="gm-quick">
        <h2 className="gm-quick__title">Quick actions</h2>
        <div className="gm-quick__grid">
          {QUICK.map((q) => (
            <a key={q.href} className="gm-quick__btn" href={q.href}>
              {plus}
              {q.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard