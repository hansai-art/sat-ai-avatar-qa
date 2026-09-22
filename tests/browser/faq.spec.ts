import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
const formal=fs.readdirSync('src/content/questions').filter(f=>f.endsWith('.md')).map(f=>{const raw=fs.readFileSync('src/content/questions/'+f,'utf8');return {id:f.slice(0,-3),data:Object.fromEntries(raw.split('---')[1].trim().split('\n').map(line=>{const p=line.indexOf(': ');return [line.slice(0,p),JSON.parse(line.slice(p+2))];}))};});
const countWhere=(chapter='',type='',tool='')=>formal.filter(q=>(!chapter||q.data.chapterRefs.includes(chapter))&&(!type||q.data.type===type)&&(!tool||q.data.toolRefs.includes(tool))).length;
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
 await page.getByLabel('課程章節',{exact:true}).selectOption('ch03');await expect(page.locator('#result-list .question-card')).toHaveCount(countWhere('ch03','concept'));
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
 await page.goto('./');await expect(page.locator('#search-pagination')).toBeVisible();await page.getByRole('button',{name:'下一頁'}).click();await expect(page.locator('#search-pagination')).toContainText(`第 2 / ${Math.ceil(info.searchableIds.length/12)} 頁`);
 const card=page.locator('#result-list .question-card').nth(3);await card.scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY),url=page.url();
 await card.locator('a').click();await page.locator('#back-to-search').click();await expect(page).toHaveURL(url);
 await expect(page.locator('#search-pagination')).toContainText(`第 2 / ${Math.ceil(info.searchableIds.length/12)} 頁`);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(Math.max(0,y-80));
});
test('無結果可放寬篩選、保留關鍵字或回課程提問',async({page})=>{
 await page.goto('./?q=BotFather&type=account-billing');await expect(page.locator('#search-message')).toContainText('沒有符合的問題');
 await expect(page.locator('#search-message a')).toHaveAttribute('href','https://sat.cool/course/201/comment');await page.getByRole('button',{name:'清除篩選，保留關鍵字'}).click();
 await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue('BotFather');await expect(page.locator('#result-list [data-question-id="qa-000001"]')).toBeVisible();
});
test('三維篩選題數等於交集，零題隱藏，列表與全文同一分類',async({page})=>{
 await page.goto('./');await expect(page.locator('#result-count')).toHaveText(`找到 ${info.searchableIds.length} 個問題`);
 await page.locator('.filter-panel summary').click();await expect(page.locator('.filters select')).toHaveCount(3);
 await page.getByLabel('課程章節',{exact:true}).selectOption('ch01');await expect(page.locator('#result-count')).toHaveText(`找到 ${countWhere('ch01')} 個問題`);
 await page.getByLabel('問題分類',{exact:true}).selectOption('troubleshooting');await expect(page.locator('#result-count')).toHaveText(`找到 ${countWhere('ch01','troubleshooting')} 個問題`);
 await expect(page.locator('select[name=tool] option[value=telegram]')).toHaveText(`Telegram（${countWhere('ch01','troubleshooting','telegram')} 題）`);
 await page.getByLabel('使用工具',{exact:true}).selectOption('telegram');await expect(page.locator('#result-count')).toHaveText(`找到 ${countWhere('ch01','troubleshooting','telegram')} 個問題`);
 await expect(page.locator('select[name=chapter] option[value=ch02]')).toHaveAttribute('hidden','');
 await expect(page.locator('#result-list .category-label').first()).toHaveText('錯誤排除');await page.locator('#result-list .question-card-link').first().click();
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
 await expect(page.locator('#lesson-ch01-01')).toContainText('完整案例');
});
test('手機首屏兩個題名、主要點擊區和答案頁無溢出',async({page})=>{
 for(const width of [360,390,430]){
  await page.setViewportSize({width,height:844});await page.goto('./');await expect(page.locator('#result-list .question-card').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,second:document.querySelectorAll('#starter-questions .question-card h2')[1].getBoundingClientRect().bottom,font:parseFloat(getComputedStyle(document.querySelector('#starter-questions .question-card h2')!).fontSize)}));
  expect(metrics.width).toBeLessThanOrEqual(width);expect(metrics.second).toBeLessThan(844);expect(metrics.font).toBeGreaterThanOrEqual(18);
  await expect(page.locator('.filter-panel')).not.toHaveAttribute('open','');
  for(const locator of [page.getByRole('button',{name:'搜尋',exact:true}),page.locator('.browse-entries a').first(),page.locator('#starter-questions .question-card-link').first()])expect((await locator.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.locator('.filter-panel summary').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('questions/qa-000001/');await expect(page.locator('.mobile-toc,.article-aside,[data-toc-link]')).toHaveCount(0);
  await page.evaluate(()=>document.fonts.ready);
  expect((await page.locator('.prose ol>li').nth(1).boundingBox())!.y+(await page.locator('.prose ol>li').nth(1).boundingBox())!.height).toBeLessThan(844);
  await expect(page.locator('.mobile-chapters')).not.toHaveAttribute('open','');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.prose').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBe(16);
 }
});
test('選章後跨章題依當前章的小節排序',async({page})=>{
 await page.goto('./?sort=course&chapter=ch09');await expect(page.locator('#result-list .question-card')).toHaveCount(countWhere('ch09'));
 const ids=await page.locator('#result-list .question-card').evaluateAll(els=>els.map(e=>(e as HTMLElement).dataset.questionId));
 const chapter=taxonomy.chapters.find((c:any)=>c.id==='ch09');
 const keys=ids.map(id=>{const q=formal.find(q=>q.id===id)!;return Math.min(...chapter.lessons.filter((l:any)=>q.data.lessonRefs.includes(l.id)).map((l:any)=>l.order),99);});
 expect(keys).toEqual([...keys].sort((a,b)=>a-b));
 expect(new Set(ids)).toEqual(new Set(formal.filter(q=>q.data.chapterRefs.includes('ch09')).map(q=>q.id)));
});
test('所有答案均有直接入口與匿名來源，編輯註記不進正文',async({page})=>{
 test.setTimeout(120000);
 for(const id of info.searchableIds){
  await page.goto('questions/'+id+'/');await expect(page.locator('.short-answer strong')).not.toBeEmpty();await expect(page.locator('.next-links a').first()).toHaveAttribute('href',/^https:\/\//);
  await expect(page.locator('.source-content')).toBeHidden();await expect(page.locator('.prose')).not.toContainText('## 對應課程');
  await expect(page.locator('.prose')).not.toContainText('提供的紀錄沒有最後解決結果');await expect(page.locator('[data-pagefind-meta^="askedBy"]')).toHaveCount(0);
  await expect(page.getByText('這一頁的內容',{exact:true})).toHaveCount(0);
  await expect(page.locator('.first-step,.operation-path,.short-answer h2')).toHaveCount(0);
  await expect(page.locator('.related-questions .question-card')).toHaveCount(0);
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.next-links a[href="https://sat.cool/course/201/comment"]')).toBeVisible();
 }
});

test('桌機直接呈現解法，無目錄或重複步驟區，相關題目只有標題',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('questions/qa-000002/');await page.evaluate(()=>document.fonts.ready);
 expect((await page.locator('.answer').boundingBox())!.width).toBeLessThanOrEqual(720);
 await expect(page.locator('.sidebar .chapter-nav.active')).toContainText('第 1 章');
 await expect(page.locator('.mobile-toc,.article-aside,[data-toc-link],.first-step,.operation-path')).toHaveCount(0);
 await expect(page.locator('.prose ol>li').first()).toContainText('Settings → Providers');
 const related=page.locator('.related-links a').first();await expect(related).toHaveAttribute('href',/questions\/qa-\d+\//);
 expect((await related.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 const target=await related.getAttribute('href');await related.click();expect(new URL(page.url()).pathname).toBe(target);
 await page.goto('questions/qa-000001/#conclusion');await expect(page.locator('#conclusion')).toBeInViewport();
});

for(const [query,id] of [['HTTP 429','qa-000053'],['pairing code','qa-000055'],['沒有登入','qa-000051'],['沒有授權','qa-000051'],['安裝卡住','qa-000050'],['需求遺漏','qa-000058'],['記帳','qa-000037'],['人資','qa-000048'],['Google Drive','qa-000049']])test('新增學生問法可找到答案：'+query,async({page})=>{await page.goto('./?q='+encodeURIComponent(query));await expect(page.locator('#result-list [data-question-id="'+id+'"]')).toBeVisible();});

test('中文否定問法替代搜尋保留網址與分類交集',async({page})=>{await page.goto('./?q='+encodeURIComponent('沒有登入')+'&type=setup');await expect(page.locator('#result-list [data-question-id="qa-000051"]')).toBeVisible();await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue('沒有登入');expect(new URL(page.url()).searchParams.get('q')).toBe('沒有登入');await expect(page.locator('#result-list .category-label').first()).toHaveText('安裝與設定');await page.reload();await expect(page.locator('#result-list [data-question-id="qa-000051"]')).toBeVisible();});
