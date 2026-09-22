import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test.skip(info.mode!=='production','操作截圖來自正式問答');
const question='questions/qa-000052/';
const scale=()=>{
 const el=document.querySelector<HTMLElement>('.pswp__item[aria-hidden="false"] .pswp__img:not(.pswp__img--placeholder)');
 return el?.getBoundingClientRect().width||0;
};

test('小預覽延遲載入，大圖只在開啟後下載；按鈕縮放、返回位置與焦點',async({page})=>{
 const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
 await page.goto(question);
 const link=page.locator('[data-qa-image]'),img=link.locator('img');
 const full=await link.getAttribute('href');expect(full).toBeTruthy();
 await link.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
 expect(requests.some(url=>url.endsWith(full!))).toBe(false);
 const before=await page.evaluate(()=>scrollY);const box=await link.boundingBox();expect(box!.height).toBeLessThanOrEqual(120);
 await link.click();await expect(page.getByRole('dialog',{name:'操作圖片檢視器'})).toBeVisible();
 await expect.poll(()=>requests.some(url=>url.endsWith(full!))).toBe(true);
 const close=page.getByRole('button',{name:'關閉圖片',exact:true});await expect(close).toBeFocused();
 await page.evaluate(()=>document.fonts.ready);
 expect(requests.filter(url=>/sat-han-sans-tc-extended.*\.woff2/.test(url))).toEqual([]);
 await expect(page.getByRole('button',{name:'縮小',exact:true})).toBeDisabled();
 const initial=await page.evaluate(scale);
 await page.getByRole('button',{name:'放大',exact:true}).click();await expect.poll(()=>page.evaluate(scale)).toBeGreaterThan(initial*1.4);
 await page.getByRole('button',{name:'縮小',exact:true}).click();await expect.poll(()=>page.evaluate(scale)).toBeCloseTo(initial,2);
 await page.getByRole('button',{name:'放大',exact:true}).click();
 await page.getByRole('button',{name:'顯示全圖',exact:true}).click();await expect.poll(()=>page.evaluate(scale)).toBeCloseTo(initial,2);
  for(let i=0;i<8;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('.pswp'))).toBe(true);}
 await page.keyboard.press('Shift+Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('.pswp'))).toBe(true);
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(link).toBeFocused();
 expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(3);
 expect(await page.evaluate(()=>document.documentElement.style.overflow)).not.toBe('hidden');
 await link.click();await close.click();await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('360、390、430px 圖片和工具列不溢出，按鈕至少 44px',async({page})=>{
 for(const width of [360,390,430]){
  await page.setViewportSize({width,height:844});await page.goto(question);await page.locator('[data-qa-image]').click();
  const close=page.getByRole('button',{name:'關閉圖片',exact:true});await expect(close).toBeFocused();
  for(const name of ['放大','縮小','顯示全圖','關閉圖片']){
   const b=await page.getByRole('button',{name,exact:true}).boundingBox();expect(b!.width).toBeGreaterThanOrEqual(44);expect(b!.height).toBeGreaterThanOrEqual(44);expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.x+b!.width).toBeLessThanOrEqual(width);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await close.click();await expect(page.getByRole('dialog')).toHaveCount(0);
 }
});

test('無 JavaScript 仍可看圖片；原始畫面及日期有可讀說明',async({browser,baseURL,request})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 for(const id of ['qa-000052','qa-000053']){
  await page.goto(baseURL+'questions/'+id+'/');const link=page.locator('[data-qa-image]');
  await expect(link).toHaveAttribute('target','_blank');await expect(link.locator('img')).toHaveAttribute('alt',/.+/);
  await expect(page.locator('figcaption')).toContainText('版本：未標示');await expect(page.locator('figcaption time')).toHaveAttribute('datetime',/2026-09-/);
  const full=await link.getAttribute('href');const response=await request.get(new URL(full!,baseURL!).href);expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toContain('image/');
 }
 await context.close();
});

test('大圖載入失敗有中文提示且仍可關閉',async({page})=>{
 await page.goto(question);const full=await page.locator('[data-qa-image]').getAttribute('href');
 await page.route('**'+full!,route=>route.abort());await page.locator('[data-qa-image]').click();
 await expect(page.locator('.pswp__error-msg')).toContainText('圖片暫時無法載入');
 await page.getByRole('button',{name:'關閉圖片',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('手機觸控：雙指放大、單指拖曳、雙指縮小',async({browser,baseURL})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();await page.goto(baseURL!+question);await page.locator('[data-qa-image]').tap();
 await expect(page.getByRole('button',{name:'關閉圖片',exact:true})).toBeFocused();
 const cdp=await context.newCDPSession(page);const initial=await page.evaluate(scale);
 const points=(distance:number)=>[{x:195-distance,y:380,id:0},{x:195+distance,y:420,id:1}];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(35)});
 for(const d of [50,70,100,140]){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(d)});await page.waitForTimeout(30);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.evaluate(scale)).toBeGreaterThan(initial*2);
 const before=await page.locator('.pswp__item[aria-hidden="false"] .pswp__zoom-wrap').getAttribute('style');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:400,id:0}]});
 for(const x of [180,160,135]){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:400,id:0}]});await page.waitForTimeout(30);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect(await page.locator('.pswp__item[aria-hidden="false"] .pswp__zoom-wrap').getAttribute('style')).not.toBe(before);
 const enlarged=await page.evaluate(scale);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(140)});
 for(const d of [110,85,60,40]){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(d)});await page.waitForTimeout(30);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.evaluate(scale)).toBeLessThan(enlarged*.7);
 await page.getByRole('button',{name:'關閉圖片',exact:true}).tap();await expect(page.getByRole('dialog')).toHaveCount(0);
 await context.close();
});
