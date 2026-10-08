import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rankColloquial} from '../src/lib/colloquial-search.mjs';

// Same public fields as src/pages/search-catalog.json.ts, built from the real
// published Markdown so every build re-checks how beginners phrase questions.
const taxonomy=JSON.parse(fs.readFileSync('src/data/taxonomy.json','utf8'));
const documents=fs.readdirSync('src/content/questions').filter(f=>f.endsWith('.md')).map(f=>{
 const raw=fs.readFileSync('src/content/questions/'+f,'utf8');
 const d=Object.fromEntries(raw.split('---')[1].trim().split('\n').map(line=>{const p=line.indexOf(': ');return [line.slice(0,p),JSON.parse(line.slice(p+2))];}));
 return {id:f.slice(0,-3),title:d.title,summary:d.summary,keywords:[...(d.keywords||[]),...(d.errorMessages||[])],
  aliases:taxonomy.tools.filter(t=>d.toolRefs.includes(t.id)).flatMap(t=>[t.name,...t.aliases]),publication:d.publication};
}).filter(d=>d.publication==='published');

// Each query is something a student typed or would type in their own words.
// The expected answer must appear in the first three lexical results.
const cases=[
 ['裝不起來',['qa-000050','qa-000004']],
 ['Hermes 裝不起來',['qa-000050','qa-000004']],
 ['Hermes 安裝失敗',['qa-000050']],
 ['安裝一直失敗',['qa-000050']],
 ['無法安裝',['qa-000050','qa-000004']],
 ['Windows 裝不起來',['qa-000004']],
 ['Hermes 要錢嗎',['qa-000003']],
 ['要付費嗎',['qa-000003']],
 ['要錢嗎',['qa-000003']],
 ['是免費的嗎',['qa-000003']],
 ['會花很多錢嗎',['qa-000003','qa-000017','qa-000026']],
 ['沒反應',['qa-000054']],
 ['沒回應',['qa-000054']],
 ['手機不回',['qa-000054']],
 ['機器人沒反應',['qa-000054','qa-000001']],
 ['安裝卡住',['qa-000050']],
 ['登不進去',['qa-000051']],
 ['沒有登入畫面',['qa-000051']],
 ['rate limit',['qa-000053']],
 ['配對碼',['qa-000055']],
 ['user id',['qa-000056']],
 ['bot 名字要填什麼',['qa-000060']],
 ['Gemini 訂閱了還是不能用',['qa-000059']],
 ['教材在哪',['qa-000015']],
 ['不會寫程式',['qa-000011']],
 ['蘋果電腦可以嗎',['qa-000004']],
 ['電腦關機',['qa-000005']],
 ['直播重播',['qa-000035']],
 ['Token 用量',['qa-000017']],
 ['LINE',['qa-000057']],
];
test('新手口語問法：預期答案出現在前三筆',()=>{
 const misses=[];
 for(const [query,expected] of cases){
  const top=rankColloquial(query,documents).slice(0,3).map(r=>r.doc.id);
  if(!expected.some(id=>top.includes(id)))misses.push(`${query} → ${top.join(', ')||'沒有結果'}（預期 ${expected.join(' 或 ')}）`);
 }
 assert.deepEqual(misses,[]);
});
test('同一意思的不同說法排序一致',()=>{
 const first=query=>rankColloquial(query,documents)[0]?.doc.id;
 assert.equal(first('沒反應'),first('沒回應'));
 assert.equal(first('要錢嗎'),first('要付費嗎'));
 assert.equal(first('裝不起來'),first('安裝失敗'));
});
test('不把無關的安裝題排到安裝失敗前面',()=>{
 for(const query of ['裝不起來','Hermes 安裝失敗']){
  const top=rankColloquial(query,documents).slice(0,2).map(r=>r.doc.id);
  assert.ok(!top.includes('qa-000010'),`${query} 不應優先出現 SEO 外掛安裝：${top}`);
 }
});
