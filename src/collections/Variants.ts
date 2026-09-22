import type { CollectionConfig } from 'payload'

const Variants: CollectionConfig = {
  slug: 'variants',
  admin: { useAsTitle: 'sku', defaultColumns: ['sku', 'product', 'size'] },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user && req.user.isAdmin),
    update: ({ req }) => Boolean(req.user && req.user.isAdmin),
    delete: ({ req }) => Boolean(req.user && req.user.isAdmin),
  },
  fields: [
    { name: 'sku', type: 'text', required: true, unique: true, index: true },
    { name: 'file', type: 'text', admin: { position: 'sidebar', description: 'Source contract file' } },
    { name: 'code', type: 'text', index: true },
    { name: 'product', type: 'relationship', relationTo: 'products', required: true },
    { name: 'family', type: 'relationship', relationTo: 'families', index: true },
    { name: 'size', type: 'text' },
    // String-safe: source pack sizes are strings ('150', '100'); unit is
    // 'pcs' for fasteners/anchors/clamps, 'm' for profile sections.
    { name: 'packSize', type: 'text' },
    { name: 'unit', type: 'text', defaultValue: 'pcs' },
    { name: 'weight', type: 'number' },
    { name: 'loadRating', type: 'text' }, // '1 kN', '1800', ranges -> string
    { name: 'image', type: 'relationship', relationTo: 'media' },
    { name: 'notes', type: 'textarea' },
    { name: 'attributes', type: 'json' }, // typed block groups (anchor/profile/fastener/clamp/generic/dimensions/loadCases)
    { name: 'order', type: 'number' },
    { name: 'specs', type: 'join', collection: 'specifications', on: 'variant' },
  ],
}

export default Variants
