const fs = require('fs')
const path = require('path')

const root = 'D:/greenman-master/greenman-master'
const out = 'C:/Users/noora/AppData/Local/Temp/opencode/phase3/scripts/phase6/out/data'

const refs = new Set()
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (['.git', 'data', 'node_modules'].includes(e.name)) continue
      walk(path.join(d, e.name))
    } else if (/\.(html|js)$/.test(e.name)) {
      const t = fs.readFileSync(path.join(d, e.name), 'utf8')
      for (const m of t.matchAll(/fetch\(\s*['\"](data\/[^'\"?)]+\.json)['\"]/g)) {
        refs.add(m[1].replace(/\?.*$/, '').replace(/^\s+|\s+$/g, ''))
      }
    }
  }
}
walk(root)

const gen = fs.readdirSync(out).filter((f) => f.endsWith('.json'))
const genNames = new Set(gen)
const missing = [...refs].filter((r) => !genNames.has(path.basename(r)))
const notReferenced = gen.filter(
  (f) => f !== 'blog.json' && ![...refs].some((r) => path.basename(r) === f)
)
console.log('site refs to data/*.json:', refs.size)
console.log('generated files:', gen.length)
console.log('refs NOT in generated set:', missing.length ? missing : '(none)')
console.log(
  'generated but not referenced:',
  notReferenced.length ? notReferenced : '(all referenced)'
)
console.log('--- referenced files ---')
for (const ref of [...refs].sort()) console.log('  ' + ref)