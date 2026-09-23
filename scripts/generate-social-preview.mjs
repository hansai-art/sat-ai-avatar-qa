import fs from 'node:fs/promises';
import sharp from 'sharp';

const width=1200,height=630;
const portrait=await sharp('src/assets/brand/hans-portrait.jpg')
  .resize(400,500,{fit:'cover',position:'top'})
  .composite([{input:Buffer.from('<svg width="400" height="500"><rect width="400" height="500" rx="34" fill="white"/></svg>'),blend:'dest-in'}])
  .png().toBuffer();

const background=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="1200" height="630" fill="#f5f7fb"/>
  <circle cx="1110" cy="70" r="250" fill="#dfe8ff"/>
  <circle cx="1070" cy="580" r="180" fill="#edf1f7"/>
  <rect x="64" y="70" width="10" height="116" rx="5" fill="#184ae8"/>
  <text x="96" y="104" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="25" font-weight="600" fill="#184ae8">知識衛星 × 林思翰</text>
  <text x="96" y="202" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="67" font-weight="800" fill="#152039">AI 分身課程</text>
  <text x="96" y="290" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="67" font-weight="800" fill="#152039">問答資料庫</text>
  <text x="96" y="355" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="27" fill="#57647c">搜尋真實學生問題，快速找到下一步</text>
  <rect x="96" y="414" width="164" height="54" rx="14" fill="#e6f0f5"/>
  <text x="178" y="449" text-anchor="middle" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="21" font-weight="600" fill="#29566e">依章節瀏覽</text>
  <rect x="276" y="414" width="164" height="54" rx="14" fill="#f8eadd"/>
  <text x="358" y="449" text-anchor="middle" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="21" font-weight="600" fill="#794520">錯誤排除</text>
  <rect x="456" y="414" width="164" height="54" rx="14" fill="#e9edf6"/>
  <text x="538" y="449" text-anchor="middle" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="21" font-weight="600" fill="#3d5074">觀念釐清</text>
  <text x="96" y="548" font-family="Arial, PingFang TC, Microsoft JhengHei, sans-serif" font-size="24" font-weight="600" fill="#152039">sathans.pages.dev</text>
</svg>`);

await fs.mkdir('public',{recursive:true});
await sharp(background).composite([{input:portrait,left:744,top:65}]).png({compressionLevel:9}).toFile('public/social-preview.png');
