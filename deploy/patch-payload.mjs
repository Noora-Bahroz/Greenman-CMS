import { readFileSync, writeFileSync } from 'node:fs'

const target = 'node_modules/payload/dist/auth/extractJWT.js'
const needle = [
  "        if (payload.config.csrf.length === 0) {",
  "            return cookieToken;",
  "        }",
  "        // No Origin with csrf configured — fall back to Sec-Fetch-Site",
  "        const secFetchSite = headers.get('Sec-Fetch-Site');",
  "        // Allow same-origin, same-site, and direct navigations (none)",
  "        if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {",
  "            return cookieToken;",
  "        }",
  "        // Reject cross-site requests and missing header (non-browser clients)",
  "        return null;",
].join('\n')
const repl = [
  "        if (payload.config.csrf.length === 0 || !origin) {",
  "            return cookieToken;",
  "        }",
  "        return null;",
].join('\n')

const src = readFileSync(target, 'utf8')
if (src.includes(needle)) {
  writeFileSync(target, src.split(needle).join(repl), 'utf8')
  console.log('patched: relaxed cookie extractor Origin/Sec-Fetch-Site gate')
} else {
  console.log('no-op: extractor already patched (or layout changed)')
}