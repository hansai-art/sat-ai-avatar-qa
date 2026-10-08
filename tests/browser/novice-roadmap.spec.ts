import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
const steps=JSON.parse(fs.readFileSync('src/data/install-steps.json','utf8'));
test.beforeEach(()=>test.skip(info.mode!=='production','安裝卡關地圖只用正式題目'));

test('安裝卡關地圖：每一步都有檢查點與可開啟的常見卡關',async({page,request})=>{
 await page.goto('install/');
 await expect(page.getByRole('heading',{name:'你卡在第幾步？',level:1})).toBeVisible();
 await expect(page.locator('.install-step')).toHaveCount(steps.length);
 for(const [index,step] of steps.entries()){
  const section=page.locator('#'+step.id);
  await expect(section.locator('h2')).toContainText(step.title);
  await expect(section.locator('.install-step-check')).toContainText('檢查點');
  const ids=await section.locator('.question-card').evaluateAll(cards=>cards.map(card=>card.getAttribute('data-question-id')));
  expect(ids).toEqual(step.questions);
  await expect(section.locator('.faq-meta').first()).not.toContainText('第 1 章');
  expect(index+1).toBeGreaterThan(0);
 }
 for(const id of steps.flatMap((s:any)=>s.questions))expect((await request.get('questions/'+id+'/')).status()).toBe(200);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('首頁安裝步驟可直接跳到那一步，搜尋時收起',async({page})=>{
 await page.goto('./');
 const card=page.locator('.install-steps');
 await expect(card).toBeVisible();
 await expect(card.locator('li')).toHaveCount(steps.length);
 await card.locator('li').nth(1).locator('a').click();
 await expect(page).toHaveURL(/install\/#step-2$/);
 await expect(page.locator('#step-2')).toBeInViewport();
 await page.goto('./?q=Telegram');
 await expect(page.locator('.install-steps')).toBeHidden();
});

test('手機首頁先看到精選題，安裝步驟排在精選題之後、星圖之前',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('./');await page.evaluate(()=>document.fonts.ready);
 const [starter,stepsBox,map]=await Promise.all([page.locator('#starter-questions').boundingBox(),page.locator('.install-steps').boundingBox(),page.locator('.star-map').boundingBox()]);
 expect(stepsBox!.y).toBeGreaterThanOrEqual(starter!.y+starter!.height-2);
 expect(map!.y).toBeGreaterThan(stepsBox!.y+stepsBox!.height);
 expect((await page.locator('#starter-questions .question-card h2').nth(1).boundingBox())!.y).toBeLessThan(844);
});

test('第 1 章與答案頁都能回到安裝卡關地圖',async({page})=>{
 await page.goto('chapters/ch01/');
 await expect(page.locator('.chapter-callout a')).toHaveAttribute('href',/install\/$/);
 await page.goto('questions/qa-000001/');
 const ref=page.locator('.install-step-ref');
 await expect(ref).toContainText(`安裝流程第 5 步，共 ${steps.length} 步`);
 await expect(ref.locator('a')).toHaveAttribute('href',/install\/#step-5$/);
 await page.goto('questions/qa-000009/');
 await expect(page.locator('.install-step-ref')).toHaveCount(0);
});

test('少見情況的截圖放在正文之後，不顯示未標示版本，也沒有露出粗體記號',async({page})=>{
 await page.goto('questions/qa-000054/');
 await expect(page.locator('#operation-images')).toHaveCount(0);
 const after=page.locator('#operation-images-after');
 await expect(after).toBeVisible();
 const heading=page.locator('.prose h2').last();
 await expect(heading).toContainText('少見情況');
 expect((await after.boundingBox())!.y).toBeGreaterThan((await heading.boundingBox())!.y);
 await expect(after).not.toContainText('未標示');
 await expect(after).not.toContainText('Q057');
 await expect(page.locator('.prose')).not.toContainText('**');
 await expect(page.locator('.prose strong').filter({hasText:'Allowed users'})).toHaveCount(1);
});

test('同學提問次數只算原始留言，求助格式用中文欄位並保留題號',async({page})=>{
 await page.goto('questions/qa-000003/');
 await expect(page.locator('.asked-count')).toHaveText('5 則同學提問');
 await page.locator('#feedback-no').click();
 const template=page.locator('#feedback-template');
 await expect(template).toHaveValue(/^題號（qa_id）：qa-000003\n/);
 await expect(template).toHaveValue(/卡在哪裡：答案看不懂/);
 await expect(template).not.toHaveValue(/answer-unclear/);
 await page.locator('#feedback-kind').selectOption('version-diff');
 await expect(template).toHaveValue(/卡在哪裡：版本或介面不同/);
 await expect(page.locator('#feedback-help')).not.toContainText('工作台');
});

// 首筆可以是任一個合理答案：「裝不起來」可能卡在安裝停住，也可能是 Windows 或舊電腦。
for(const [query,ids] of [['Hermes 要錢嗎',['qa-000003']],['Hermes 安裝失敗',['qa-000050','qa-000004']],['裝不起來',['qa-000050','qa-000004']],['登不進去',['qa-000051']],['直播重播',['qa-000035']],['蘋果電腦可以嗎',['qa-000004']]] as const)test('新手口語搜尋首筆：'+query,async({page})=>{
 await page.goto('./');await page.getByLabel('搜尋問題',{exact:true}).fill(query);await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('#result-list .question-card').first(),query).toHaveAttribute('data-question-id',new RegExp('^('+ids.join('|')+')$'));
});
