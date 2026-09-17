import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test('首頁、章節與行動版沒有整頁溢出',async({page})=>{
 await page.goto('./');await expect(page.getByRole('heading',{name:'你遇到什麼問題？'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.locator('.chapter-tile').first().click();await expect(page.getByRole('heading',{name:'第 1 章',exact:true})).toBeVisible();
});
test('搜尋、篩選交集與 URL 還原',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成示範題');
 await page.goto('questions/');await page.getByLabel('搜尋問題',{exact:true}).fill('429');await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('#result-count')).toHaveText('找到 1 個問題');await expect(page.locator('#result-list')).toContainText('HTTP 429');
 await page.getByLabel('課程章節',{exact:true}).selectOption('ch02');await expect(page.locator('#search-message')).toContainText('沒有符合的問題');
 await page.reload();await expect(page.getByLabel('課程章節',{exact:true})).toHaveValue('ch02');await expect(page.locator('#search-message')).toBeVisible();
});
test('工具別名、中文與草稿排除',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成示範題');
 await page.goto('questions/?q=愛馬仕');await expect(page.locator('#result-list .question-card').first()).toBeVisible();
 await page.getByLabel('搜尋問題',{exact:true}).fill('DRAFT_BODY_SENTINEL');await page.getByRole('button',{name:'搜尋',exact:true}).click();await expect(page.locator('#result-count')).toHaveText('找到 0 個問題');
});
test('分頁可以返回並還原',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成示範題');
 await page.goto('questions/?sort=updated');await expect(page.locator('#search-pagination')).toBeVisible();await page.getByRole('button',{name:'下一頁'}).click();
 await expect(page.locator('#search-pagination')).toContainText('第 2 / 2 頁');await page.goBack();await expect(page.locator('#search-pagination')).toContainText('第 1 / 2 頁');
});
test('索引載入失敗有重試與章節入口',async({page})=>{
 await page.route('**/pagefind/**',route=>route.abort());await page.goto('questions/?q=test');await expect(page.locator('#search-message')).toContainText('搜尋暫時無法載入');await expect(page.getByRole('button',{name:'重試搜尋'})).toBeVisible();
});
test('問題頁圖片與影片外連',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成媒體');
 await page.goto('questions/qa-900001/');const img=page.locator('.prose img');await expect(img).toBeVisible();expect(await img.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
 await page.goto('questions/qa-900010/');await expect(page.locator('.video-card')).toHaveAttribute('rel','noopener noreferrer');
});
test('不執行搜尋字串中的 HTML',async({page})=>{
 await page.goto('questions/?q='+encodeURIComponent('<img src=x onerror=alert(1)>'));await expect(page.locator('#search-message')).toBeVisible();await expect(page.locator('#search-message img')).toHaveCount(0);
});
test('停用 JavaScript 仍可讀取問題與分頁',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(baseURL+'questions/');await expect(page.locator('#static-results .question-card').first()).toBeVisible();await page.locator('#static-results h2 a').first().click();await expect(page.locator('.answer h1')).toBeVisible();await context.close();
});
