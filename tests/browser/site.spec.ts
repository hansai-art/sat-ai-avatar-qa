import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test('首頁、章節與行動版沒有整頁溢出',async({page})=>{
 await page.goto('./');await expect(page.getByRole('heading',{name:'你卡在哪一步？'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await expect(page.locator('#static-results .question-card')).toHaveCount(info.searchableIds.length);
 await page.goto('chapters/ch01/');await expect(page.getByRole('heading',{name:'第 1 章',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'本章小節'})).toBeVisible();
});
test('搜尋、篩選交集與 URL 還原',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成示範題');
 await page.goto('questions/');await page.getByLabel('搜尋問題',{exact:true}).fill('429');await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('#result-count')).toHaveText('找到 1 個問題');await expect(page.locator('#result-list')).toContainText('HTTP 429');
 await page.getByLabel('課程順序',{exact:true}).check();await page.getByLabel('課程章節',{exact:true}).selectOption('ch02');await expect(page.locator('#search-message')).toContainText('沒有符合的問題');
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
 await page.goto('questions/qa-900001/');const img=page.locator('.prose img');await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
 await page.goto('questions/qa-900010/');await expect(page.locator('.video-card')).toHaveAttribute('rel','noopener noreferrer');
});
test('不執行搜尋字串中的 HTML',async({page})=>{
 let dialogOpened=false;page.on('dialog',async dialog=>{dialogOpened=true;await dialog.dismiss();});
 const query='<img src=x onerror=alert(1)>';
 await page.goto('questions/?q='+encodeURIComponent(query));
 await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue(query);
 await expect(page.locator('#result-count')).toHaveText(/找到 \d+ 個問題/);
 await expect(page.locator('#live-results')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#live-results img')).toHaveCount(0);expect(dialogOpened).toBe(false);
});
test('停用 JavaScript 仍可讀取完整列表與問題',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(baseURL!);await expect(page.locator('#static-results .question-card')).toHaveCount(info.searchableIds.length);await page.locator('#static-results summary').first().click();await page.locator('#static-results .answer-link').first().click();await expect(page.locator('.answer h1')).toBeVisible();await context.close();
});
test('公開示範提示、固定網址與部署版本',async({page,request,baseURL})=>{
 test.skip(info.mode!=='demo','此案例驗證示範部署');
 const response=await page.goto('./');expect(response?.status()).toBe(200);
 await expect(page.locator('.demo-banner')).toContainText('非正式課程答案');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
 const build=await (await request.get(baseURL+'build-info.json')).json();
 expect(build.mode).toBe('demo');expect(build.searchableIds).toHaveLength(15);
 if(process.env.VERIFY_COMMIT)expect(build.commit).toBe(process.env.VERIFY_COMMIT);
 if(process.env.VERIFY_URL){
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',baseURL!);
  expect(await (await request.get(baseURL+'sitemap.xml')).text()).not.toContain('<loc>');
 }
});
test('TG 別名及章節、工具、類型交叉篩選',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成示範題');
 await page.goto('questions/?q=TG');await expect(page.locator('#result-count')).toHaveText('找到 1 個問題');
 await page.getByLabel('搜尋問題',{exact:true}).fill('');
 await page.getByLabel('課程順序',{exact:true}).check();await page.getByLabel('課程章節',{exact:true}).selectOption('ch01');
 await page.locator('.filter-panel summary').click();
 await page.getByLabel('使用工具',{exact:true}).selectOption('hermes-agent');
 await page.getByLabel('問題類型',{exact:true}).selectOption('setup');
 await expect(page.getByLabel('課程小節',{exact:true})).toBeHidden();
 await expect(page.locator('#result-list')).toContainText('安裝問題應該附上哪些資訊');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.reload();await expect(page.getByLabel('課程章節',{exact:true})).toHaveValue('ch01');await expect(page.locator('#filter-summary')).toContainText('Hermes');
});
test('單題直接載入、圖片原尺寸與複製連結',async({page,context,baseURL})=>{
 test.skip(info.mode!=='demo','此案例使用合成媒體');
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.goto('questions/qa-900001/');await page.reload();
 await expect(page.locator('.answer h1')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 const img=page.locator('.prose img');await expect(img).toBeVisible();
 await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
 const popupPromise=page.waitForEvent('popup');await img.click();const popup=await popupPromise;
 await popup.waitForLoadState();expect(popup.url()).toContain('/_astro/');await popup.close();
 await page.getByRole('button',{name:'複製這題連結'}).click();await expect(page.locator('#copy-status')).toHaveText('已複製連結');
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(baseURL+'questions/qa-900001/');
});
test('影片卡片開啟標示清楚的示例外連',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用格式示例');
 await page.goto('questions/qa-900010/');const card=page.locator('.video-card');
 await expect(card).toContainText('不是實際課程影片');await expect(card).toHaveAttribute('href','https://example.org/');
 const popupPromise=page.waitForEvent('popup');await card.click();const popup=await popupPromise;
 await popup.waitForLoadState();expect(new URL(popup.url()).origin).toBe('https://example.org');await popup.close();
});
test('草稿與不存在的頁面回傳 404 並保留入口',async({page})=>{
 for(const path of ['questions/qa-900016/','does-not-exist/']){
  const response=await page.goto(path);expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading',{name:'這個頁面不存在'})).toBeVisible();
  await expect(page.getByRole('link',{name:'搜尋問題',exact:true})).toBeVisible();
 }
});

