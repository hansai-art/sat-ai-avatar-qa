import test from 'node:test';
import assert from 'node:assert/strict';
import {matchKnownPhrase,extractSearchText} from '../src/lib/ocr-query.mjs';

const catalog=[
 {id:'qa-000063',keywords:['Codex CLI','Import these credentials?','[y/N]']},
 {id:'qa-000053',keywords:['HTTP 429','HTTP 429: The usage limit has been reached']},
 {id:'qa-000051',keywords:['我們先幫你把一切設定好']}
];

test('截圖文字含已收錄錯誤訊息時，挑最長最具體的那句',()=>{
 const ocr='返回 問題 列表\nFound existing Codex CLI credentials\nImport these credentials? (a separate login is recommended) [y/N]:';
 const hit=matchKnownPhrase(ocr,catalog);
 assert.equal(hit?.phrase,'Import these credentials?');
 assert.equal(hit?.id,'qa-000063');
});

test('中文辨識結果每個字中間有空白也能比對',()=>{
 assert.equal(matchKnownPhrase('機 器 人 你 好 , 我 們 先 幫 你 把 一 切 設定 好',catalog)?.id,'qa-000051');
});

test('太短的關鍵字不拿來比對，找不到時退回原本的擷取方式',()=>{
 assert.equal(matchKnownPhrase('HTTP 4',catalog),null);
 assert.equal(extractSearchText('Something failed: HTTP 500'),'Something failed: HTTP 500');
});
