import { chromium } from 'playwright';

const browser = await chromium.launch();

async function check(width) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const result = await page.evaluate(() => {
    const vw = window.innerWidth;
    const offenders = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        offenders.push({
          tag: el.tagName, cls: el.className, id: el.id,
          left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
        });
      }
    });
    // Only keep "outermost" offenders (not ones whose parent is also an offender) by checking depth roughly via simple heuristic: sort by width desc, take top 15
    offenders.sort((a, b) => b.right - a.right);
    return { vw, bodyScrollWidth: document.body.scrollWidth, offenders: offenders.slice(0, 15) };
  });
  console.log(`\n=== width ${width} ===`);
  console.log(JSON.stringify(result, null, 1));
  await page.close();
}

await check(768);
await check(640);
await check(390);

await browser.close();
