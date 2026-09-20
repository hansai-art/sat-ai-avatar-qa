export const intents = [
  {id:'operation',name:'操作排錯'},
  {id:'concept',name:'概念理解'},
  {id:'resources',name:'課程與資源'},
];
export const intentLabel = id => intents.find(item=>item.id===id)?.name || '操作排錯';
export function faqKey(q) { return String(q.data.faqOrder??99999).padStart(5,'0')+'-'+q.id; }
export function courseKey(q,taxonomy,chapterId) {
  const chapter=chapterId?taxonomy.chapters.find(c=>c.id===chapterId):taxonomy.chapters.filter(c=>q.data.chapterRefs.includes(c.id)).sort((a,b)=>a.order-b.order)[0];
  const lesson=chapter?.id==='ch01'?0:Math.min(...(chapter?.lessons.filter(l=>q.data.lessonRefs.includes(l.id)).map(l=>l.order)||[]),99);
  return `${String(chapter?.order??99).padStart(2,'0')}-${String(lesson).padStart(2,'0')}-${faqKey(q)}`;
}
