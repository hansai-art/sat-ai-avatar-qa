import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test.skip(info.mode!=='production','真實題庫的新手搜尋');
const cases=[
 ['完全不會要從哪裡開始','qa-000011'],['手機傳訊息都沒反應','qa-000054'],
 ['我付了ChatGPT還要付錢嗎','qa-000003'],['教材下載','qa-000015'],
 ['我的數字ID在哪裡看','qa-000056'],['Windows 裝不起來','qa-000004'],
 ['Gemini http','qa-000002'],['找不到ChatGPT','qa-000052'],
 ['電腦關掉還能用嗎','qa-000005'],['可以用LINE嗎','qa-000057'],
 ['手機一直不回我','qa-000054'],['我有訂閱ChatGPT怎麼還收費','qa-000003'],
 ['範例檔案哪裡下載','qa-000015'],['第一次上課不會寫程式','qa-000011'],
 ['Telegram 沒有回應','qa-000054'],['自己的 user ID 哪裡看','qa-000056'],
 ["Gemini streaming request failed: Request URL is missing an 'http://' or 'https://' protocol.",'qa-000002']
];
test('原始與改寫問法，從首頁輸入後首筆就是對應問題',async({page})=>{
 test.setTimeout(90_000);
 for(const [query,id] of cases){
  await page.goto('./');await page.getByLabel('搜尋問題',{exact:true}).fill(query);await page.getByRole('button',{name:'搜尋',exact:true}).click();
  await expect(page.locator('#result-list .question-card').first(),query).toHaveAttribute('data-question-id',id);
  expect(new URL(page.url()).searchParams.get('q')).toBe(query);
 }
});
test('口語搜尋仍遵守篩選，返回與重新整理保留查詢',async({page})=>{
 await page.goto('./?q='+encodeURIComponent('手機傳訊息都沒反應')+'&chapter=ch01&type=troubleshooting&tool=telegram');
 const card=page.locator('#result-list .question-card').first();await expect(card).toHaveAttribute('data-question-id','qa-000054');
 await card.locator('a').click();await page.locator('#back-to-search').click();await expect(card).toHaveAttribute('data-question-id','qa-000054');
 await page.reload();await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue('手機傳訊息都沒反應');
 await page.goto('./?q='+encodeURIComponent('手機傳訊息都沒反應')+'&chapter=ch08');await expect(page.locator('#result-count')).toHaveText('找到 0 個問題');
 await page.getByRole('button',{name:'清除篩選，保留關鍵字'}).click();await expect(card).toHaveAttribute('data-question-id','qa-000054');
});
test('新手、教材入口與可照做的 ID、Gateway 步驟',async({page})=>{
 await page.goto('./');await expect(page.locator('#screenshot-search')).toBeHidden();
 if(await page.locator('.mobile-menu').isVisible())await page.locator('.mobile-menu summary').click();await page.getByRole('link',{name:'第一次上課',exact:true}).filter({visible:true}).click();await expect(page.locator('h1')).toContainText('完全不會寫程式');
 await page.goto('./');if(await page.locator('.mobile-menu').isVisible())await page.locator('.mobile-menu summary').click();await page.getByRole('link',{name:'教材與範例',exact:true}).filter({visible:true}).click();await expect(page.locator('.prose')).toContainText('9-3');
 await page.goto('questions/qa-000056/');await expect(page.locator('.prose a[href="https://t.me/userinfobot"]')).toBeVisible();await expect(page.locator('.prose')).toContainText('Id');
 await page.goto('questions/qa-000054/');await expect(page.locator('.prose')).toContainText('Messaging');await expect(page.locator('.prose')).toContainText('hermes gateway setup');
});
test('口語補充索引故障仍有 Pagefind，公開索引不含內部欄位',async({page,request})=>{
 const catalog=await(await request.get('search-catalog.json')).json();expect(catalog.map((d:any)=>d.id).sort()).toEqual([...info.searchableIds].sort());
 for(const doc of catalog){expect(doc).not.toHaveProperty('sources');expect(doc).not.toHaveProperty('sourceRefs');expect(doc).not.toHaveProperty('askedBy');expect(doc).not.toHaveProperty('editorialNotes');}
 await page.route('**/search-catalog.json',route=>route.abort());await page.goto('./?q=BotFather');await expect(page.locator('#result-list [data-question-id="qa-000001"]')).toBeVisible();
});
