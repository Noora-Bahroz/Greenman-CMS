import type { CollectionConfig } from 'payload'

// Audits — R0-R4 decision trail + Payload audit; freeze-preserving, append-
// only by admins. Maps to phase1/leaf_resolutions.json decisions.
const Audits: CollectionConfig = {
  slug: 'audits',
  admin: { group: 'System', useAsTitle: 'operation', defaultColumns: ['operation', 'leaf', 'decisionId'] },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  fields: [
    { name: 'operation', type: 'text', required: true },
    { name: 'leaf', type: 'text' },
    { name: 'decisionId', type: 'text' },
    { name: 'contract', type: 'text' },
    { name: 'beforeValue', type: 'json' },
    { name: 'afterValue', type: 'json' },
    { name: 'resolution', type: 'relationship', relationTo: 'families' },
    { name: 'product', type: 'relationship', relationTo: 'products' },
    { name: 'at', type: 'date', required: true },
  ],
}
export default Audits
