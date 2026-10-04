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
    return { left: Math.round(r.left), width: Math.round(r.width), right: Math.round(r.right), flex: cs.flex, minWidth: cs.minWidth, fontSize: cs.fontSize };
  }
  const valsEl = [...document.querySelectorAll('.score-bar-vals')].find(e => e.textContent.includes('720'));
  const row = valsEl.closest('.score-row');
  const wrap = valsEl.closest('.score-bar-wrap');
  const label = row.querySelector('.score-row-label');
  const track = row.querySelector('.score-bar-track');
  const cols2 = row.closest('.cols-2');
  return {
    vw: window.innerWidth,
    cols2: cols2 ? info(cols2) : 'not in cols-2',
    row: info(row),
    label: info(label),
    wrap: info(wrap),
    track: info(track),
    vals: info(valsEl),
    valsText: valsEl.textContent,
  };
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
