import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSimilarity, tokenize} from '../src/lib/similar.mjs';
import {questionSchema, validateQuestions} from '../src/lib/schema.mjs';
import {renderPeerMarkdown} from '../src/lib/peer-markdown.mjs';
import {countAskedThreads} from '../src/lib/ask-count.mjs';

const taxonomy = JSON.parse(fs.readFileSync('src/data/taxonomy.json', 'utf8'));
const confirmed = () => { const t = structuredClone(taxonomy); for (const c of t.chapters) { c.confirmed = true; for (const l of c.lessons) l.confirmed = true; } return t; };
const parseFront = raw => Object.fromEntries(raw.split('---')[1].trim().split('\n').map(line => { const p = line.indexOf(': '); return [line.slice(0, p), JSON.parse(line.slice(p + 2))]; }));
const published = fs.readdirSync('src/content/questions').filter(f => f.endsWith('.md')).map(f => ({id: f.slice(0, -3), data: parseFront(fs.readFileSync('src/content/questions/' + f, 'utf8'))}));
const steps = JSON.parse(fs.readFileSync('src/data/install-steps.json', 'utf8'));
const items = published.map(q => ({
  id: q.id, title: q.data.title, summary: q.data.summary, keywords: q.data.keywords || [], question: q.data.originalThread?.question || '',
  toolRefs: q.data.toolRefs, chapterRefs: q.data.chapterRefs, lessonRefs: q.data.lessonRefs || [], type: q.data.type, related: q.data.related || [],
  step: steps.findIndex(s => s.questions.includes(q.id)) < 0 ? null : steps.findIndex(s => s.questions.includes(q.id)), order: q.data.faqOrder,
}));

test('中文斷成兩字一組，英文保留整個單字，常見虛詞不比對', () => {
  const tokens = tokenize('Telegram 輸入 /help，為什麼出現 BotFather？');
  assert.ok(tokens.has('telegram') && tokens.has('help') && tokens.has('botfather'));
  assert.ok(tokens.has('輸入') && tokens.has('出現'));
  assert.ok(!tokens.has('什麼'));
});

test('相似問題：每題至少三題、不含自己，同一個卡關點排在前面', () => {
  const similar = buildSimilarity(items, {limit: 8});
  for (const item of items) {
    const list = similar.get(item.id);
    assert.ok(list.length >= 3 && list.length <= 8, item.id);
    assert.ok(!list.some(entry => entry.id === item.id), item.id);
    assert.equal(new Set(list.map(entry => entry.id)).size, list.length, item.id);
  }
  const top = id => similar.get(id).slice(0, 3).map(entry => entry.id);
  // Telegram 連線卡關的幾題要互相出現在前三名，SEO 外掛兩題互為第一。
  assert.ok(top('qa-000001').includes('qa-000061'));
  assert.ok(top('qa-000055').includes('qa-000056'));
  assert.equal(top('qa-000009')[0], 'qa-000010');
  assert.ok(top('qa-000026').includes('qa-000028'));
  assert.ok(top('qa-000002').includes('qa-000059'));
});

test('編輯指定的關聯題會被往前排', () => {
  const base = [
    {id: 'a', title: '模型登入失敗怎麼辦', summary: '登入失敗', toolRefs: ['hermes-agent'], chapterRefs: ['ch01'], type: 'setup', related: ['c']},
    {id: 'b', title: '模型登入失敗要重裝嗎', summary: '登入失敗', toolRefs: ['hermes-agent'], chapterRefs: ['ch01'], type: 'setup'},
    {id: 'c', title: '課程有沒有回放', summary: '直播回放', toolRefs: ['general'], chapterRefs: ['general'], type: 'course-resources'},
    {id: 'd', title: '知識庫怎麼搬家', summary: '搬家', toolRefs: ['obsidian'], chapterRefs: ['ch02'], type: 'concept'},
  ];
  const similar = buildSimilarity(base, {limit: 3, minScore: 0});
  assert.deepEqual(similar.get('a').map(entry => entry.id).slice(0, 2).sort(), ['b', 'c']);
  assert.ok(similar.get('c').some(entry => entry.id === 'a'));
});

