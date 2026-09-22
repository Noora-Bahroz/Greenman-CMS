import type { CollectionConfig } from 'payload'

// Reusable content blocks — spec tables / load tables / model tables from the
// frozen legacy contract (reusable across families, payload-native blocks).
const ReusableBlocks: CollectionConfig = {
  slug: 'reusable-blocks',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'block'] },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      options: ['table', 'spec-group', 'definition', 'demo'],
      defaultValue: 'table',
      admin: { description: 'Reusable block kind (plan §3 #9).' },
    },
    {
      name: 'block',
      type: 'blocks',
      blocks: [
        {
          slug: 'specTable',
          fields: [
            { name: 'title', type: 'text' },
            {
              name: 'rows',
              type: 'array',
              fields: [
                { name: 'key', type: 'text' },
                { name: 'value', type: 'text' },
                { name: 'unit', type: 'text' },
              ],
            },
          ],
        },
        {
          slug: 'loadTable',
          fields: [
            { name: 'caseName', type: 'text' },
            { name: 'span', type: 'text' },
            { name: 'load', type: 'text' },
          ],
        },
      ],
    },
  ],
}
export default ReusableBlocks
