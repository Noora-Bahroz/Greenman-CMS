import type { CollectionConfig } from 'payload'

// Users — admin authentication for the CMS. `isAdmin` gates write access on
// every other collection via req.user?.isAdmin. This collection itself is
// admin-only: user records (incl. emails) must not be readable by anonymous
// visitors or non-admin accounts. First-run setup still works because Payload's
// `first-register` flow bypasses access control while zero users exist.
const Users: CollectionConfig = {
  slug: 'users',
  admin: { group: 'System', useAsTitle: 'email', defaultColumns: ['email', 'name', 'isAdmin'] },
  auth: true,
  access: {
    read: ({ req, id }) => {
      if (!req.user) return false
      if (req.user.isAdmin) return true
      // Non-admins may only fetch their own record (this is what the admin
      // panel's `/me` call and per-user views rely on).
      return id != null && String(id) === String(req.user.id)
    },
    create: ({ req }) => Boolean(req.user?.isAdmin),
    update: ({ req }) => Boolean(req.user?.isAdmin),
    delete: ({ req }) => Boolean(req.user?.isAdmin),
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'isAdmin', type: 'checkbox', defaultValue: false },
  ],
}
export default Users