import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test.beforeEach(()=>test.skip(info.mode!=='production','正式學生資料驗收'));
test('常見預設、原地短答、全文與安全來源',async({page,baseURL})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');const first=page.locator('#result-list .question-card').first();
 await expect(first).toHaveAttribute('data-question-id','qa-000001');
 await expect(page.locator('.demo-banner')).toHaveCount(0);
 await expect(first.locator('.card-summary')).toBeHidden();await first.locator('summary').click();
 await expect(first.locator('.card-summary')).toContainText('BotFather');
 await expect(first.locator('.first-step')).toContainText('Start');
 await first.locator('.answer-link').click();await expect(page.locator('.answer h1')).toContainText('BotFather');
 await expect(page.locator('.sources')).toContainText('CLASS-03');
 await expect(page.locator('.sources')).toContainText('AI 編輯核對');
 await expect(page.locator('.sources a[href="https://sat.cool/classroom/201"]')).not.toHaveCount(0);
 const build=await (await page.request.get(baseURL+'build-info.json')).json();expect(build.mode).toBe('production');expect(build.searchableIds).toEqual(info.searchableIds);
 if(process.env.VERIFY_COMMIT)expect(build.commit).toBe(process.env.VERIFY_COMMIT);
 expect(errors).toEqual([]);
});
test('課程排序、用途交集與清空搜尋後恢復',async({page})=>{
 await page.goto('./?sort=course');
 await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000011');
 await page.getByLabel('概念理解',{exact:true}).check();
 await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000007');
 await page.getByLabel('課程章節',{exact:true}).selectOption('ch03');
 await expect(page.locator('#result-list .question-card')).toHaveCount(2);
 await page.reload();await expect(page.getByLabel('概念理解',{exact:true})).toBeChecked();await expect(page.getByLabel('課程章節',{exact:true})).toHaveValue('ch03');
 await page.getByRole('button',{name:'清除篩選',exact:true}).click();
 await page.getByLabel('搜尋問題',{exact:true}).fill('BotFather');await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('#sort-description')).toHaveText('依搜尋關聯排序');
 await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000001');
 await page.getByLabel('搜尋問題',{exact:true}).fill('');await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('#sort-description')).toHaveText('依章節與小節順序');
 await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000011');
});
for(const [query,id] of [['電腦要一直開嗎','qa-000005'],['BotFather','qa-000001'],['Gemini http','qa-000002'],['Harness Hermes','qa-000007'],['SEO 外掛','qa-000009']])test('真實問法搜尋：'+query,async({page})=>{
 await page.goto('./?q='+encodeURIComponent(query));
 if(query==='SEO 外掛'){
  // The broad query legitimately matches both the concept and installation.
  await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id',/^qa-0000(?:09|10)$/);
  await expect(page.locator('#result-list [data-question-id="qa-000009"]')).toBeVisible();
  await expect(page.locator('#result-list [data-question-id="qa-000010"]')).toBeVisible();
 }else await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id',id);
});
test('分頁、完整解法、返回後保留頁碼與閱讀位置',async({page})=>{
 await page.goto('./');await expect(page.locator('#search-pagination')).toBeVisible();await page.getByRole('button',{name:'下一頁'}).click();
 await expect(page.locator('#search-pagination')).toContainText('第 2 / 2 頁');
 const card=page.locator('#result-list .question-card').nth(3);await card.locator('summary').click();
 await card.locator('.answer-link').scrollIntoViewIfNeeded();const id=await card.getAttribute('data-question-id');const y=await page.evaluate(()=>scrollY);const url=page.url();
 await card.locator('.answer-link').click();await page.locator('#back-to-search').click();await expect(page).toHaveURL(url);
 await expect(page.locator(`[data-question-id="${id}"] details`).last()).toHaveAttribute('open','');
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(Math.max(0,y-80));
});
test('無結果可放寬篩選、保留關鍵字或回課程提問',async({page})=>{
 await page.goto('./?q=BotFather&intent=concept');await expect(page.locator('#search-message')).toContainText('沒有符合的問題');
 await expect(page.locator('#search-message a')).toHaveAttribute('href','https://sat.cool/course/201/comment');
 await page.getByRole('button',{name:'清除篩選，保留關鍵字'}).click();await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue('BotFather');
 await expect(page.locator('#result-list .question-card')).toHaveCount(1);
});
test('手機首屏兩個題名、展開與操作區無溢出',async({page})=>{
 for(const width of [360,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('./');await expect(page.locator('#result-list .question-card').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,second:document.querySelectorAll('#result-list h2')[1].getBoundingClientRect().bottom,font:parseFloat(getComputedStyle(document.querySelector('#result-list h2')!).fontSize)}));
  expect(metrics.width).toBeLessThanOrEqual(width);expect(metrics.second).toBeLessThan(844);expect(metrics.font).toBeGreaterThanOrEqual(16);
  await page.locator('#result-list summary').first().focus();await page.keyboard.press('Enter');await expect(page.locator('#result-list .card-summary').first()).toBeVisible();
  await page.locator('.filter-panel summary').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const locator of [page.getByRole('button',{name:'搜尋',exact:true}),page.locator('.intent-switch label span').first(),page.locator('#result-list summary').first()])expect((await locator.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 }
});

test('選章後跨章題依當前章的小節排序',async({page})=>{
 await page.goto('./?sort=course&chapter=ch09');
 await expect(page.locator('#result-list .question-card')).toHaveCount(3);
 expect(await page.locator('#result-list .question-card').evaluateAll(els=>els.map(e=>(e as HTMLElement).dataset.questionId))).toEqual(['qa-000016','qa-000020','qa-000015']);
});
