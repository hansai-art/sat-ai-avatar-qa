import {expect,test} from '@playwright/test';

test('星圖會公轉，並可用滑鼠查看章節與問題',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:960});
  await page.goto('./');

  const dot=page.locator('.orbit-map .dot').first();
  await expect(dot).toBeVisible();
  await expect(page.locator('.starmap-tip')).toHaveCount(1);

  const initial=await dot.evaluate(node=>`${node.getAttribute('cx')},${node.getAttribute('cy')}`);
  await expect.poll(
    ()=>dot.evaluate(node=>`${node.getAttribute('cx')},${node.getAttribute('cy')}`),
    {timeout:3500},
  ).not.toBe(initial);

  const ring=page.locator('.orbit-map .ring').first();
  await ring.locator('.hit').hover();
  await expect(ring).toHaveClass(/hot/);
  await expect(page.locator('.starmap-tip')).toHaveClass(/on/);

  await dot.hover();
  await expect(dot).toHaveClass(/pick/);
  await expect(page.locator('.starmap-tip b')).not.toBeEmpty();
});

test('減少動態時停止公轉，但保留星圖提示',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  await page.goto('./');

  const dot=page.locator('.orbit-map .dot').first();
  await expect(dot).toBeVisible();
  const initial=await dot.evaluate(node=>`${node.getAttribute('cx')},${node.getAttribute('cy')}`);
  await page.waitForTimeout(1200);
  await expect(dot).toHaveAttribute('cx',initial.split(',')[0]);
  await expect(dot).toHaveAttribute('cy',initial.split(',')[1]);

  await dot.hover();
  await expect(dot).toHaveClass(/pick/);
  await expect(page.locator('.starmap-tip')).toHaveClass(/on/);
});
