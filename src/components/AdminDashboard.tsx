import type { Payload } from 'payload'
import React from 'react'

type DashboardProps = {
  payload: Payload
  user?: { id?: string | number; email?: string; name?: string } | null
}

type Stat = {
  key: string
  label: string
  value: number
  hint?: string
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
  categories: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.6 13.4 11.6 4.4a2 2 0 0 0-1.4-.6H5a2 2 0 0 0-2 2v5.2c0 .5.2 1 .6 1.4l9 9a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8z" />
      <path d="M8 8h.01" />
    </svg>
  ),
  blogs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </svg>
  ),
  media: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m3 17 5-4 4 3 4-4 5 4" />
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

  const [products, variants, families, categories, blogs, media] = await Promise.all([
    count('products'),
    count('variants'),
    count('families'),
    count('categories'),
    count('blogs'),
    count('media'),
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

  const stats: Stat[] = [
    { key: 'products', label: 'Products', value: products, href: '/admin/collections/products', accent: true },
    { key: 'variants', label: 'Variants', value: variants, href: '/admin/collections/variants', accent: false },
    { key: 'families', label: 'Families', value: families, href: '/admin/collections/families', accent: false },
    { key: 'categories', label: 'Categories', value: categories, href: '/admin/collections/categories', accent: false },
    { key: 'blogs', label: 'Blog articles', value: blogs, href: '/admin/collections/blogs', accent: false },
    { key: 'media', label: 'Image library', value: media, href: '/admin/collections/media', accent: false },
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

  const publishPill = (status: string) =>
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

  return (
    <div className="gm-dash">
      <header className="gm-head">
        <div className="gm-head__intro">
          <p className="gm-head__eyebrow">Dashboard</p>
          <h1 className="gm-head__title">Welcome back, {name}</h1>
          <p className="gm-head__sub">Manage your Greenman catalogue, content and publishing from one place.</p>
          <p className="gm-head__meta">{today}</p>
        </div>
        <div className="gm-head__actions">
          <a className="gm-btn gm-btn--primary" href="/admin/collections/products/create">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create content
          </a>
        </div>
      </header>

      <section className="gm-stats" aria-label="Overview">
        {stats.map((s) => (
          <a
            key={s.key}
            className={`gm-stat${s.accent ? ' gm-stat--accent' : ''}`}
            href={s.href}
          >
            <span className="gm-stat__icon gm-stat__icon--${s.key}">{ICONS[s.key]}</span>
            <span className="gm-stat__label">{s.label}</span>
            <span className="gm-stat__value">{s.value >= 0 ? s.value.toLocaleString() : '—'}</span>
            <span className="gm-stat__hint">
              {s.key === 'blogs' && publishedBlogs > 0
                ? `${publishedBlogs} published`
                : s.key === 'products'
                  ? 'Total products'
                  : s.key === 'variants'
                    ? 'SKU-level records'
                    : s.key === 'families'
                      ? 'Product families'
                      : s.key === 'categories'
                        ? 'Catalogue groups'
                        : s.key === 'media'
                          ? 'Uploaded assets'
                          : 'Records'}
            </span>
          </a>
        ))}
      </section>

      <section className="gm-recent">
        <div className="gm-recent__head">
          <div>
            <h2 className="gm-recent__title">Recent content</h2>
            <p className="gm-recent__hint">Latest updates across your catalogue and blog</p>
          </div>
          <a className="gm-recent__view" href="/admin/collections/products">
            View all
          </a>
        </div>
        <div className="gm-table">
          <div className="gm-table__row gm-table__row--head">
            <span>Title</span>
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
                <span className="gm-table__title">{r.title}</span>
                <span>
                  <span className={`gm-type gm-type--${r.type.toLowerCase()}`}>{r.type}</span>
                </span>
                <span>
                  {r.status ? (
                    publishPill(r.status)
                  ) : (
                    <span className="gm-badge gm-badge--neutral">Catalogue</span>
                  )}
                </span>
                <span className="gm-table__muted">{r.updated}</span>
              </a>
            ))
          )}
        </div>
      </section>

      <section className="gm-quick">
        <div className="gm-recent__head">
          <div>
            <h2 className="gm-recent__title">Quick actions</h2>
            <p className="gm-recent__hint">Create things right from here</p>
          </div>
        </div>
        <div className="gm-quick__grid">
          {QUICK.map((q) => (
            <a key={q.href} className="gm-quick__btn" href={q.href}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {q.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard