import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 1200 } });
await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const result = await page.evaluate(() => {
  const sections = [...document.querySelectorAll('.school-section')];
  const costSection = sections.find(s => s.querySelector('.section-title')?.textContent.trim() === 'Cost');
  const table = costSection.querySelector('.tbl');
  const rows = [...table.querySelectorAll('tr')];
  return rows.map(row => [...row.children].map(cell => ({
    tag: cell.tagName, text: cell.textContent.trim(), scrollW: cell.scrollWidth, clientW: cell.clientWidth,
    whiteSpace: getComputedStyle(cell).whiteSpace,
  })));
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
