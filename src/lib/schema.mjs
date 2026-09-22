import { z } from 'astro/zod';
import { safeHttps } from './paths.mjs';

const text = (min, max) => z.string().trim().refine(s => [...s].length >= min && [...s].length <= max, `需為 ${min}～${max} 字元`).refine(s => !/<[^>]*>/.test(s), '此欄位只接受純文字');
export function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s; }
export const date = z.string().refine(isDate, '日期需為有效 YYYY-MM-DD，請加引號');
const nullableText = text(1, 500).nullable().default(null);
const refs = z.array(text(1,80)).refine(xs => new Set(xs).size === xs.length, '不可有重複值');
const https = z.string().refine(safeHttps, '需為不含憑證的 HTTPS 網址');
export const questionSchema = z.object({
  title: text(4,100), summary: text(15,240), chapterRefs: refs.min(1), lessonRefs: refs.default([]), toolRefs: refs.min(1),
  type: z.enum(['setup','account-billing','troubleshooting','concept','use-case','course-resources']),
  platforms: z.array(z.enum(['windows','macos','linux','ios','android','web'])).default([]),
  keywords: refs.max(12).default([]), errorMessages: z.array(z.string().max(2000)).max(5).default([]),
  publication: z.enum(['draft','published','archived']).default('draft'),
  answerStatus: z.enum(['unverified','verified','needs-update']).default('unverified'),
  contentOrigin: z.enum(['real','demo']).default('real'),
  questionOrigin: z.enum(['asked','anticipated']).default('asked'),
  intent: z.enum(['operation','concept','resources']).optional(), // Legacy fixture/import compatibility; never shown in the UI.
  faqOrder: z.number().int().min(1).max(99999).default(99999),
  firstStep: text(1,300).optional(),
  nextLinks: z.array(z.object({title:text(1,100),url:https}).strict()).max(3).default([]),
  uiPath: z.array(text(1,80)).max(6).default([]),
  caution: text(1,300).optional(),
  screenshots: z.array(z.object({
    file:z.string().regex(/^[a-z0-9][a-z0-9-]*\.(png|jpe?g|webp|avif)$/i),
    alt:text(1,160),caption:text(1,200),capturedAt:date,
    version:text(1,80),sourceRecord:text(1,80)
  }).strict()).max(6).default([]),
  editorialNotes: z.array(text(1,800)).default([]),
  sourceRefs: z.array(z.object({recordId:text(1,80),part:text(1,120),askedAt:date}).strict()).default([]),
  askedBy: z.array(z.object({name:text(1,80),sourceUrl:https}).strict()).max(20).default([]),
  createdAt: date, updatedAt: date, verifiedAt: date.nullable().default(null),
  reviewedBy: nullableText, reviewNote: nullableText, appliesTo: nullableText,
  featured: z.boolean().default(false), related: refs.max(4).default([]), supersededBy: nullableText,
  sources: z.array(z.object({kind:z.enum(['official','instructor','course','community','other']),title:text(1,160),url:https.optional(),checkedAt:date.optional(),note:text(1,500).optional()}).strict()).default([]),
  videos: z.array(z.object({title:text(1,160),url:https,description:text(1,500),timestampLabel:text(1,80).optional()}).strict()).max(6).default([])
}).strict();

