import type { CollectionConfig } from 'payload'

// Users — admin authentication for the CMS. `isAdmin` gates write access on
// every other collection via req.user?.isAdmin.
const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'isAdmin'] },
  auth: true,
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'isAdmin', type: 'checkbox', defaultValue: false },
  ],
}
export default Users