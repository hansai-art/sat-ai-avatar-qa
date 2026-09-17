import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {withBase,normalizeBase,safeHttps,safeReturn} from '../src/lib/paths.mjs';
import {parseState,serializeState,queryOptions} from '../src/lib/search-state.mjs';
import {questionSchema,validateQuestions,visibleQuestions,publishedQuestions,isDate} from '../src/lib/schema.mjs';
import safety from '../scripts/remark-safety.mjs';
const taxonomy=JSON.parse(fs.readFileSync('src/data/taxonomy.json','utf8'));
const confirmed=()=>{const t=structuredClone(taxonomy);for(const c of t.chapters){c.confirmed=true;for(const l of c.lessons)l.confirmed=true;}return t;};
const make=(override={})=>({id:'qa-000100',body:'## 如何處理\n這是測試正文，和摘要不同。',data:questionSchema.parse({title:'真實結構的測試問題',summary:'這是只用在測試的摘要，確認內容驗證可以拒絕錯誤。',chapterRefs:['ch01'],toolRefs:['hermes-agent'],type:'setup',createdAt:'2026-09-17',updatedAt:'2026-09-17',publication:'published',answerStatus:'verified',reviewedBy:'hans',askedBy:[{name:'僅供單元測試',sourceUrl:'https://example.org/discussion'}],verifiedAt:'2026-09-17',sources:[{kind:'instructor',title:'測試來源'}],...override})});
test('base path 只加一次，拒絕越界及外部路徑',()=>{
 assert.equal(withBase('/questions/','/qa/'),'/qa/questions/');assert.equal(withBase('/qa/questions/','/qa/'),'/qa/questions/');assert.equal(normalizeBase('/'),'/');
 for(const p of ['//evil.test','/../secret','/%2e%2e/secret','https://evil.test'])assert.throws(()=>withBase(p,'/qa/'));
});
test('外連拒絕腳本、HTTP、登入憑證與 token',()=>{
 assert.equal(safeHttps('https://example.com/watch?t=20'),true);
 for(const url of ['javascript:alert(1)','http://example.com','https://a:b@example.com','https://example.com/?api_key=123'])assert.equal(safeHttps(url),false);
});
test('返回搜尋限制同來源及同一站內路徑',()=>{
 assert.equal(safeReturn('https://evil.test','https://example.com','/qa/'),'/qa/questions/');
 assert.equal(safeReturn('/qa/questions/?q=TG','https://example.com','/qa/'),'/qa/questions/?q=TG');
 assert.equal(safeReturn('/qa/?q=TG','https://example.com','/qa/'),'/qa/?q=TG');
 assert.equal(safeReturn('/?q=TG','https://example.com','/qa/'),'/qa/questions/');
});
test('搜尋 NFKC、200 字元上限、非法頁碼與重複參數',()=>{
 const {state}=parseState('q=　ＴＧ   429　&q=bad&chapter=nope&page=999999999&unknown=x',taxonomy);
 assert.equal(state.q,'TG 429');assert.equal(state.chapter,'');assert.equal(state.page,1);
 assert.equal([...parseState('q='+encodeURIComponent('問'.repeat(250)),taxonomy).state.q].length,200);
 assert.equal(serializeState(state),'q=TG+429');
});
test('有效小節補上章節，衝突時保留章節',()=>{
 assert.equal(parseState('lesson=ch01-03',taxonomy).state.chapter,'ch01');assert.equal(parseState('lesson=ch01-03',taxonomy).state.lesson,'');
 assert.equal(parseState('lesson=ch02-01',taxonomy).state.lesson,'ch02-01');
 assert.equal(parseState('chapter=ch02&lesson=ch01-03',taxonomy).state.lesson,'');
});
test('查詢參數只篩選合法值，關聯排序不被覆蓋',()=>{
 const state=parseState('q=Hermes&chapter=ch01&tool=hermes-agent&type=setup',taxonomy).state;
 assert.deepEqual(queryOptions(state),{filters:{chapter:'ch01',tool:'hermes-agent',type:'setup'}});
 assert.deepEqual(queryOptions({...state,q:''}).sort,{updated:'desc'});
});
test('schema 拒絕未知欄位、無效日期與不安全影片',()=>{
 const q=make();assert.throws(()=>questionSchema.parse({...q.data,publcation:'published'}));
 assert.equal(isDate('2026-02-30'),false);
 assert.throws(()=>questionSchema.parse({...q.data,videos:[{title:'影片',description:'測試',url:'javascript:alert(1)'}]}));
});
test('正式內容需人工確認與來源，不能只改 published',()=>{
 assert.doesNotThrow(()=>validateQuestions([make()],confirmed(),'production','2026-09-17'));
 for(const change of [{sources:[]},{reviewedBy:null},{answerStatus:'unverified'}])assert.throws(()=>validateQuestions([make(change)],confirmed(),'production','2026-09-17'));
});
test('拒絕未核對課綱、未來日期、錯誤日期順序',()=>{
 assert.throws(()=>validateQuestions([make()],taxonomy,'production','2026-09-17'));
 const t=confirmed();for(const l of t.chapters.find(c=>c.id==='ch01').lessons)l.confirmed=false;
 assert.doesNotThrow(()=>validateQuestions([make()],t,'production','2026-09-17'));
 for(const change of [{updatedAt:'2026-09-18'},{updatedAt:'2026-09-16'}])assert.throws(()=>validateQuestions([make(change)],confirmed(),'production','2026-09-17'));
});
test('發布模式隔離草稿與示範資料',()=>{
 const real=make(),demo={...make({contentOrigin:'demo'}),id:'qa-000101'},draft={...make({publication:'draft'}),id:'qa-000102'};
 assert.deepEqual(visibleQuestions([real,demo,draft],'production').map(q=>q.id),[real.id]);
 assert.deepEqual(visibleQuestions([real,demo,draft],'demo').map(q=>q.id),[demo.id]);
});
test('待更新與封存必須有原因，精選限已確認',()=>{
 for(const change of [{answerStatus:'needs-update'},{publication:'archived'},{answerStatus:'needs-update',reviewNote:'已過期',featured:true}])assert.throws(()=>validateQuestions([make(change)],confirmed(),'production','2026-09-17'));
});
test('關聯不得指向自身、草稿或其他發布模式',()=>{
 assert.throws(()=>validateQuestions([make({related:['qa-000100']})],confirmed(),'production','2026-09-17'));
 const target={...make({publication:'draft'}),id:'qa-000101'};
 assert.throws(()=>validateQuestions([make({related:[target.id]}),target],confirmed(),'production','2026-09-17'));
});
test('Markdown 拒絕 HTML、危險連結、圖片越界與缺少替代文字',()=>{
 const check=node=>safety()({type:'root',children:[node]},{path:process.cwd()+'/src/content/questions/qa-000001.md'});
 for(const node of [{type:'html',value:'<script>alert(1)</script>'},{type:'link',url:'javascript:alert(1)'},{type:'image',alt:'圖',url:'../../../../etc/passwd'},{type:'image',alt:'',url:'test.png'}])assert.throws(()=>check(node));
 assert.doesNotThrow(()=>check({type:'code',value:'<script>alert(1)</script>'}));
});

test('學員問題需有可追溯的署名，延伸問題不可偽裝提問',()=>{
 const asked=make(),anticipated={...make({questionOrigin:'anticipated',askedBy:[]}),id:'qa-000101'};
 assert.throws(()=>validateQuestions([make({askedBy:[]})],confirmed(),'production','2026-09-17'));
 assert.throws(()=>validateQuestions([make({questionOrigin:'anticipated'})],confirmed(),'production','2026-09-17'));
 assert.throws(()=>make({askedBy:[{name:'測試',sourceUrl:'javascript:alert(1)'}]}));
 assert.doesNotThrow(()=>validateQuestions([asked,anticipated],confirmed(),'production','2026-09-17'));
 assert.deepEqual(publishedQuestions([anticipated,asked]).map(q=>q.id),[asked.id,anticipated.id]);
});
