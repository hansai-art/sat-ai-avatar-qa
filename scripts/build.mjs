import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,rmSync,mkdirSync,copyFileSync} from 'node:fs';
import * as pagefind from 'pagefind';
import path from 'node:path';

const mode=process.argv[2] || 'production';
if(!['production','demo'].includes(mode))throw new Error('不支援的建置模式');
process.env.BUILD_MODE=mode;
rmSync('dist',{recursive:true,force:true});
// 同一個環境切換模式時必須重新套用資料過濾與路由。
rmSync('.astro',{recursive:true,force:true});
const astroPackage=JSON.parse(readFileSync('node_modules/astro/package.json','utf8'));
// Imported schema defaults must also refresh unchanged Markdown in Astro's content cache.
const child=spawnSync(process.execPath,[path.join('node_modules/astro',astroPackage.bin.astro),'build','--force'],{stdio:'inherit',env:process.env});
if(child.status!==0)process.exit(child.status || 1);
// Serve OCR assets from this site; no third-party CDN or image-upload endpoint.
mkdirSync('dist/ocr',{recursive:true});
copyFileSync('node_modules/tesseract.js/dist/worker.min.js','dist/ocr/worker.min.js');
copyFileSync('node_modules/tesseract.js-core/LICENSE','dist/ocr/LICENSE');
for(const name of ['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm.js'])copyFileSync('node_modules/tesseract.js-core/'+name,'dist/ocr/'+name);
for(const lang of ['eng','chi_tra'])copyFileSync(`node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,`dist/ocr/${lang}.traineddata.gz`);
const info=JSON.parse(readFileSync('dist/build-info.json','utf8'));
if(mode==='production') {
  // Preserve previously shared demo links without mixing fixtures into real FAQs.
  const replacements=[4,19,1,2,3,1,16,15,16,22,3,6,7,18,15];
  writeFileSync('dist/_redirects',replacements.map((target,i)=>`/questions/qa-${900001+i}/ /questions/qa-${String(target).padStart(6,'0')}/ 301`).join('\n')+'\n');
}

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
  // Materialize assets before closing the native service. Buffered native file
  // writes can otherwise be interrupted, leaving an empty pagefind.js on macOS.
  const result=await index.getFiles();
  if(result.errors?.length)throw new Error(result.errors.join('\n'));
  for(const file of result.files){
    const target=path.join('dist/pagefind',file.path);
    mkdirSync(path.dirname(target),{recursive:true});
    writeFileSync(target,file.content);
  }
  console.log(`Pagefind: ${indexedCount} 題；模式 ${mode}`);
} finally {await pagefind.close();}
const validate=spawnSync(process.execPath,['scripts/validate-output.mjs'],{stdio:'inherit',env:process.env});
process.exit(validate.status || 0);
