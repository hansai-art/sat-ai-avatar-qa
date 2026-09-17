import {getPublished,taxonomy,href,buildMode} from '../lib/content';
import type {APIRoute} from 'astro';
export const GET:APIRoute=async({site})=>{
  const urls=buildMode==='production'&&site?.protocol==='https:'?['/','/chapters/','/tools/','/types/','/about/',...taxonomy.chapters.map(c=>`/chapters/${c.id}/`),...taxonomy.tools.map(t=>`/tools/${t.id}/`),...taxonomy.types.map(t=>`/types/${t.id}/`),...(await getPublished()).map(q=>`/questions/${q.id}/`)]:[];
  const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${escape(new URL(href(url),site!).href)}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});
};
