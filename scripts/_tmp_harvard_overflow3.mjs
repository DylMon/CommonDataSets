import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 1200 } });
await page.goto('http://localhost:8123/schools/harvard/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const result = await page.evaluate(() => {
  function info(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { tag: el.tagName, cls: el.className, left: Math.round(r.left), width: Math.round(r.width), right: Math.round(r.right), display: cs.display, minWidth: cs.minWidth, gridTemplateColumns: cs.gridTemplateColumns };
  }
  const row = [...document.querySelectorAll('.score-row')].find(e => e.textContent.includes('720'));
  const chain = [];
  let el = row;
  for (let i = 0; i < 8 && el; i++) {
    chain.push(info(el));
    el = el.parentElement;
  }
  return chain;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
