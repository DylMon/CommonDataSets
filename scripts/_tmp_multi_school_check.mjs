import { chromium } from 'playwright';

const browser = await chromium.launch();
const schools = ['mit', 'harvard', 'berkeley', 'caltech', 'cornell', 'asu', 'baylor', 'columbia'];
const widths = [1440, 1024, 900, 768, 700, 640, 500, 390, 360];

async function check(slug, width) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  const resp = await page.goto(`http://localhost:8123/schools/${slug}/`, { waitUntil: 'networkidle' }).catch(() => null);
  if (!resp || !resp.ok()) { await page.close(); return null; }
  await page.waitForTimeout(400);
  const result = await page.evaluate(() => ({
    vw: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  await page.close();
  return result;
}

for (const slug of schools) {
  for (const width of widths) {
    const r = await check(slug, width);
    if (!r) { console.log(slug, width, 'SKIP (no page)'); continue; }
    const bad = r.bodyScrollWidth > r.vw;
    console.log(`${slug.padEnd(12)} ${String(width).padEnd(5)} ${bad ? 'OVERFLOW by ' + (r.bodyScrollWidth - r.vw) + 'px' : 'ok'}`);
  }
}

await browser.close();
