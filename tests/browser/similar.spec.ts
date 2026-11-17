import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test.beforeEach(()=>test.skip(info.mode!=='production','正式題庫的相似問題與其他同學提問驗收'));

test('電腦版右側固定顯示相似問題，捲動後仍在畫面上',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop','右側欄只在電腦版');
 await page.setViewportSize({width:1280,height:720});await page.goto('questions/qa-000051/');await page.evaluate(()=>document.fonts.ready);
 const rail=page.locator('.similar-rail'),answer=page.locator('.answer');
 await expect(rail).toBeVisible();await expect(page.locator('.similar-bottom')).toBeHidden();
 await expect(rail.getByRole('heading',{name:'相似問題'})).toBeVisible();
 expect(await rail.locator('.similar-link').count()).toBeGreaterThanOrEqual(6);
 const railBox=(await rail.boundingBox())!,answerBox=(await answer.boundingBox())!;
 expect(railBox.x).toBeGreaterThan(answerBox.x+answerBox.width);
 expect(answerBox.width).toBeGreaterThanOrEqual(600);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // 頁首頭像和左側章節欄的文字對齊同一條線
 const brand=(await page.locator('.brand').boundingBox())!,nav=(await page.locator('.sidebar .nav-overview').first().boundingBox())!;
 expect(Math.abs(brand.x-(nav.x+12))).toBeLessThanOrEqual(2);
 await page.locator('#peer-cases').scrollIntoViewIfNeeded();await expect(rail).toBeInViewport();
 await expect(rail.locator('.similar-more')).toHaveAttribute('href',/chapters\/ch01\/$/);
 const first=rail.locator('.similar-link').first(),target=await first.getAttribute('href');
 await first.click();expect(new URL(page.url()).pathname).toBe(target);
});

test('寬螢幕問題頁加寬，答案欄最多 760px',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop','只驗電腦版');
 await page.setViewportSize({width:1920,height:1080});await page.goto('questions/qa-000060/');await page.evaluate(()=>document.fonts.ready);
 const answer=(await page.locator('.answer').boundingBox())!,rail=(await page.locator('.similar-rail').boundingBox())!;
 expect(answer.width).toBeLessThanOrEqual(760);expect(rail.width).toBeGreaterThanOrEqual(300);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('手機版不顯示右側欄，相似問題接在延伸補充後面',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='mobile','只驗手機版');
 await page.goto('questions/qa-000051/');await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.similar-rail')).toBeHidden();
 const bottom=page.locator('.similar-bottom');await expect(bottom).toBeVisible();
 expect(await bottom.locator('.similar-link').count()).toBeGreaterThanOrEqual(3);
 for(const link of await bottom.locator('.similar-link').all())expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 const supplement=(await page.getByRole('region',{name:'延伸補充',exact:true}).boundingBox())!,bottomBox=(await bottom.boundingBox())!;
 expect(bottomBox.y).toBeGreaterThan(supplement.y+supplement.height-1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('有同類留言的題目列出其他同學也遇到的狀況，標明是整理者轉述',async({page})=>{
 await page.goto('questions/qa-000051/');
 const peers=page.locator('#peer-cases');
 await expect(peers.getByRole('heading',{name:'其他同學也遇到'})).toBeVisible();
 await expect(peers.locator('.peer-case')).toHaveCount(4);
 await expect(peers.locator('.peer-case').first()).toContainText('同學問過');
 await expect(peers.locator('.peer-case').first().locator('time')).toHaveAttribute('datetime','2026-09-17');
 await expect(peers.locator('.peer-case .instructor-badge')).toHaveCount(0);
 await expect(page.locator('.supplement-note')).toContainText('不是講師在課堂的原始回覆');
 await page.locator('#source-records summary').click();
 await expect(page.locator('.source-content')).toContainText('提問內容由整理者轉述，回答不是講師原話');
 await expect(page.locator('.peer-related')).toHaveCount(0);
});

test('沒有同類留言的題目，帶出最相近的兩題同學提問與講師回覆節錄',async({page})=>{
 await page.goto('questions/qa-000060/');
 const related=page.locator('.peer-related');
 await expect(related.getByRole('heading',{name:'其他同學也問過'})).toBeVisible();
 await expect(related.locator('.peer-case')).toHaveCount(2);
 await expect(related.locator('.peer-reply .instructor-badge').first()).toHaveText('講師回覆');
 const bottomIds=await page.locator('.similar-bottom .similar-link').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
 const previewIds=await related.locator('.peer-link').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
 expect(previewIds.some(id=>bottomIds.includes(id))).toBe(false);
 const link=related.locator('.peer-link').first(),target=await link.getAttribute('href');
 // 整張卡都能點：點在學員原文節錄上也會進到那一題
 const quoteLocator=related.locator('.peer-case').first().locator('.peer-quote');await quoteLocator.scrollIntoViewIfNeeded();
 const quote=(await quoteLocator.boundingBox())!;
 await page.mouse.click(quote.x+quote.width/2,quote.y+quote.height/2);
 await page.waitForURL(url=>url.pathname===target);
});
