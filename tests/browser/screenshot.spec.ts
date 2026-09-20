import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
import {test,expect} from '@playwright/test';
const fixture='tests/fixtures/assets/ocr-error.png';

test('截圖在瀏覽器辨識繁中與英文，確認文字後才搜尋',async({page,context,baseURL})=>{
 test.setTimeout(90_000);
 const requests:{url:string;method:string}[]=[];
 context.on('request',request=>requests.push({url:request.url(),method:request.method()}));
 await page.goto('./');
 expect(requests.filter(r=>r.url.includes('/ocr/')||r.url.includes('ocr-worker'))).toHaveLength(0);
 await page.locator('#screenshot-search summary').click();
 await page.locator('#screenshot-file').setInputFiles(fixture);
 await expect(page.locator('#screenshot-text')).toBeVisible({timeout:60_000});
 await expect(page.locator('#screenshot-text')).toHaveValue(/429/);
 await expect(page.locator('#screenshot-text')).toHaveValue(/錯誤/);
 expect(new URL(page.url()).searchParams.has('q')).toBe(false);
 expect(requests.filter(r=>/^https?:/.test(r.url)).every(r=>new URL(r.url).origin===new URL(baseURL!).origin&&r.method==='GET')).toBe(true);
 expect(requests.some(r=>r.url.includes('/ocr/'))).toBe(true);
 await page.locator('#screenshot-text').fill(info.mode==='demo'?'429':'BotFather');
 await page.getByRole('button',{name:'用這些文字搜尋'}).click();
 await expect(page.locator('#result-count')).toHaveText('找到 1 個問題');
 await expect(page.getByLabel('搜尋問題',{exact:true})).toHaveValue(info.mode==='demo'?'429':'BotFather');
 await expect(page.locator('#screenshot-preview')).not.toHaveAttribute('src');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('拒絕非圖片、偽裝副檔名與超過大小限制的檔案',async({page})=>{
 await page.goto('./');await page.locator('#screenshot-search summary').click();
 const input=page.locator('#screenshot-file');
 await input.setInputFiles({name:'fake.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});
 await expect(page.locator('#screenshot-status')).toContainText('請選擇 PNG');
 await input.setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('<svg/>')});
 await expect(page.locator('#screenshot-status')).toContainText('檔案內容不是支援的圖片');
 await input.setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(10*1024*1024+1)});
 await expect(page.locator('#screenshot-status')).toContainText('圖片超過 10 MB');
 await expect(page.locator('#screenshot-result')).toBeHidden();
});

test('截圖辨識載入失敗、取消與重新選擇可恢復',async({page,context})=>{
 test.setTimeout(90_000);
 await page.goto('./');await page.locator('#screenshot-search summary').click();
 await context.setOffline(true);
 await page.locator('#screenshot-file').setInputFiles(fixture);
 await expect(page.locator('#screenshot-status')).toContainText(/辨識失敗|無法載入/,{timeout:20_000});
 await context.setOffline(false);
 // Simulate a worker that never finishes initialization, then cancel it.
 await context.route('**/ocr-worker*.js',route=>route.fulfill({contentType:'application/javascript',body:'self.onmessage=()=>{}'}));
 await page.locator('#screenshot-file').setInputFiles(fixture);
 await expect(page.locator('#screenshot-preview')).toBeVisible();
 await page.getByRole('button',{name:'取消並清除截圖'}).click();
 await expect(page.locator('#screenshot-status')).toHaveText('已清除截圖與辨識文字。');
 await expect(page.locator('#screenshot-file')).toBeEnabled();
 await context.unroute('**/ocr-worker*.js');
 await page.locator('#screenshot-file').setInputFiles(fixture);
 await expect(page.locator('#screenshot-text')).toHaveValue(/429/,{timeout:60_000});
 await page.locator('#screenshot-text').fill('長'.repeat(201));
 await page.getByRole('button',{name:'用這些文字搜尋'}).click();
 await expect(page.locator('#screenshot-status')).toContainText('1～200 字');
 expect(new URL(page.url()).searchParams.has('q')).toBe(false);
});
