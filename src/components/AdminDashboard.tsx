import type { Payload } from 'payload'
import React from 'react'

type DashboardProps = {
  payload: Payload
  user?: { id?: string | number; email?: string; name?: string } | null
}

type Entry = {
  slug: string
  title: string
  description: string
  accent?: 'green' | 'blue' | 'purple'
}

const SECTIONS: { label: string; hint: string; entries: Entry[] }[] = [
  {
    label: 'Catalogue',
    hint: 'Products, families and reference data',
    entries: [
      { slug: 'products', title: 'Products', description: 'Full product catalogue with specs, images and SKUs', accent: 'green' },
      { slug: 'variants', title: 'Variants', description: 'SKU-level stock codes, sizes and load data', accent: 'green' },
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
      { slug: 'blogs', title: 'Blog & news', description: 'Write, schedule and publish articles', accent: 'green' },
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
                <a key={e.slug} className={`gm-card gm-card--${e.accent || 'neutral'}`} href={`/admin/collections/${e.slug}`}>
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