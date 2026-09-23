import {test,expect} from '@playwright/test';

test('首頁分享預覽有正式名稱與 1200×630 縮圖',async({page,request,baseURL})=>{
  await page.goto('./');
  const title='AI 分身課程問答資料庫';
  const expectedPath=new URL('social-preview.png',baseURL).pathname;
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content',title);
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content',title);
  const image=await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(image).toBeTruthy();
  expect(new URL(image!).pathname).toBe(expectedPath);
  expect(new URL(image!).protocol).toMatch(/^https?:$/);
  if(process.env.VERIFY_URL)expect(image).toBe(new URL(expectedPath,baseURL).href);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content','1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content','630');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content',/AI 分身課程問答資料庫/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content','summary_large_image');
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content',title);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content',image!);
  const response=await request.get(new URL(expectedPath,baseURL).href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  const bytes=await response.body();
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});
