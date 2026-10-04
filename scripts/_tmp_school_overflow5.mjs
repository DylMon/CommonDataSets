import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 768, height: 1200 } });
await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const cs = await page.evaluate(() => {
  const c = document.querySelector('.container');
  const s = getComputedStyle(c);
  const children = [...c.children].map(ch => {
    const r = ch.getBoundingClientRect();
    const ccs = getComputedStyle(ch);
    return { tag: ch.tagName, cls: ch.className, id: ch.id, width: r.width, left: r.left, alignSelf: ccs.alignSelf, display: ccs.display, position: ccs.position };
  });
  return { alignItems: s.alignItems, justifyContent: s.justifyContent, flexWrap: s.flexWrap, children };
});
console.log(JSON.stringify(cs, null, 1));
await browser.close();