export function todayTaipei() { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function validateQuestions(entries, taxonomy, mode, today=todayTaipei()) {
  if (!['demo','production'].includes(mode)) throw new Error('BUILD_MODE 只接受 demo 或 production');
  const fail=(id,msg)=>{throw new Error(`${id}: ${msg}`);};
  const byId = new Map(entries.map(q=>[q.id,q]));
  if (byId.size!==entries.length) fail('questions','ID 重複');
  for (const key of ['chapters','tools','types','contributors']) {
    if(new Set(taxonomy[key].map(x=>x.id)).size!==taxonomy[key].length) fail(key,'分類 ID 重複');
    for(const item of taxonomy[key]) if(!/^[a-z0-9-]+$/.test(item.id)) fail(key,'分類 ID 需為小寫英文、數字或 -');
  }
  if(new Set(taxonomy.chapters.map(x=>x.order)).size!==taxonomy.chapters.length) fail('chapters','order 重複');
  const lessonPairs=taxonomy.chapters.flatMap(c=>c.lessons.map(l=>[l.id,c.id]));
  const lessons=new Map(lessonPairs);
  if(lessons.size!==lessonPairs.length) fail('lessons','小節 ID 重複');
  const aliasOwners=new Map();
  for(const tool of taxonomy.tools) for(const alias of [tool.name,...tool.aliases]) {
    const key=alias.normalize('NFKC').toLowerCase();
    if(aliasOwners.has(key) && aliasOwners.get(key)!==tool.id) fail(tool.id,'工具別名重複');
    aliasOwners.set(key,tool.id);
  }
  for(const chapter of taxonomy.chapters) {
    if(new Set(chapter.lessons.map(l=>l.order)).size!==chapter.lessons.length) fail(chapter.id,'小節 order 重複');
    if(mode==='production' && (!chapter.confirmed || chapter.lessons.some(l=>!l.confirmed))) fail(chapter.id,'請先核對課綱並設定 confirmed=true');
  }
  for(const q of entries) {
    const d=q.data, id=q.id;
    if(d.contentOrigin==='real' && d.askedBy.some(person=>person.name!=='學員提問')) fail(id,'公開題庫只保留「學員提問」匿名標示，姓名留在私人來源紀錄');
    if(new Set(d.sourceRefs.map(r=>r.recordId+'|'+r.part)).size!==d.sourceRefs.length) fail(id,'來源對照不可重複計入同一子問題');
    if(new Set(d.screenshots.map(s=>s.file)).size!==d.screenshots.length) fail(id,'截圖不可重複');
    for(const shot of d.screenshots) {
      if(!d.sourceRefs.some(ref=>ref.recordId===shot.sourceRecord)) fail(id,'截圖需對應此題的來源紀錄');
      if(shot.capturedAt>today) fail(id,'截圖日期不可在未來');
    }
    if(!/^qa-\d{6}$/.test(id)) fail(id,'檔名需為 qa-六位數字.md');
    for(const [field,key] of [['chapterRefs','chapters'],['toolRefs','tools']]) {
      if(d[field].includes('general') && d[field].length>1) fail(id,`${field} 的 general 不可混用`);
      if(d[field].some(x=>!taxonomy[key].some(v=>v.id===x))) fail(id,`${field} 有未知分類`);
    }
    if(!taxonomy.types.some(t=>t.id===d.type)) fail(id,'未知問題類型');
    if(d.lessonRefs.some(l=>!lessons.has(l) || !d.chapterRefs.includes(lessons.get(l)))) fail(id,'小節不存在或不屬於所選章節');
    if(d.reviewedBy && !taxonomy.contributors.some(c=>c.id===d.reviewedBy)) fail(id,'未知審核者');
    for(const day of [d.createdAt,d.updatedAt,d.verifiedAt,...d.sources.map(s=>s.checkedAt),...d.sourceRefs.map(s=>s.askedAt)].filter(Boolean)) if(day>today) fail(id,'日期不可在未來');
    if(d.createdAt>d.updatedAt || d.verifiedAt && (d.verifiedAt<d.createdAt || d.verifiedAt>d.updatedAt)) fail(id,'日期順序不正確');
    if(d.publication==='published') {
      if(d.answerStatus==='unverified' || !d.reviewedBy || !d.verifiedAt || !d.sources.length) fail(id,'已發布問答需要審核者、確認日與來源');
      if(!q.body?.trim() || q.body.trim()===d.summary) fail(id,'已發布問答需完整正文');
      if(d.contentOrigin==='real' && d.questionOrigin==='asked' && !d.askedBy.length) fail(id,'學員已問的正式問題需提供匿名提問標示與原討論網址');
      if(d.contentOrigin==='real' && d.questionOrigin==='asked' && (!d.firstStep || !d.sourceRefs.length)) fail(id,'正式 FAQ 需要第一步與來源對照');
    }
    if(d.questionOrigin==='anticipated' && d.askedBy.length) fail(id,'延伸問題不可標記為學員提問');
    if(Buffer.byteLength(q.body || '')>200*1024) fail(id,'正文超過 200KiB');
    if((d.publication==='archived' || d.answerStatus==='needs-update') && !d.reviewNote) fail(id,'請填寫公開提醒');
    if(d.featured && (d.publication!=='published' || d.answerStatus!=='verified')) fail(id,'只有已發布且已確認的問答可精選');
    for(const ref of [...d.related,...(d.supersededBy?[d.supersededBy]:[])]) {
      const target=byId.get(ref);
      if(!target || ref===id || target.data.publication==='draft' || target.data.contentOrigin!==d.contentOrigin) fail(id,`無效關聯 ${ref}`);
    }
    if(d.supersededBy && (d.publication!=='archived' || byId.get(d.supersededBy)?.data.publication!=='published')) fail(id,'替代題只用於封存題並指向已發布題');
    let current=q; const seen=new Set();
    while(current?.data.supersededBy) { if(seen.has(current.id)) fail(id,'替代題循環'); seen.add(current.id);current=byId.get(current.data.supersededBy); }
  }
  return entries;
}
export function visibleQuestions(entries,mode) { return entries.filter(q=>q.data.contentOrigin===(mode==='demo'?'demo':'real') && q.data.publication!=='draft'); }
export function publishedQuestions(entries) { return entries.filter(q=>q.data.publication==='published').sort((a,b)=>Number(a.data.questionOrigin==='anticipated')-Number(b.data.questionOrigin==='anticipated')||(a.data.faqOrder??99999)-(b.data.faqOrder??99999)||b.data.updatedAt.localeCompare(a.data.updatedAt)||a.id.localeCompare(b.id)); }
