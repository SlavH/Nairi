const { chromium } = require('playwright')
const fs = require('fs')

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const pages = fs.readFileSync('/tmp/opencode/pages-static.txt', 'utf8')
  .split('\n').map((s) => s.trim()).filter(Boolean)

const viewports = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const report = []

  for (const [vname, vp] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 })
    const page = await context.newPage()

    for (const route of pages) {
      const entry = { v: vname, route, status: null, errors: [], failed: [], overflow: false, bodyLen: 0, spinners: 0 }
      const url = BASE + route

      const onConsole = (m) => { if (m.type() === 'error') entry.errors.push(m.text().slice(0, 300)) }
      const onPageError = (e) => entry.errors.push('PAGEERROR: ' + String(e).slice(0, 300))
      const onResponse = (r) => {
        if (r.status() >= 400 && !r.url().includes('/api/')) {
          entry.failed.push(`${r.status()} ${r.url().replace(BASE, '')}`)
        }
      }
      page.on('console', onConsole)
      page.on('pageerror', onPageError)
      page.on('response', onResponse)

      try {
        const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
        entry.status = resp ? resp.status() : null
      } catch (e) {
        entry.errors.push('NAV: ' + String(e).slice(0, 150))
      }

      try {
        await page.waitForTimeout(1500)
        entry.bodyLen = (await page.locator('body').innerText()).trim().length
        const scroll = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, vw: window.innerWidth }))
        entry.overflow = scroll.w > scroll.vw + 1
        entry.spinners = await page.locator('[aria-busy="true"], .animate-spin, [role="status"], [data-testid*="loading"], [class*="skeleton"]').count()
        const imgs = await page.locator('img').evaluateAll((imgs) =>
          imgs.filter((i) => !i.complete || (i.naturalWidth === 0 && i.getAttribute('src'))).map((i) => i.getAttribute('src')?.slice(0, 80))
        )
        if (imgs.length) entry.failed.push(`BROKEN-IMG: ${imgs.join(', ')}`)
      } catch (e) { /* ignore */ }

      page.removeListener('console', onConsole)
      page.removeListener('pageerror', onPageError)
      page.removeListener('response', onResponse)
      report.push(entry)
    }
    await context.close()
  }

  let bad = 0
  for (const e of report) {
    const problems = []
    if (e.status !== 200) problems.push(`STATUS=${e.status}`)
    if (e.errors.length) problems.push(`CONSOLE(${e.errors.length})`)
    if (e.failed.length) problems.push(`FAILED(${e.failed.join('; ')})`)
    if (e.overflow) problems.push('OVERFLOW')
    if (e.bodyLen < 40) problems.push(`EMPTY(body=${e.bodyLen})`)
    if (e.spinners > 0) problems.push(`SPINNERS=${e.spinners}`)
    if (problems.length) {
      bad++
      console.log(`[${e.v}] ${e.route}: ${problems.join(' | ')}`)
      e.errors.slice(0, 2).forEach((x) => console.log('    ! ' + x))
    }
  }
  console.log(`\n${report.length} page/route-visits, ${bad} with issues`)
  await browser.close()
})()
