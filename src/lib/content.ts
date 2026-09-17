import { getCollection, type CollectionEntry } from 'astro:content';
import taxonomy from '../data/taxonomy.json';
import {validateQuestions,visibleQuestions,publishedQuestions} from './schema.mjs';
import {withBase} from './paths.mjs';
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
  return item?.title || item?.name || id;
}
export function relatedQuestions(q:Question,all:Question[]) {
  const candidates=all.filter(x=>x.id!==q.id && x.data.publication==='published');
  const score=(x:Question)=>x.data.toolRefs.filter(t=>q.data.toolRefs.includes(t)).length*2+x.data.chapterRefs.filter(c=>q.data.chapterRefs.includes(c)).length+Number(x.data.type===q.data.type);
  const explicit=q.data.related.map(id=>candidates.find(x=>x.id===id)).filter(Boolean) as Question[];
  const extra=candidates.filter(x=>!q.data.related.includes(x.id)&&score(x)>0).sort((a,b)=>score(b)-score(a)||b.data.updatedAt.localeCompare(a.data.updatedAt)||a.id.localeCompare(b.id));
  return [...explicit,...extra].slice(0,4);
}
