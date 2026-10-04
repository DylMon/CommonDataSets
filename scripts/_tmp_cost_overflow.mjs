import { chromium } from 'playwright';

const browser = await chromium.launch();

async function check(width) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('.school-section')];
    const costSection = sections.find(s => s.querySelector('.section-title')?.textContent.trim() === 'Cost');
    const wrap = costSection?.querySelector('.tbl-wrap');
    const tbl = costSection?.querySelector('.tbl');
    if (!wrap) return null;
    return {
      wrapClientW: wrap.clientWidth, wrapScrollW: wrap.scrollWidth,
      tblOffsetW: tbl.offsetWidth, tblScrollW: tbl.scrollWidth,
      overflowing: wrap.scrollWidth > wrap.clientWidth + 1,
    };
  });
  console.log(width, JSON.stringify(result));
  await page.close();
}

for (const w of [1300, 1100, 1000, 900, 850, 800, 768, 750, 720, 700, 640, 600, 500, 390]) {
  await check(w);
}

await browser.close();