test('首頁搜尋片段、放寬條件保留關鍵字、返回搜尋',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成示範題');
 await page.goto('./?q=429&chapter=ch02');
 await page.getByRole('button',{name:'清除篩選，保留關鍵字'}).click();
 await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue('429');
 await expect(page.locator('#result-count')).toHaveText('找到 1 個問題');
 await page.locator('#result-list summary').first().click();await expect(page.locator('#result-list mark').first()).toContainText('429');
 // Returning to search must work before the detail page's external scripts load.
 await page.route('**/_astro/*.js',route=>route.abort());
 const searchURL=page.url();await page.locator('#result-list .answer-link').first().click();
 await page.locator('#back-to-search').click();await expect(page).toHaveURL(searchURL);
});
test('完整列表與搜尋結果皆將延伸問題排後，第一章小節網址保留',async({page})=>{
 test.skip(info.mode!=='demo','此案例使用合成示範題');
 await page.goto('./');await expect(page.locator('#static-results .question-card').last()).toHaveAttribute('data-question-id','qa-900015');
 await expect(page.locator('#static-results .question-card').last()).toContainText('示範 · 延伸問題');
 await page.goto('./?sort=updated&page=2');await expect(page.locator('#result-list .question-card').last()).toHaveAttribute('data-question-id','qa-900015');
 await page.goto('./?lesson=ch01-03');await expect(page.getByLabel('課程章節',{exact:true})).toHaveValue('ch01');
 await expect(page).toHaveURL(/lesson=ch01-03/);await expect(page.getByLabel('課程小節',{exact:true})).toHaveValue('ch01-03');
});
test('手機首屏可看見第一題，複製按鈕靠近標題',async({page})=>{
 await page.goto('./');const first=page.locator('#result-list .question-card').first();await expect(first).toBeVisible();
 expect(await first.evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(600);
 await first.locator('summary').click();await first.locator('.answer-link').click();
 await expect(page.locator('#copy-link')).toBeVisible();
 const gap=await page.evaluate(()=>document.querySelector('#copy-link')!.getBoundingClientRect().top-document.querySelector('.answer h1')!.getBoundingClientRect().bottom);
 expect(gap).toBeLessThan(150);
});

test('返回搜尋拒絕外站及非搜尋路徑',async({page,baseURL})=>{
 await page.goto('./');
 for(const value of ['https://example.org/','/unrelated/','javascript:alert(1)']){
  await page.evaluate(value=>sessionStorage.setItem('qa-last-search',value),value);
  await page.goto('questions/'+info.searchableIds[0]+'/');
  expect(await page.locator('#back-to-search').evaluate((el:HTMLAnchorElement)=>el.href)).toBe(baseURL+'questions/');
 }
});
