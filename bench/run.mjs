import { chromium } from '@playwright/test'
import { build } from 'vite'
import { createServer } from 'http'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join, extname } from 'path'
await build({ configFile: new URL('./vite.config.mjs', import.meta.url).pathname })
const root = new URL('./dist', import.meta.url).pathname
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' }
const srv = createServer((q, r) => { const u = q.url.split('?')[0]; const p = join(root, u === '/' ? 'index.html' : u); if (!existsSync(p)) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); r.end(readFileSync(p)) }).listen(0)
const url = `http://127.0.0.1:${srv.address().port}/`
const browser = await chromium.launch()
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const mode = process.argv[2] || 'time'
const scenarios = (process.argv[3] || 'native,flat,validated,rows').split(',')
const n = Number(process.argv[4] || 450)
const runs = Number(process.argv[5] || 7)
const results = {}
for (const sc of scenarios) {
  const times = []
  let inputs = 0
  for (let i = 0; i < runs + 1; i++) {
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForFunction(() => window.benchReady)
    let cdp
    if (mode === 'profile' && i === runs) { cdp = await page.context().newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start') }
    const r = await page.evaluate(([s, n]) => window.runBench(s, n), [sc, n])
    if (cdp) {
      const { profile } = await cdp.send('Profiler.stop')
      const self = new Map(); const byId = new Map(profile.nodes.map((nd) => [nd.id, nd]))
      const dt = profile.timeDeltas; const counts = new Map()
      profile.samples.forEach((id, k) => counts.set(id, (counts.get(id) || 0) + (dt[k] || 0)))
      for (const [id, us] of counts) { const nd = byId.get(id); const cf = nd.callFrame; const key = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(key, (self.get(key) || 0) + us) }
      const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 18)
      console.log(`\n--- ${sc} top self time (ms) ---`)
      for (const [k, us] of top) console.log((us / 1000).toFixed(1).padStart(8), k)
      writeFileSync(new URL(`./profile-${sc}.cpuprofile`, import.meta.url), JSON.stringify(profile))
    }
    await page.close()
    if (i > 0) times.push(r.ms) // first run is warm-up
    inputs = r.inputs
  }
  results[sc] = { median: Math.round(median(times)), min: Math.round(Math.min(...times)), max: Math.round(Math.max(...times)), inputs }
}
if (mode === 'time') console.log(JSON.stringify(results, null, 1))
await browser.close(); srv.close()
