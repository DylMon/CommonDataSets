import { chromium } from 'playwright';

const browser = await chromium.launch();

async function check(width) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const result = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.school-section').forEach(sec => {
      const title = sec.querySelector('.section-title')?.textContent?.trim() || '(untitled)';
      const sw = sec.scrollWidth, cw = sec.clientWidth;
      const overflowing = [];
      sec.querySelectorAll('*').forEach(el => {
        if (el.scrollWidth > el.clientWidth + 2) {
          overflowing.push({ cls: el.className, sw: el.scrollWidth, cw: el.clientWidth });
        }
      });
      out.push({ title, sectionScrollW: sw, sectionClientW: cw, overflowCount: overflowing.length, overflowing: overflowing.slice(0, 5) });
    });
    return { bodyScrollWidth: document.body.scrollWidth, viewportWidth: window.innerWidth, sections: out };
  });
  console.log(`\n=== width ${width} ===`);
  console.log(JSON.stringify(result, null, 1));
  await page.close();
}

await check(1440);
await check(1024);
await check(768);
await check(640);
await check(390);

await browser.close();
