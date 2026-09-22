const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = process.env.FRONTEND_DIR || 'D:/greenman-master/greenman-master'
const OUT = process.env.OUT_DATA || 'C:/Users/noora/AppData/Local/Temp/opencode/phase3/scripts/phase6/out/data'
const PORT = parseInt(process.env.PORT || '8080', 10)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  let file = path.join(ROOT, p.replace(/^\//, ''))
  if (p.startsWith('/data/') && p.endsWith('.json')) {
    const gen = path.join(OUT, p.replace(/^\/data\//, ''))
    if (fs.existsSync(gen)) file = gen
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('not found: ' + p)
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' })
    res.end(buf)
  })
})

server.listen(PORT, () => console.log('frontend serving at http://localhost:' + PORT))