import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/payload-generated-schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URI || 'file:payload.db',
  },
  verbose: true,
  strict: true,
})