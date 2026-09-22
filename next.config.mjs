import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config) => {
    if (!config.resolve.alias) config.resolve.alias = {}
    config.resolve.alias['@payload-config'] = path.join(dirname, 'payload.config.ts')
    return config
  },
}

export default withPayload(nextConfig)
