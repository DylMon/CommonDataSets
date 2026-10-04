import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 768, height: 1200 } });
await page.goto('http://localhost:8123/schools/mit/', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

const result = await page.evaluate(() => {
  function info(sel) {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      left: r.left, width: r.width, right: r.right,
      cssWidth: cs.width, display: cs.display, flexDirection: cs.flexDirection,
      flexWrap: cs.flexWrap, flex: cs.flex, flexBasis: cs.flexBasis,
      padding: cs.padding, boxSizing: cs.boxSizing, maxWidth: cs.maxWidth,
    };
  }
  return {
    pageLayout: info('.school-page-layout'),
    rightSidebar: info('.right-sidebar'),
    favBox: info('#school-fav-box'),
    historyBox: info('#school-history-box'),
    historyList: info('#school-history-list'),
    historyItem: info('.history-item'),
    historyName: info('.history-name'),
    historyBoxCount: document.querySelectorAll('.right-sidebar .history-box').length,
    favBoxDisplay: getComputedStyle(document.getElementById('school-fav-box')).display,
  };
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
