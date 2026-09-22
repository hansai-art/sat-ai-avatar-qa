export function faqKey(q) { return Number(q.data.questionOrigin==='anticipated')+'-'+String(q.data.faqOrder??99999).padStart(5,'0')+'-'+q.id; }
export function courseKey(q,taxonomy,chapterId) {
  const chapter=chapterId?taxonomy.chapters.find(c=>c.id===chapterId):taxonomy.chapters.filter(c=>q.data.chapterRefs.includes(c.id)).sort((a,b)=>a.order-b.order)[0];
  const lesson=Math.min(...(chapter?.lessons.filter(l=>q.data.lessonRefs.includes(l.id)).map(l=>l.order)||[]),99);
  return `${String(chapter?.order??99).padStart(2,'0')}-${String(lesson).padStart(2,'0')}-${faqKey(q)}`;
}

export function matchesQuestion(q,state,exclude='') {
  return ['chapter','type','tool','lesson'].every(key=>{
    if(key===exclude || (exclude==='chapter'&&key==='lesson') || !state[key])return true;
    return key==='type'?q.data.type===state.type:q.data[{chapter:'chapterRefs',tool:'toolRefs',lesson:'lessonRefs'}[key]].includes(state[key]);
  });
}
export function facetFilters(state,exclude) {
  const filters={};
  for(const key of ['chapter','type','tool','lesson'])if(state[key]&&key!==exclude&&!(exclude==='chapter'&&key==='lesson'))filters[key]=state[key];
  return filters;
}
export function lessonGroups(questions,chapter) {
  const groups=chapter.lessons.map(lesson=>({...lesson,questions:questions.filter(q=>q.data.lessonRefs.includes(lesson.id))})).filter(g=>g.questions.length);
  const withoutLesson=questions.filter(q=>!q.data.lessonRefs.some(id=>chapter.lessons.some(l=>l.id===id)));
  if(withoutLesson.length)groups.push({id:'general',title:'本章通用問題',order:99,questions:withoutLesson});
  return groups;
}
