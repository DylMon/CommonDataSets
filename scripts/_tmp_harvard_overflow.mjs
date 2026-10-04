import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 1200 } });
await page.goto('http://localhost:8123/schools/harvard/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const result = await page.evaluate(() => {
  const vw = window.innerWidth;
  const offenders = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1) {
      offenders.push({ tag: el.tagName, cls: el.className, right: Math.round(r.right), width: Math.round(r.width), text: el.children.length === 0 ? el.textContent.trim().slice(0, 40) : '' });
    }
  });
  offenders.sort((a,b) => a.width - b.width);
  return offenders.slice(0, 15);
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
