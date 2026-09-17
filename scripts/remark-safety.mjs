import path from 'node:path';
import fs from 'node:fs';
import {safeHttps,withBase} from '../src/lib/paths.mjs';
export default function safety() {
  return (tree,file)=> {
    const id=path.basename(file.path || '','.md');
    const isFixture=path.resolve(file.path||'').startsWith(path.resolve('tests/fixtures/questions')+path.sep);
    const allowed=path.resolve(isFixture?'tests/fixtures/assets':'src/assets/questions',id);
    const checkUrl=url=> {
      if(url.startsWith('https://')){if(!safeHttps(url))throw new Error('外連含不安全憑證');return;}
      if(url.startsWith('#'))return;
      if(url.startsWith('/')&&!url.startsWith('//')&&!/[\\]/.test(url)&&!decodeURIComponent(url).includes('..'))return;
      throw new Error(`連結只接受 HTTPS、站內絕對路徑或錨點：${url}`);
    };
    function visit(node) {
      if(node.type==='html')throw new Error(`${id}: Markdown 不接受原始 HTML，程式碼請放程式碼區塊`);
      if(node.type==='heading' && node.depth===1)throw new Error(`${id}: 正文標題請從 H2 開始`);
      if(node.type==='image' || node.type==='imageReference') {
        if(node.type==='imageReference')throw new Error(`${id}: 圖片請使用行內 Markdown 語法`);
        if(!node.alt?.trim())throw new Error(`${id}: 圖片缺少 alt 說明`);
        const resolved=path.resolve(path.dirname(file.path),node.url);
        if(!resolved.startsWith(allowed+path.sep) || !/\.(png|jpe?g|webp|avif)$/i.test(resolved))throw new Error(`${id}: 圖片必須放在此題的 src/assets/questions/${id}/`);
        if(!fs.existsSync(resolved)||!fs.realpathSync(resolved).startsWith(allowed+path.sep))throw new Error(`${id}: 圖片不存在或越界`);
        if(fs.statSync(resolved).size>2*1024*1024)throw new Error(`${id}: 圖片超過 2MiB`);
      }
      if(node.type==='link'||node.type==='definition') {
        checkUrl(node.url);
        if(node.url.startsWith('/'))node.url=withBase(node.url,process.env.BASE_PATH||'/');
      }
      for(const child of node.children||[])visit(child);
    }
    visit(tree);
  };
}
