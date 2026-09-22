import type { CollectionConfig } from 'payload'

// Roles — RBAC for the admin CMS. `isAdmin` gates write access on all
// collections; `isOwner` scopes a few contract leaves for later owner signoff.
const Roles: CollectionConfig = {
  slug: 'roles',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'isAdmin', 'isOwner'] },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'isAdmin', type: 'checkbox', defaultValue: false },
    { name: 'isOwner', type: 'checkbox', defaultValue: false },
  ],
}
export default Roles
