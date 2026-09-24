import {expect,test} from '@playwright/test';

test('桌機首頁左欄接續精選題，課程星圖留在右欄',async({page})=>{
  await page.setViewportSize({width:1440,height:960});
  await page.goto('./');
  await page.evaluate(()=>document.fonts.ready);
  const hero=page.locator('.home-hero');
  const map=page.locator('.star-map');
  await expect(hero).toBeVisible();
  await expect(map).toBeVisible();
  const [heroBox,mapBox]=await Promise.all([hero.boundingBox(),map.boundingBox()]);
  expect(Math.abs(heroBox!.y-mapBox!.y)).toBeLessThan(4);
  const starter=page.locator('#starter-questions');
  const cards=starter.locator('.question-card');
  const [starterBox,first,second]=await Promise.all([starter.boundingBox(),cards.nth(0).boundingBox(),cards.nth(1).boundingBox()]);
  expect(starterBox!.y).toBeLessThan(mapBox!.y+mapBox!.height);
  expect(starterBox!.y-(heroBox!.y+heroBox!.height)).toBeLessThan(48);
  expect(second!.y).toBeGreaterThan(first!.y);
  await expect(page.locator('.brand-portrait img')).toBeVisible();
  const font=await page.locator('body').evaluate(node=>getComputedStyle(node).fontFamily);
  expect(font).toContain('SAT Han Sans TC');
  expect(font).not.toContain('Instrument Sans');
});

test('手機先顯示答案，星圖放在精選題之後且沒有橫向溢出',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('./');
  await page.evaluate(()=>document.fonts.ready);
  const cards=page.locator('#starter-questions .question-card');
  const [second,map,starter]=await Promise.all([
    cards.nth(1).boundingBox(),
    page.locator('.star-map').boundingBox(),
    page.locator('#starter-questions').boundingBox(),
  ]);
  expect(second!.y).toBeLessThan(844);
  expect(map!.y).toBeGreaterThanOrEqual(starter!.y+starter!.height-2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('深色模式保持文字對比並套用到首頁卡片',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto('./');
  const colors=await page.locator('.question-card').first().evaluate(card=>{
    const body=getComputedStyle(document.body);
    const surface=getComputedStyle(card);
    const title=getComputedStyle(card.querySelector('h2')!);
    return {body:body.backgroundColor,surface:surface.backgroundColor,text:title.color};
  });
  const rgb=(value:string)=>(value.match(/\d+(?:\.\d+)?/g)||[]).slice(0,3).map(Number);
  const luminance=(value:string)=>{
    const [r,g,b]=rgb(value).map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});
    return .2126*r+.7152*g+.0722*b;
  };
  const contrast=(a:string,b:string)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+.05)/(lo+.05);};
  expect(Math.max(...rgb(colors.body))).toBeLessThan(40);
  expect(colors.surface).not.toBe('rgb(255, 255, 255)');
  expect(contrast(colors.text,colors.surface)).toBeGreaterThanOrEqual(4.5);
});

test('兩種瀏覽入口用不同色塊，圖示在色塊正中央',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto('./');
  const entries=page.locator('.browse-entry');
  const colors=await entries.evaluateAll(items=>items.map(item=>getComputedStyle(item).backgroundColor));
  expect(colors[0]).not.toBe(colors[1]);
  for(const entry of await entries.all()){
    const centers=await entry.evaluate(node=>{
      const glyph=node.querySelector('.entry-glyph')!.getBoundingClientRect();
      const icon=node.querySelector('.entry-glyph svg')!.getBoundingClientRect();
      return {x:(icon.x+icon.width/2)-(glyph.x+glyph.width/2),y:(icon.y+icon.height/2)-(glyph.y+glyph.height/2)};
    });
    expect(Math.abs(centers.x)).toBeLessThan(1);
    expect(Math.abs(centers.y)).toBeLessThan(1);
  }
});

test('搜尋快捷鍵與截圖入口清楚說明不是 AI 判讀',async({page})=>{
  await page.goto('./');
  await page.keyboard.press(process.platform==='darwin'?'Meta+KeyK':'Control+KeyK');
  await expect(page.locator('#question-search')).toBeFocused();
  const button=page.getByRole('button',{name:/截圖轉文字.*非 AI 判讀/});
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator('.filter-panel')).toHaveAttribute('open','');
  await expect(page.locator('#screenshot-search')).toHaveAttribute('open','');
  await expect(page.locator('#screenshot-file')).toBeEnabled();
});

test('搜尋狀態收起星圖並讓結果維持在首屏',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('./?q=Telegram');
  await expect(page.locator('.star-map')).toBeHidden();
  const result=page.locator('#result-list .question-card').first();
  await expect(result).toBeVisible();
  expect((await result.boundingBox())!.y).toBeLessThan(350);
});
