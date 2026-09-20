import fs from 'node:fs';
import path from 'node:path';
const info=JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
const origin=process.env.SITE_URL || 'http://localhost:4321';
const base=info.base.endsWith('/')?info.base:info.base+'/';
const files=fs.readdirSync('dist',{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>path.join(e.parentPath||e.path,e.name));
const errors=[];let total=0,htmlCount=0;
const normalize=value=>value.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
for(const file of files){
  total+=fs.statSync(file).size;
  if(/\.(md|env|map)$/i.test(file)||/\.local-input/.test(file))errors.push(`禁止輸出的檔案 ${file}`);
  if(!/\.(html|json|xml|js|css)$/.test(file))continue;
  const source=fs.readFileSync(file,'utf8');
  if(/PRIVATE_FIXTURE_SENTINEL|sk-test-do-not-publish|DRAFT_BODY_SENTINEL/.test(source))errors.push(`產物含私人測試標記 ${file}`);
  if(!file.endsWith('.html'))continue;htmlCount++;
  if(info.mode==='production'&&source.includes('以下為示範資料'))errors.push(`正式產物含示範頁 ${file}`);
  const local=path.relative('dist',file).split(path.sep).join('/');
  const current=new URL(base+(local==='index.html'?'':local.replace(/index\.html$/,'')),origin);
  for(const match of source.matchAll(/(?:href|src)=(?:"([^"]*)"|'([^']*)')/g)){
    const raw=normalize(match[1]??match[2]);
    if(!raw || raw.startsWith('data:'))continue;
    let url;try{url=new URL(raw,current);}catch{errors.push(`${file}: 不合法網址`);continue;}
    if(url.origin!==new URL(origin).origin)continue;
    if(!url.pathname.startsWith(base)){errors.push(`${file}: 缺少 base ${url.pathname}`);continue;}
    const relative=decodeURIComponent(url.pathname.slice(base.length));
    let target=path.join('dist',relative);
    if(url.pathname.endsWith('/'))target=path.join(target,'index.html');
    if(!fs.existsSync(target)){errors.push(`${file}: 失聯 ${url.pathname}`);continue;}
    if(url.hash&&target.endsWith('.html')){
      const ids=[...fs.readFileSync(target,'utf8').matchAll(/id="([^"]*)"/g)].map(m=>m[1]);
      if(!ids.includes(decodeURIComponent(url.hash.slice(1))))errors.push(`${file}: 不存在的錨點 ${url.hash}`);
    }
  }
}
const questionDirs=fs.readdirSync('dist/questions',{withFileTypes:true}).filter(e=>e.isDirectory()&&e.name.startsWith('qa-')).map(e=>e.name).sort();
if(JSON.stringify(questionDirs)!==JSON.stringify([...info.searchableIds,...info.archivedIds].sort()))errors.push('問答頁與發布清單不一致');
if(!fs.existsSync('dist/pagefind/pagefind.js'))errors.push('缺少 Pagefind 索引');
else if(fs.statSync('dist/pagefind/pagefind.js').size<1000)errors.push('Pagefind 主程式為空或不完整');
if(total>500*1024*1024)errors.push('產物超過 500MiB');
if(total>250*1024*1024)console.warn('產物超過 250MiB，建議檢查圖片');
if(errors.length)throw new Error([...new Set(errors)].join('\n'));
console.log(`產物檢查通過：${htmlCount} 個 HTML，${info.searchableIds.length} 題，${(total/1024/1024).toFixed(2)} MiB，base=${base}`);
