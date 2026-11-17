import { getCollection, type CollectionEntry } from 'astro:content';
import taxonomy from '../data/taxonomy.json';
import {chapterLabel} from './chapter-label.mjs';
import {validateQuestions,visibleQuestions,publishedQuestions} from './schema.mjs';
import {withBase} from './paths.mjs';
import {buildSimilarity} from './similar.mjs';
import installStepsData from '../data/install-steps.json';
export {taxonomy};
export type Question=CollectionEntry<'questions'>;
export const buildMode=process.env.BUILD_MODE || (import.meta.env.DEV?'demo':'production');
export const href=(path:string)=>withBase(path,import.meta.env.BASE_URL);
let memo: Promise<Question[]> | undefined;
export function getQuestions():Promise<Question[]> {
  return memo ||= getCollection('questions').then(entries=> {
    validateQuestions(entries,taxonomy,buildMode);
    const visible=visibleQuestions(entries,buildMode) as Question[];
    if(!publishedQuestions(visible).length)throw new Error('尚無可發布問答。內容由 Hans 提供，請先使用 npm run build:demo 預覽架構。');
    return visible;
  });
}
export const getPublished=async()=>publishedQuestions(await getQuestions()) as Question[];
export function label(kind:'chapters'|'tools'|'types',id:string) {
  const item=taxonomy[kind].find((x:any)=>x.id===id) as {title?:string;name?:string}|undefined;
  return kind==='chapters'?chapterLabel(item)||id:item?.title || item?.name || id;
}
// 相似問題只在已發布的題目之間比對，建置時算一次。封存題頁面也照樣列出已發布的相似題。
let similarMemo: Promise<Map<string,{id:string;score:number}[]>> | undefined;
async function similarIndex() {
  return similarMemo ||= (async()=>{
    const published=await getPublished();
    const stepOf=new Map(installStepsData.flatMap((step,index)=>step.questions.map(id=>[id,index] as const)));
    return buildSimilarity(published.map(q=>({
      id:q.id,title:q.data.title,summary:q.data.summary,keywords:q.data.keywords,question:q.data.originalThread?.question||'',
      toolRefs:q.data.toolRefs,chapterRefs:q.data.chapterRefs,lessonRefs:q.data.lessonRefs,type:q.data.type,related:q.data.related,
      step:buildMode==='production'?stepOf.get(q.id)??null:null,order:q.data.faqOrder,anticipated:q.data.questionOrigin==='anticipated',
    })),{limit:8});
  })();
}
export async function similarQuestions(q:Question,limit=8):Promise<Question[]> {
  const published=await getPublished(),byId=new Map(published.map(x=>[x.id,x]));
  let ranked=(await similarIndex()).get(q.id);
  // 封存題不在比對名單裡，借用它的替代題或第一個關聯題的排序。
  if(!ranked){const anchor=q.data.supersededBy||q.data.related.find(id=>byId.has(id));ranked=anchor?[{id:anchor,score:1},...((await similarIndex()).get(anchor)||[])]:[];}
  const picked:Question[]=[];
  for(const entry of ranked){const item=byId.get(entry.id);if(item&&item.id!==q.id&&!picked.includes(item))picked.push(item);}
  return picked.slice(0,limit);
}
