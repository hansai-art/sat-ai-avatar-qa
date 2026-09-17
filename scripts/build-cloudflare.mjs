import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const mode=process.env.BUILD_MODE || 'demo';
if(!['demo','production'].includes(mode))throw new Error('BUILD_MODE 只能是 demo 或 production');
// 正式站需固定網址；架構預覽可使用 Cloudflare 注入的本次部署網址。
const site=process.env.SITE_URL || (mode==='demo' ? process.env.CF_PAGES_URL : '');
if(!site)throw new Error('請設定正式 SITE_URL；demo 可使用 Cloudflare 的 CF_PAGES_URL');
const url=new URL(site);
if(url.protocol!=='https:' || url.username || url.password || url.search || url.hash || url.pathname!=='/')throw new Error('SITE_URL 必須是無路徑、無查詢參數的 HTTPS 站台網址');
const env={...process.env,BUILD_MODE:mode,BASE_PATH:'/',SITE_URL:url.origin,ASTRO_TELEMETRY_DISABLED:'1'};
const astroBin=path.join('node_modules/astro',JSON.parse(fs.readFileSync('node_modules/astro/package.json','utf8')).bin.astro);
for(const args of [[astroBin,'check'],['--test','tests/core.test.mjs'],['scripts/build.mjs',mode]]) {
  const result=spawnSync(process.execPath,args,{stdio:'inherit',env});
  if(result.status!==0)process.exit(result.status || 1);
}
const files=fs.readdirSync('dist',{recursive:true,withFileTypes:true}).filter(x=>x.isFile());
if(files.length>20000)throw new Error('超過 Cloudflare Pages 免費方案的 20,000 個檔案上限');
for(const file of files)if(fs.statSync(path.join(file.parentPath,file.name)).size>25*1024*1024)throw new Error(`${file.name} 超過 Cloudflare Pages 單檔 25MiB 上限`);
console.log(`Cloudflare 靜態產物檢查通過：${files.length} 個檔案；未啟用 Functions 或付費服務。`);
