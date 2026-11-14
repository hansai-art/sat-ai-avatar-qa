// 依實際留言串數排列問答順序。
// 只算 docs/content-source-audit.json 裡的原始紀錄（Q001 起）與上課教室匯入紀錄，
// 舊課堂存檔對照（legacyRecords）與後續補圖（LIB-）跟原留言重複，不另計。
// 同一則留言拆成多題時，每題各算一次。

// 第一筆跟課實作提問（Telegram 配對卡關）出現在這天，之前多是買課前的疑問。
export const COURSE_OPENED_AT = '2026-09-12';
export const STARTER_COUNT = 10;

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function threadCounts(audit, questions) {
  const records = [...audit.records, ...audit.classroomImports.records];
  const dates = new Map(records.map(r => [r.recordId, r.date]));
  const sets = new Map([...questions.keys()].map(id => [id, new Set()]));
  for (const r of records) for (const s of r.subquestions) sets.get(s.questionId)?.add(r.recordId);
  for (const [id, q] of questions) for (const s of q.sourceRefs || []) if (dates.has(s.recordId)) sets.get(id).add(s.recordId);
  return new Map([...sets].map(([id, set]) => {
    const ds = [...set].map(r => dates.get(r)).sort();
    return [id, { total: ds.length, afterOpen: ds.filter(d => d >= COURSE_OPENED_AT).length, latest: ds.at(-1) || '' }];
  }));
}

// 前 10 題：上課後提出的留言串數多的優先，同數再看全部留言串數、最近提問日期。
// 其餘：全部留言串數多的優先，同數再看上課後留言串數、最近提問日期。
export function rankQuestions(audit, questions, starterCount = STARTER_COUNT) {
  const c = threadCounts(audit, questions);
  const eligible = [...questions.keys()].filter(id => questions.get(id).questionOrigin === 'asked' && questions.get(id).publication === 'published');
  const starters = [...eligible].sort((a, b) =>
    c.get(b).afterOpen - c.get(a).afterOpen || c.get(b).total - c.get(a).total || byText(c.get(b).latest, c.get(a).latest) || byText(a, b),
  ).slice(0, starterCount);
  const rest = [...questions.keys()].filter(id => !starters.includes(id)).sort((a, b) =>
    c.get(b).total - c.get(a).total || c.get(b).afterOpen - c.get(a).afterOpen || byText(c.get(b).latest, c.get(a).latest) || byText(a, b),
  );
  return { order: [...starters, ...rest], starters, counts: c };
}
