import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankColloquial,normalizeSearch} from '../src/lib/colloquial-search.mjs';
import {extractSearchText} from '../src/lib/ocr-query.mjs';
const documents=[
 {id:'phone',title:'手機傳訊息沒回應',keywords:['Telegram 不回'],summary:'檢查手機與電腦連線',aliases:['telegram','TG']},
 {id:'cost',title:'工具費用',keywords:['ChatGPT','訂閱'],summary:'聊天訂閱與 API 計費可能分開',aliases:[]},
 {id:'material',title:'教材去哪裡找',keywords:['教材下載','範例檔案'],summary:'登入課程找教材',aliases:[]},
 {id:'other',title:'找不到公司規定',keywords:['HR'],summary:'查人資文件',aliases:[]},
];
test('口語否定與費用同義詞、精確教材意圖',()=>{
 for(const [q,id] of [['手機傳訊息都沒有反應','phone'],['我付了ChatGPT還要付錢嗎','cost'],['教材下載','material']])assert.equal(rankColloquial(q,documents)[0]?.doc.id,id);
 assert.ok(normalizeSearch('沒有回應').includes('沒反應'));
 assert.notEqual(normalizeSearch('回應'),normalizeSearch('沒回應'));
});
test('不以普通中文片語忽略指定工具，也不提供無關猜測',()=>{
 assert.deepEqual(rankColloquial('找不到Notion',documents),[]);
 assert.deepEqual(rankColloquial('木星香蕉火箭',documents),[]);
});
test('長截圖優先擷取真正錯誤，並保留 Unicode 完整與長度限制',()=>{
 assert.equal(extractSearchText('選單\n'.repeat(250)+'HTTP 429 Too Many Requests\n送出'),'HTTP 429 Too Many Requests');
 assert.equal(extractSearchText(('模型服務商錯誤 HTTP 429: The usage limit has been reached 工具列 複製錯誤訊息\n').repeat(8)),'HTTP 429');
 assert.equal([...extractSearchText('長'.repeat(505))].length,200);
 assert.equal(extractSearchText(' \n '),'');
});
