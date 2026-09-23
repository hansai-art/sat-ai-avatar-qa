import {getPublished,taxonomy,href} from '../lib/content';
export async function GET(){
  const questions=await getPublished();
  // Explicit allowlist: no source records, author names, drafts or editorial notes.
  return new Response(JSON.stringify(questions.map(({id,data:d})=>({
    id,url:href(`/questions/${id}/`),title:d.title,summary:d.summary,
    keywords:[...d.keywords,...d.errorMessages],
    aliases:taxonomy.tools.filter(t=>d.toolRefs.includes(t.id)).flatMap(t=>[t.name,...t.aliases]),
    chapterRefs:d.chapterRefs,lessonRefs:d.lessonRefs,toolRefs:d.toolRefs,type:d.type,
    answerStatus:d.answerStatus,contentOrigin:d.contentOrigin,questionOrigin:d.questionOrigin
  }))),{headers:{'Content-Type':'application/json'}});
}
