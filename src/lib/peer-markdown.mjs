// 「其他同學也遇到」卡片的回答用 Markdown 寫，只接受段落、清單、粗體、行內程式碼與連結。
// 不接受 HTML、圖片和標題（卡片本身已有同學的提問當標題），連結只能是 HTTPS 或站內路徑。
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import {safeHttps,withBase} from './paths.mjs';

export function peerSafety() {
  return tree => {
    const visit = node => {
      if (node.type === 'html') throw new Error('其他同學的回答不接受 HTML');
      if (node.type === 'image' || node.type === 'imageReference') throw new Error('其他同學的回答不放圖片，圖片請放在延伸補充正文');
      if (node.type === 'heading') throw new Error('其他同學的回答不使用標題');
      if (node.type === 'link' || node.type === 'definition') {
        const url = node.url || '';
        if (url.startsWith('https://')) { if (!safeHttps(url)) throw new Error(`外連不安全：${url}`); }
        else if (url.startsWith('/') && !url.startsWith('//')) node.url = withBase(url, process.env.BASE_PATH || '/');
        else if (!url.startsWith('#')) throw new Error(`連結只接受 HTTPS、站內絕對路徑或錨點：${url}`);
      }
      for (const child of node.children || []) visit(child);
    };
    visit(tree);
  };
}

let processor;
export async function renderPeerMarkdown(markdown) {
  processor ||= createMarkdownProcessor({remarkPlugins: [peerSafety], syntaxHighlight: false, smartypants: false});
  const {code} = await (await processor).render(String(markdown));
  // 外連另開分頁，跟延伸補充正文的課程入口一致。
  return code.replace(/<a href="(https:\/\/[^"]+)">/g, '<a href="$1" target="_blank" rel="noopener noreferrer">');
}
