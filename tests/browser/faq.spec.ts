import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
const taxonomy=JSON.parse(fs.readFileSync('src/data/taxonomy.json','utf8'));
test.beforeEach(()=>test.skip(info.mode!=='production','正式學生資料驗收'));
test('首頁兩個入口、固定十題、整張卡片與收合來源',async({page,baseURL})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');await expect(page.locator('#result-list .question-card').first()).toBeVisible();
 await expect(page.locator('.browse-entries a')).toHaveCount(2);await expect(page.locator('#starter-questions .question-card')).toHaveCount(10);
 await expect(page.locator('.demo-banner')).toHaveCount(0);
 const first=page.locator('#starter-questions .question-card').first();await expect(first).toHaveAttribute('data-question-id','qa-000001');
 await expect(first.locator('.card-conclusion')).toContainText('BotFather');await expect(first.locator('details,.first-step')).toHaveCount(0);
 await first.locator('a').click();await expect(page.locator('.answer h1')).toContainText('BotFather');
 await expect(page.locator('#source-records')).not.toHaveAttribute('open','');await expect(page.locator('.source-content')).toBeHidden();
 await expect(page.locator('.prose')).not.toContainText('提供的紀錄沒有最後解決結果');
 await page.locator('#source-records summary').click();await expect(page.locator('.source-content')).toContainText('CLASS-03');await expect(page.locator('.source-content')).toContainText('學員提問（已匿名）');
 await expect(page.locator('.source-content')).toContainText('AI 編輯核對');
 const build=await (await page.request.get(baseURL+'build-info.json')).json();expect(build.mode).toBe('production');expect(build.searchableIds).toEqual(info.searchableIds);
 if(process.env.VERIFY_COMMIT)expect(build.commit).toBe(process.env.VERIFY_COMMIT);
 expect(errors).toEqual([]);
});
test('課程排序、分類交集與清空搜尋後恢復',async({page})=>{
 await page.goto('./?sort=course');await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000011');
 await page.locator('.filter-panel summary').click();await page.getByLabel('問題分類',{exact:true}).selectOption('concept');
 await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000007');
 await page.getByLabel('課程章節',{exact:true}).selectOption('ch03');await expect(page.locator('#result-list .question-card')).toHaveCount(2);
 await page.reload();await expect(page.getByLabel('問題分類',{exact:true})).toHaveValue('concept');
 await page.getByRole('button',{name:'清除篩選',exact:true}).click();
 await page.getByLabel('搜尋問題',{exact:true}).fill('BotFather');await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('#sort-description')).toHaveText('依搜尋關聯排序');await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000001');
 await page.getByLabel('搜尋問題',{exact:true}).fill('');await page.getByRole('button',{name:'搜尋',exact:true}).click();await expect(page.locator('#sort-description')).toHaveText('依章節與小節順序');
 await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id','qa-000011');
});
for(const [query,id] of [['電腦要一直開嗎','qa-000005'],['BotFather','qa-000001'],['Gemini http','qa-000002'],['Harness Hermes','qa-000007'],['SEO 外掛','qa-000009']])test('真實問法搜尋：'+query,async({page})=>{
 await page.goto('./?q='+encodeURIComponent(query));
 if(query==='SEO 外掛'){
  await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id',/^qa-0000(?:09|10)$/);
  await expect(page.locator('#result-list [data-question-id="qa-000009"]')).toBeVisible();await expect(page.locator('#result-list [data-question-id="qa-000010"]')).toBeVisible();
 }else await expect(page.locator('#result-list .question-card').first()).toHaveAttribute('data-question-id',id);
});
test('分頁、完整解法、返回後保留頁碼與閱讀位置',async({page})=>{
 await page.goto('./');await expect(page.locator('#search-pagination')).toBeVisible();await page.getByRole('button',{name:'下一頁'}).click();await expect(page.locator('#search-pagination')).toContainText('第 2 / 2 頁');
 const card=page.locator('#result-list .question-card').nth(3);await card.scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY),url=page.url();
 await card.locator('a').click();await page.locator('#back-to-search').click();await expect(page).toHaveURL(url);
 await expect(page.locator('#search-pagination')).toContainText('第 2 / 2 頁');await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(Math.max(0,y-80));
});
test('無結果可放寬篩選、保留關鍵字或回課程提問',async({page})=>{
 await page.goto('./?q=BotFather&type=account-billing');await expect(page.locator('#search-message')).toContainText('沒有符合的問題');
 await expect(page.locator('#search-message a')).toHaveAttribute('href','https://sat.cool/course/201/comment');await page.getByRole('button',{name:'清除篩選，保留關鍵字'}).click();
 await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue('BotFather');await expect(page.locator('#result-list [data-question-id="qa-000001"]')).toBeVisible();
});
test('三維篩選題數等於交集，零題隱藏，列表與全文同一分類',async({page})=>{
 await page.goto('./');await expect(page.locator('#result-count')).toHaveText('找到 22 個問題');
 await page.locator('.filter-panel summary').click();await expect(page.locator('.filters select')).toHaveCount(3);
 await page.getByLabel('課程章節',{exact:true}).selectOption('ch01');await expect(page.locator('#result-count')).toHaveText('找到 8 個問題');
 await page.getByLabel('問題分類',{exact:true}).selectOption('troubleshooting');await expect(page.locator('#result-count')).toHaveText('找到 2 個問題');
 await expect(page.locator('select[name=tool] option[value=telegram]')).toHaveText('Telegram（1 題）');
 await page.getByLabel('使用工具',{exact:true}).selectOption('telegram');await expect(page.locator('#result-count')).toHaveText('找到 1 個問題');
 await expect(page.locator('select[name=chapter] option[value=ch02]')).toHaveAttribute('hidden','');
 await expect(page.locator('#result-list .category-label')).toHaveText('錯誤排除');await page.locator('#result-list .question-card-link').click();
 await expect(page.locator('.answer-meta .category-label')).toHaveText('錯誤排除');
});
test('每章依小節分組且不遺漏，第 1 章包含安裝與手機設定',async({page})=>{
 for(const chapter of taxonomy.chapters){
  const count=info.searchableIds.filter((id:string)=>JSON.parse(fs.readFileSync('src/content/questions/'+id+'.md','utf8').match(/^chapterRefs: (.+)$/m)![1]).includes(chapter.id)).length;
  if(!count)continue;
  await page.goto('chapters/'+chapter.id+'/');
  const ids=await page.locator('.lesson-group .question-card').evaluateAll(els=>els.map(e=>e.getAttribute('data-question-id')));
  expect(new Set(ids).size).toBe(count);
  for(const section of await page.locator('.lesson-group').all())expect(await section.locator('.question-card').count()).toBeGreaterThan(0);
 }
 await page.goto('chapters/ch01/');await expect(page.locator('#lesson-ch01-03')).toContainText('Windows');await expect(page.locator('#lesson-ch01-05')).toContainText('BotFather');
 await expect(page.locator('#lesson-ch01-01')).toHaveCount(0);
});
test('手機首屏兩個題名、主要點擊區和答案頁無溢出',async({page})=>{
 for(const width of [360,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('./');await expect(page.locator('#result-list .question-card').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,second:document.querySelectorAll('#starter-questions .question-card h2')[1].getBoundingClientRect().bottom,font:parseFloat(getComputedStyle(document.querySelector('#starter-questions .question-card h2')!).fontSize)}));
  expect(metrics.width).toBeLessThanOrEqual(width);expect(metrics.second).toBeLessThan(844);expect(metrics.font).toBeGreaterThanOrEqual(18);
  await expect(page.locator('.filter-panel')).not.toHaveAttribute('open','');
  for(const locator of [page.getByRole('button',{name:'搜尋',exact:true}),page.locator('.browse-entries a').first(),page.locator('#starter-questions .question-card-link').first()])expect((await locator.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.locator('.filter-panel summary').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('questions/qa-000001/');await expect(page.locator('.mobile-toc')).not.toHaveAttribute('open','');
  await expect(page.locator('.mobile-chapters')).not.toHaveAttribute('open','');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.prose').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBe(16);
 }
});
test('選章後跨章題依當前章的小節排序',async({page})=>{
 await page.goto('./?sort=course&chapter=ch09');await expect(page.locator('#result-list .question-card')).toHaveCount(3);
 expect(await page.locator('#result-list .question-card').evaluateAll(els=>els.map(e=>(e as HTMLElement).dataset.questionId))).toEqual(['qa-000016','qa-000020','qa-000015']);
});
test('所有答案均有直接入口與匿名來源，編輯註記不進正文',async({page})=>{
 for(const id of info.searchableIds){
  await page.goto('questions/'+id+'/');await expect(page.locator('.short-answer strong')).not.toBeEmpty();await expect(page.locator('.next-links a').first()).toHaveAttribute('href',/^https:\/\//);
  await expect(page.locator('.source-content')).toBeHidden();await expect(page.locator('.prose')).not.toContainText('## 對應課程');
  await expect(page.locator('.prose')).not.toContainText('提供的紀錄沒有最後解決結果');await expect(page.locator('[data-pagefind-meta^="askedBy"]')).toHaveCount(0);
 }
});

test('桌機目錄標示中文小標與頁尾段落，正文限制寬度',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('questions/qa-000002/');await page.evaluate(()=>document.fonts.ready);
 expect((await page.locator('.answer').boundingBox())!.width).toBeLessThanOrEqual(720);
 await expect(page.locator('.sidebar .chapter-nav.active')).toContainText('第 1 章');
 await page.locator('.article-aside').getByRole('link',{name:'依這個順序排查',exact:true}).click();
 await expect(page.locator('[data-toc-link][aria-current=location]')).toHaveText('依這個順序排查');
 await page.locator('.article-aside a[href="#related-questions"]').click();
 await expect(page.locator('[data-toc-link][aria-current=location]')).toHaveText('你可能也會遇到');
});
