import type { CollectionConfig } from 'payload'

// Categories — schema-v2 canonical categories (propagated field = CMS value;
// never overwritten by legacy; fuller legacy copy preserved below).
const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    group: 'Catalogue',
    useAsTitle: 'name',
    defaultColumns: ['name', 'badge', 'slug', 'sortOrder'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user && req.user.isAdmin),
    update: ({ req }) => Boolean(req.user && req.user.isAdmin),
    delete: ({ req }) => Boolean(req.user && req.user.isAdmin),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'badge', type: 'text' },
    { name: 'slug', type: 'text', admin: { position: 'sidebar' } },
    { name: 'sortOrder', type: 'number', admin: { position: 'sidebar' } },
    // R1/R2: schema-v2 shortDescription is a TRUNCATION of the fuller legacy
    // copy. CMS canonical = the FULL legacy copy (preserved verbatim below).
    // The schema-v2 truncated value lives in `shortDescription` — NEVER
    // deleted, NEVER merged into `description`.
    { name: 'description', type: 'textarea' },
    { name: 'shortDescription', type: 'textarea' },
    // R1 badge: schema-v2 category badge (canonical). Legacy coarser badge
    // retained as alias, not discarded.
    { name: 'badgeAlias', type: 'text', admin: { description: 'Legacy coarser badge (preserved, not canonical)' } },
    // products.json-catalog + schema-v2 categories carry a catalog PDF ref.
    { name: 'catalogPdf', type: 'relationship', relationTo: 'media', admin: { position: 'sidebar' } },
    // Phase 6 round-trip: products.json `catalogPdf` is a STRING path kept verbatim.
    { name: 'catalogPdfUrl', type: 'text', admin: { position: 'sidebar', description: 'products.json catalogPdf string path' } },
    // products.json display-layer metadata (verbatim, for contract round-trip).
    { name: 'jsonName', type: 'text', admin: { description: 'products.json category name (verbatim)' } },
    { name: 'jsonBadge', type: 'text', admin: { description: 'products.json category badge (verbatim)' } },
    { name: 'jsonPdf', type: 'text', admin: { description: 'products.json category catalogPdf (verbatim)' } },
    // Reverse link so the admin can see a category's families (plan 1—N).
    { name: 'families', type: 'join', collection: 'families', on: 'categoryID' },
  ],
}

export default Categories
