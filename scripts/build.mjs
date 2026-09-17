import {spawnSync} from 'node:child_process';
import {readFileSync,rmSync} from 'node:fs';
import * as pagefind from 'pagefind';
import path from 'node:path';

const mode=process.argv[2] || 'production';
if(!['production','demo'].includes(mode))throw new Error('不支援的建置模式');
process.env.BUILD_MODE=mode;
rmSync('dist',{recursive:true,force:true});
// 同一個環境切換模式時必須重新套用資料過濾與路由。
rmSync('.astro',{recursive:true,force:true});
const astroPackage=JSON.parse(readFileSync('node_modules/astro/package.json','utf8'));
const child=spawnSync(process.execPath,[path.join('node_modules/astro',astroPackage.bin.astro),'build'],{stdio:'inherit',env:process.env});
if(child.status!==0)process.exit(child.status || 1);
const info=JSON.parse(readFileSync('dist/build-info.json','utf8'));
try {
  const {index,errors}=await pagefind.createIndex({includeCharacters:'_-',verbose:false});
  if(errors?.length||!index)throw new Error(JSON.stringify(errors));
  let indexedCount=0;
  for(const id of info.searchableIds) {
    const sourcePath=`questions/${id}/index.html`;
    const content=readFileSync(path.join('dist',sourcePath),'utf8');
    if(!content.includes('data-pagefind-body'))throw new Error(`${id} 缺少正文索引標記`);
    const result=await index.addHTMLFile({sourcePath,content});
    if(result.errors?.length||!result.file)throw new Error(`${id} 索引失敗：${JSON.stringify(result.errors)}`);
    indexedCount++;
  }
  const result=await index.writeFiles({outputPath:'dist/pagefind'});
  if(result.errors?.length)throw new Error(result.errors.join('\n'));
  console.log(`Pagefind: ${indexedCount} 題；模式 ${mode}`);
} finally {await pagefind.close();}
const validate=spawnSync(process.execPath,['scripts/validate-output.mjs'],{stdio:'inherit',env:process.env});
process.exit(validate.status || 0);
