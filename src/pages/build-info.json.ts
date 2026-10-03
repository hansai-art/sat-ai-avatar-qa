import {getQuestions,buildMode} from '../lib/content';
export async function GET(){
  const all=await getQuestions();
  const published=all.filter(q=>q.data.publication==='published');
  const archived=all.filter(q=>q.data.publication==='archived');
  return new Response(JSON.stringify({
    mode:buildMode,
    commit:process.env.CF_PAGES_COMMIT_SHA||process.env.GITHUB_SHA||null,
    base:import.meta.env.BASE_URL,
    dataModel:'single-registry-two-views',
    canonicalSource:'src/content/questions/*.md',
    workbenchContract:'https://github.com/hansai-art/sat-ai-avatar-qa/blob/main/docs/WORKBENCH-INTEGRATION.md',
    counts:{published:published.length,archived:archived.length},
    searchableIds:published.map(q=>q.id),
    archivedIds:archived.map(q=>q.id)
  }),{headers:{'Content-Type':'application/json'}});
}
