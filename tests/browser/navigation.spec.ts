import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test.beforeEach(()=>test.skip(info.mode!=='production','正式題庫導覽驗收'));

test('首頁只有十題，搜尋收起入口與排序並把結果移入視窗',async({page})=>{
 await page.goto('./');await expect(page.locator('#starter-questions .question-card')).toHaveCount(10);
 await expect(page.locator('#all-questions')).toBeHidden();await expect(page.getByRole('link',{name:`看全部 ${info.searchableIds.length} 題`})).toHaveAttribute('href',/questions\/$/);
 await page.getByLabel('搜尋問題',{exact:true}).fill('token');await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('#result-list .question-card').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.browse-entries')).toBeHidden();await expect(page.locator('.browse-switch')).toBeHidden();await expect(page.locator('#starter-questions')).toBeHidden();
 expect((await page.locator('#result-list .question-card').first().boundingBox())!.y).toBeLessThan(350);await expect(page.getByLabel('搜尋問題',{exact:true})).toBeInViewport();
 await page.getByLabel('搜尋問題',{exact:true}).fill('');await page.getByRole('button',{name:'搜尋',exact:true}).click();
 await expect(page.locator('.browse-entries')).toBeVisible();await expect(page.locator('.browse-switch')).toBeHidden();await expect(page.locator('#starter-questions .question-card')).toHaveCount(10);await expect(page.locator('#all-questions')).toBeHidden();
});
for(const query of ['沒反應','沒回應','不回','卡住','當掉','跑不動','轉圈圈'])test('口語同義詞：'+query,async({page})=>{
 await page.goto('./?q='+encodeURIComponent(query));await expect(page.locator('#result-list [data-question-id="qa-000054"]')).toBeVisible();
});
test('零結果提供可執行的換說法與留言入口',async({page})=>{
 await page.goto('./?q='+encodeURIComponent('木星香蕉火箭'));await expect(page.locator('#search-message')).toContainText('換個說法試試');
 await expect(page.locator('#search-message .answer-link')).toHaveAttribute('href','https://sat.cool/course/201/comment');
 await page.locator('.search-suggestions').getByRole('button',{name:'沒回應',exact:true}).click();
 await expect(page.locator('#result-list [data-question-id="qa-000054"]')).toBeVisible();await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue('沒回應');
});
test('未解決展開一次相關題目與可複製求助格式，不假裝已送出',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('questions/qa-000001/');
 await expect(page.locator('#feedback-help')).toBeHidden();await page.locator('#feedback-no').click();
 await expect(page.locator('#feedback-help')).toBeVisible();await expect(page.locator('#related-questions')).toHaveCount(1);
 await expect(page.locator('#feedback-template')).toHaveValue(/BotFather[\s\S]*作業系統與版本：[\s\S]*做到第幾步：[\s\S]*錯誤訊息/);
 await page.locator('#copy-question').click();await expect(page.locator('#feedback-status')).toContainText('已複製');
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('questions/qa-000001/');
 await expect(page.locator('#feedback-help')).toContainText('這裡不會送出回饋');await expect(page.locator('.lesson-reference')).toContainText('1-5');
 await page.locator('#feedback-yes').click();await expect(page.locator('#feedback-help')).toBeHidden();await expect(page.locator('#feedback-status')).toContainText('不會送出資料');
});
test('章節具名，手機可回課程與看說明，上次閱讀可清除',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('chapters/ch02/');
 await page.goto('./');await expect(page.locator('#continue-chapter')).toContainText('第 2 章・');await expect(page.locator('#continue-question')).toContainText('這章常見');
 await page.locator('.mobile-menu summary').click();await expect(page.getByRole('navigation',{name:'手機主選單'}).getByRole('link',{name:'回到課程'})).toHaveAttribute('href','https://sat.cool/classroom/201');await expect(page.getByRole('navigation',{name:'手機主選單'}).getByRole('link',{name:'使用說明'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.mobile-menu summary').click();await page.locator('#clear-progress').click();await expect(page.locator('#continue-learning')).toBeHidden();await page.reload();await expect(page.locator('#continue-learning')).toBeHidden();
 await expect(page.locator('#starter-questions .faq-meta').first()).toContainText('第 1 章・');
});

test('首頁精選看完答案返回，仍留在原本閱讀位置',async({page})=>{
 await page.goto('./');await page.evaluate(()=>document.fonts.ready);const card=page.locator('#starter-questions .question-card').nth(7);await card.scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY);
 await card.locator('a').click();await page.locator('#back-to-search').click();await expect(page.locator('#starter-questions')).toBeVisible();await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(y-80);
});