const make = (override = {}) => ({id: 'qa-000100', body: '## 如何處理\n這是測試正文，和摘要不同。', data: questionSchema.parse({
  title: '真實結構的測試問題', firstStep: '先核對來源', summary: '這是只用在測試的摘要，確認內容驗證可以拒絕錯誤。',
  sourceRefs: [{recordId: 'TEST-01', part: '測試問題', askedAt: '2026-09-17'}, {recordId: 'TEST-02', part: '另一位同學', askedAt: '2026-09-18'}],
  chapterRefs: ['ch01'], toolRefs: ['hermes-agent'], type: 'setup', createdAt: '2026-09-17', updatedAt: '2026-09-18', publication: 'published', answerStatus: 'verified',
  reviewedBy: 'hans', askedBy: [{name: '學員提問', sourceUrl: 'https://example.org/discussion'}], verifiedAt: '2026-09-17', sources: [{kind: 'instructor', title: '測試來源'}], ...override,
})});
const peer = (override = {}) => ({records: ['TEST-02'], askedAt: '2026-09-18', question: '另一位同學卡在不同的地方', answer: '先照這個做法檢查，再回到上面的步驟。', ...override});

test('其他同學也遇到：每張卡要對應真實留言紀錄，日期一致、不重複', () => {
  assert.doesNotThrow(() => validateQuestions([make({peerCases: [peer()]})], confirmed(), 'production', '2026-09-20'));
  for (const bad of [
    [peer({records: ['NOPE-01']})],
    [peer({askedAt: '2026-09-17'})],
    [peer(), peer({question: '同一則紀錄又寫一張卡'})],
  ]) assert.throws(() => validateQuestions([make({peerCases: bad})], confirmed(), 'production', '2026-09-20'));
  assert.throws(() => validateQuestions([make({peerCases: [peer()]})], confirmed(), 'production', '2026-09-17'), /未來/);
  assert.throws(() => validateQuestions([make({questionOrigin: 'anticipated', askedBy: [], peerCases: [peer()]})], confirmed(), 'production', '2026-09-20'));
  assert.throws(() => questionSchema.parse({...make().data, peerCases: [peer({answer: '<b>HTML</b> 不行喔不行'})]}));
});

test('正式題庫的其他同學卡片都能對回來源紀錄', () => {
  let cards = 0;
  for (const q of published) {
    const refs = new Map();
    for (const ref of q.data.sourceRefs) refs.set(ref.recordId, [...(refs.get(ref.recordId) || []), ref.askedAt]);
    for (const card of q.data.peerCases || []) {
      cards++;
      assert.ok(card.records.every(record => refs.has(record)), q.id);
      assert.ok(card.records.some(record => refs.get(record).includes(card.askedAt)), q.id);
      assert.ok(!/[；]|——|您/.test(card.question + card.answer), q.id + ' 標點與用字');
    }
  }
  assert.ok(cards >= 30);
});

test('卡片回答只接受安全的 Markdown，站內連結加上 base path', async () => {
  const html = await renderPeerMarkdown('先看 **設定**，再傳 `/start`。\n\n1. 第一步\n2. 第二步\n\n見[批准配對](/questions/qa-000055/)與[官方說明](https://example.org/docs)。');
  assert.match(html, /<strong>設定<\/strong>/);
  assert.match(html, /<ol>/);
  assert.match(html, /href="\/questions\/qa-000055\/"/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  for (const bad of ['<script>alert(1)</script>', '![圖](./a.png)', '## 標題', '[連結](javascript:alert(1))', '[連結](http://example.org)'])
    await assert.rejects(renderPeerMarkdown(bad));
});

test('同學提問次數和來源對照表的 askCounts 逐題一致', () => {
  const audit = JSON.parse(fs.readFileSync('docs/content-source-audit.json', 'utf8'));
  for (const q of published) assert.equal(countAskedThreads(q.data.sourceRefs), audit.askCounts[q.id]?.total, q.id);
});
