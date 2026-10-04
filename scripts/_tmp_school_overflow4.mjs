import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 768, height: 1200 } });
await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

const result = await page.evaluate(() => {
  function info(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName, cls: el.className,
      left: r.left, width: r.width, right: r.right,
      display: cs.display, width_css: cs.width, maxWidth: cs.maxWidth, minWidth: cs.minWidth,
      position: cs.position, flexShrink: cs.flexShrink,
    };
  }
  const chain = [];
  let el = document.querySelector('.school-page-layout');
  while (el) {
    chain.push(info(el));
    el = el.parentElement;
  }
  return chain;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
