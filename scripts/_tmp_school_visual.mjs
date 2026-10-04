import { chromium } from 'playwright';

const browser = await chromium.launch();

async function shot(width, label) {
  const page = await browser.newPage({ viewport: { width, height: 2400 } });
  await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `C:\\Users\\Admin\\AppData\\Local\\Temp\\claude\\c--Users-Admin-Projects-commondatasets\\c3e49ae3-f9b1-4363-b2aa-6cb773e83972\\scratchpad\\school-${label}.png`,
    fullPage: true,
  });
  await page.close();
}

await shot(1440, 'desktop-1440');
await shot(900, 'tablet-900');
await shot(768, 'tablet-768');
await shot(390, 'mobile-390');

await browser.close();
