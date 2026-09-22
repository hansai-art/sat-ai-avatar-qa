export const PAGE_SIZE=12;
export function parseState(query,taxonomy) {
  const params=new URLSearchParams(query),notices=[];
  const raw=params.get('q')||'';
  const state={q:[...raw.normalize('NFKC').trim().replace(/\s+/g,' ')].slice(0,200).join(''),chapter:'',lesson:'',tool:'',type:'',sort:['course','updated'].includes(params.get('sort'))?params.get('sort'):'common',page:1};
  const page=params.get('page')||'1';state.page=/^[1-9]\d{0,6}$/.test(page)?Number(page):1;
  for(const [key,list] of [['chapter',taxonomy.chapters],['tool',taxonomy.tools],['type',taxonomy.types]]) {
    const value=params.get(key);if(value&&list.some(x=>x.id===value))state[key]=value;else if(value)notices.push('已清除無效或已合併的篩選條件');
  }
  if(!state.type&&['concept','resources'].includes(params.get('intent')))state.type=params.get('intent')==='concept'?'concept':'course-resources';
  if(params.has('intent'))notices.push('問題用途已合併為問題分類');
  const lesson=params.get('lesson');
  if(lesson){const owner=taxonomy.chapters.find(c=>c.lessons.some(l=>l.id===lesson));if(owner&&(!state.chapter||owner.id===state.chapter)){state.chapter=owner.id;state.lesson=lesson;}else notices.push('已清除無效的小節條件');}
  return {state,notices:[...new Set(notices)]};
}
export function serializeState(state) {
  const p=new URLSearchParams();
  for(const key of ['q','chapter','lesson','tool','type'])if(state[key])p.set(key,state[key]);
  if(state.sort!=='common')p.set('sort',state.sort);
  if(state.page>1)p.set('page',String(state.page));
  return p.toString();
}
export function queryOptions(state) {
  const filters={};for(const key of ['chapter','lesson','tool','type'])if(state[key])filters[key]=state[key];
  return {filters,...(!state.q?{sort:state.sort==='updated'?{updated:'desc'}:state.sort==='course'?{['course'+(state.chapter?'-'+state.chapter:'')]:'asc'}:{faq:'asc'}}:{})};
}
