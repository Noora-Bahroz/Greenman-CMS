import type { CollectionConfig } from 'payload'

// Specifications — schema-v2 canonical key/value/unit leaves. Preserved FULLY
// (R1/R2 rule); legacy fuller copy never truncated, never overwritten.
const Specifications: CollectionConfig = {
  slug: 'specifications',
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['family', 'key', 'value'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  fields: [
    { name: 'family', type: 'relationship', relationTo: 'families', required: true },
    { name: 'variant', type: 'relationship', relationTo: 'variants' },
    { name: 'key', type: 'text', required: true },
    { name: 'value', type: 'text' },
    { name: 'unit', type: 'text' },
    { name: 'order', type: 'number' },
    { name: 'fullCopy', type: 'textarea' }, // legacy fuller copy, never touched
  ],
}
export default Specifications
