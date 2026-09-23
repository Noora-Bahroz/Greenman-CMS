import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import Categories from './src/collections/Categories'
import Families from './src/collections/Families'
import Products from './src/collections/Products'
import Variants from './src/collections/Variants'
import Specifications from './src/collections/Specifications'
import Media from './src/collections/Media'
import ReusableBlocks from './src/collections/ReusableBlocks'
import Blogs from './src/collections/Blogs'
import Audits from './src/collections/Audits'
import Roles from './src/collections/Roles'
import Users from './src/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users',
    theme: 'light',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { title: 'Greenman CMS', titleSuffix: '- Greenman CMS' },
    dateFormat: 'dd MMM yyyy, HH:mm',
    components: {
      beforeNav: [{ path: './src/components/NavBrand.tsx', exportName: 'NavBrand' }],
      graphics: {
        Logo: { path: './src/components/AdminLogo.tsx', exportName: 'Logo' },
        Icon: { path: './src/components/AdminLogo.tsx', exportName: 'Icon' },
      },
      views: {
        dashboard: {
          Component: { path: './src/components/AdminDashboard.tsx', exportName: 'Dashboard' },
        },
      },
    },
  },
  collections: [
    Categories, Families, Products, Variants, Specifications,
    Media, ReusableBlocks, Blogs, Audits, Roles, Users,
  ],
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:payload.db' },
    // Explicit migrations dir so the container + CLI always resolve it relative to this file,
    // independent of the working directory (Payload defaults to <cwd>/src/migrations otherwise).
    migrations: { dir: path.resolve(dirname, 'src/migrations') },
  }),
  typescript: { outputFile: path.resolve(dirname, 'src/payload-types.ts') },
// Payload expects the sharp function itself here (not `{ enabled: true }`),
  // otherwise uploads fail with "sharp is not a function" during image resizing.
  sharp,
})
