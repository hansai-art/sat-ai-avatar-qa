import {test,expect} from '@playwright/test';

const ok={ok:true,sent:true,liveUrl:'https://meet.google.com/test-live',calendarUrl:'https://calendar.google.com/calendar/render?action=TEMPLATE'};

test('直播報名頁不被收錄，網頁原始碼不含直播連結，送出 email 後才顯示',async({page})=>{
 await page.goto('live/');
 await expect(page.locator('meta[name=robots]')).toHaveAttribute('content',/noindex/);
 await expect(page.getByRole('heading',{name:'AI 分身小教室',level:1})).toBeVisible();
 const endpoint=await page.locator('.live-signup').getAttribute('data-endpoint');
 expect(endpoint).toMatch(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/);
 expect(await page.content()).not.toContain('meet.google.com');
 let body='';
 await page.route(endpoint!,async route=>{body=route.request().postData()||'';await route.fulfill({contentType:'application/json',body:JSON.stringify(ok)});});
 await page.getByRole('button',{name:'寄給我直播連結'}).click();
 await expect(page.locator('.live-error')).toContainText('Email');
 await page.getByLabel('Email',{exact:true}).fill('student@example.com');
 await page.getByLabel(/想在直播聽到什麼問題/).fill('課程畫面跟現在不一樣怎麼辦？');
 await page.getByRole('button',{name:'寄給我直播連結'}).click();
 await expect(page.locator('#live-join')).toHaveAttribute('href',ok.liveUrl);
 await expect(page.locator('#live-cal')).toHaveAttribute('href',ok.calendarUrl);
 await expect(page.locator('#live-done-msg')).toContainText('student@example.com');
 await expect(page.locator('#live-q-ok')).toBeVisible();
 expect(JSON.parse(body)).toMatchObject({email:'student@example.com',question:'課程畫面跟現在不一樣怎麼辦？',website:''});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.reload();
 await expect(page.locator('#live-done-msg')).toContainText('之前已經用 student@example.com 報名過');
 await page.getByRole('button',{name:'再留一個問題'}).click();
 await expect(page.getByLabel(/想在直播聽到什麼問題/)).toBeFocused();
});

test('直播報名送出失敗時顯示原因，也不列進網站地圖',async({page})=>{
 await page.goto('live/');
 const endpoint=await page.locator('.live-signup').getAttribute('data-endpoint');
 await page.route(endpoint!,route=>route.fulfill({contentType:'application/json',body:JSON.stringify({ok:false,error:'Email 格式不正確，請再檢查一次。'})}));
 await page.getByLabel('Email',{exact:true}).fill('student@example.com');
 await page.getByRole('button',{name:'寄給我直播連結'}).click();
 await expect(page.locator('.live-error')).toHaveText('Email 格式不正確，請再檢查一次。');
 await expect(page.locator('#live-done')).toBeHidden();
 const sitemap=await (await page.request.get('sitemap.xml')).text();
 expect(sitemap).not.toContain('/live/');
});
