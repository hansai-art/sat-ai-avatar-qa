// 新增題目或來源紀錄後執行：npm run rank
// 重新統計每題的實際留言串數，改寫每題的 faqOrder 與首頁前 10 題。
import fs from 'node:fs';
import { COURSE_OPENED_AT, rankQuestions } from '../src/lib/rank.mjs';

const dir = 'src/content/questions';
const auditPath = 'docs/content-source-audit.json';
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
const parse = raw => Object.fromEntries(raw.split('---')[1].trim().split('\n').map(line => {
  const p = line.indexOf(': ');
  return [line.slice(0, p), JSON.parse(line.slice(p + 2))];
}));
const questions = new Map(files.map(f => [f.slice(0, -3), parse(fs.readFileSync(`${dir}/${f}`, 'utf8'))]));
const { order, starters, counts } = rankQuestions(audit, questions);

let changed = 0;
for (const [index, id] of order.entries()) {
  const path = `${dir}/${id}.md`;
  const raw = fs.readFileSync(path, 'utf8');
  const next = /^faqOrder: \d+$/m.test(raw)
    ? raw.replace(/^faqOrder: \d+$/m, `faqOrder: ${index + 1}`)
    : raw.replace(/^(---\n[\s\S]*?\n)(---\n)/, `$1faqOrder: ${index + 1}\n$2`);
  if (next !== raw) { fs.writeFileSync(path, next); changed++; }
}

audit.priorityQuestionIds = starters;
audit.ranking = `首頁「新手最常卡住」依 ${COURSE_OPENED_AT.slice(5).replace('-', '/')} 第一筆跟課實作提問之後的不同留言串數排序，同數再看全部留言串數與最近提問日期，其餘題目依全部留言串數排序。只算原始紀錄與上課教室匯入紀錄，舊課堂存檔對照與後續補圖不另計，同一則留言拆成多題時各算一次。頁面不顯示人數，新增題目或來源後執行 npm run rank 重新統計。`;
audit.askCounts = Object.fromEntries(order.map(id => [id, { total: counts.get(id).total, afterOpen: counts.get(id).afterOpen }]));
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n');

console.log(`已重新排序 ${order.length} 題，改動 ${changed} 題的 faqOrder。`);
console.log('新手最常卡住：');
for (const [i, id] of starters.entries()) {
  const c = counts.get(id);
  console.log(`${String(i + 1).padStart(2)}. ${id} 上課後 ${c.afterOpen} 串／全部 ${c.total} 串 ${questions.get(id).title}`);
}
