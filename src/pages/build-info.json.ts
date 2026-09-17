import {getQuestions,buildMode} from '../lib/content';
export async function GET(){
  const all=await getQuestions();
  return new Response(JSON.stringify({mode:buildMode,base:import.meta.env.BASE_URL,searchableIds:all.filter(q=>q.data.publication==='published').map(q=>q.id),archivedIds:all.filter(q=>q.data.publication==='archived').map(q=>q.id)}),{headers:{'Content-Type':'application/json'}});
}
