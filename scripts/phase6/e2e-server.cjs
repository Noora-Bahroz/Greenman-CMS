const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = process.env.E2E_ROOT || 'D:/greenman-master/greenman-master'
const OUT = process.env.E2E_DATA || 'C:/Users/noora/AppData/Local/Temp/opencode/phase3/scripts/phase6/out/data'
const PORT = 8321

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const isGenData = p.startsWith('/data/') && p.endsWith('.json')
  const file = isGenData
    ? path.join(OUT, p.replace(/^\/data\//, ''))
    : path.join(ROOT, p.replace(/^\//, ''))
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('not found: ' + p)
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
    res.end(buf)
  })
})

function get(url) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:' + PORT + url, (r) => {
      const chunks = []
      r.on('data', (c) => chunks.push(c))
      r.on('end', () =>
        resolve({ status: r.statusCode, ct: r.headers['content-type'] || '', body: Buffer.concat(chunks).toString('utf8') })
      )
    }).on('error', reject)
  })
}

async function main() {
  const pages = [
    '/index.html',
    '/anchor-list.html',
    '/anchor-template.html',
    '/fasteners-collection.html',
    '/gbhc-catalog.html',
    '/c-channel-list.html',
    '/c-channel-template.html',
    '/strut-list.html',
    '/clamps-collection.html',
    '/greengrip-ggip-catalog.html',
    '/greengrip-ggsh-catalog.html',
    '/accessories-collection.html',
    '/gaco-catalog.html',
    '/gaco-template.html',
    '/blog.html',
  ]
  const jsonFiles = [
    '/data/anchor-catalog.json',
    '/data/fasteners-catalog.json',
    '/data/c-channel-catalog.json',
    '/data/strut-channel-catalog.json',
    '/data/greengrip-ggip-catalog.json',
    '/data/greengrip-ggsh-catalog.json',
    '/data/gaco-catalog.json',
    '/data/blog.json',
  ]
  let bad = 0
  for (const p of pages) {
    const r = await get(p)
    const ok = r.status === 200
    if (!ok) bad++
    console.log((ok ? 'OK  ' : 'FAIL') + '  ' + p + '  ' + r.status)
  }
  for (const p of jsonFiles) {
    const r = await get(p)
    let parseOk = false
    try {
      JSON.parse(r.body)
      parseOk = true
    } catch {}
    const ok = r.status === 200 && parseOk
    if (!ok) bad++
    console.log((ok ? 'OK  ' : 'FAIL') + '  ' + p + '  ' + r.status + (parseOk ? ' (parses)' : ' (BAD JSON)'))
  }
  const blog = await get('/data/blog.json')
  const bj = JSON.parse(blog.body)
  console.log('blog.json articles:', bj.articles.length, '/ expected >= 9')
  if (bj.articles.length < 9 || bj.articles.some((a) => !a.title || !a.content)) {
    console.log('FAIL blog.json content shape')
    bad++
  } else {
    console.log('OK   blog.json content shape (title+content on all)')
  }
  const blogBody = (await get('/blog.html')).body
  if (/fetch\('data\/blog\.json/.test(blogBody)) console.log('OK   blog.html fetches data/blog.json')
  else {
    console.log('FAIL blog.html missing data/blog.json fetch')
    bad++
  }
  console.log(bad === 0 ? 'E2E READ-ONLY: ALL CHECKS PASSED' : 'E2E READ-ONLY: ' + bad + ' FAILURES')
  server.close()
  process.exit(bad === 0 ? 0 : 1)
}

server.listen(PORT, () => main().catch((e) => { console.error(e); process.exit(1) }))