import { chromium } from 'playwright';

const browser = await chromium.launch();

async function shotSection(width, label, sectionTitle) {
  const page = await browser.newPage({ viewport: { width, height: 1400 } });
  await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const section = await page.evaluateHandle((title) => {
    return [...document.querySelectorAll('.school-section, .school-section-row')]
      .find(s => s.querySelector('.section-title')?.textContent.trim() === title) || null;
  }, sectionTitle);
  const el = section.asElement();
  if (!el) { console.log('NOT FOUND', label, sectionTitle); await page.close(); return; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await el.screenshot({
    path: `C:\\Users\\Admin\\AppData\\Local\\Temp\\claude\\c--Users-Admin-Projects-commondatasets\\c3e49ae3-f9b1-4363-b2aa-6cb773e83972\\scratchpad\\sec-${label}.png`,
  });
  await page.close();
}

for (const w of [1440, 900, 768, 390]) {
  await shotSection(w, `cost-${w}`, 'Cost');
}
for (const w of [900, 768, 390]) {
  await shotSection(w, `student-body-${w}`, 'Student Body');
}
for (const w of [900, 768, 390]) {
  await shotSection(w, `academic-${w}`, 'Academic Profile');
}

await browser.close();
