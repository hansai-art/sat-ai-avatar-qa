import synonyms from '../data/search-synonyms.json' with {type:'json'};
// Small lexical supplement to Pagefind, built only from published public fields.
// It does not infer an answer or send queries to an AI service.
const replacements=[
  [/沒有|木有/g,'沒'],[/沒(?:有)?(?:任何)?(?:回應|反應|回覆)|不(?:回應|回覆)|不理我/g,'沒反應'],
  [/付(?:過|了)?錢|付費|付了|收費|花費|費用|多少錢/g,'費用'],[/訂(?:了|閱)/g,'訂閱'],
  [/數字\s*(?:使用者\s*)?id|user\s*id/gi,'使用者id'],[/電報|\btg\b/gi,'telegram'],
  [/愛馬仕/gi,'hermes'],[/關機|關掉/g,'關機'],[/零基礎|完全不會|什麼都不懂/g,'新手'],
  [/哪邊|哪兒/g,'哪裡'],[/傳送|發送/g,'傳'],[/發訊息|發消息/g,'傳訊息'],[/消息/g,'訊息'],
];
const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// One pass per group, longest phrase first. The canonical word joins the
// alternation, so text that already says 安裝失敗 is not rewritten again
// through its shorter phrase 裝失敗.
const groups=synonyms.map(group=>[new RegExp([group.canonical,...group.phrases].map(p=>p.normalize('NFKC').toLowerCase()).sort((a,b)=>b.length-a.length).map(escape).join('|'),'g'),group.canonical]);
// Filler words become separators, so "是費用的嗎" does not create junk pairs
// such as 是費 that no answer contains. 會 stays: 不會寫程式 needs it.
const fillers=/(?:請問|請教|想請問|我想|我已經|已經|可以請|到底|完全|還是|一下|怎麼辦|怎麼|如何|為什麼|應該|是否|是不是|能不能|可不可以|要不要|會不會|需不需要|一定要|是什麼|什麼|我的|自己的|自己|大家|你們|我們|一直都|一直|我有|還要|可以|需要|我|還|都|就|了|的|呢|嗎|啊|呀|吧|喔|哦|嘛|是|很)/g;
export function normalizeSearch(text){
  let value=text.normalize('NFKC').toLowerCase();
  for(const [pattern,canonical] of groups)value=value.replace(pattern,canonical);
  for(const [pattern,replacement] of replacements)value=value.replace(pattern,replacement);
  // Questions and answers share this rule, so separators never hide a match.
  return value.replace(fillers,' ').replace(/[^\p{L}\p{N}]+/gu,' ');
}
function terms(text){
  const value=normalizeSearch(text),result=new Set();
  for(const word of value.match(/[a-z0-9]+|[\p{Script=Han}]+/gu)||[]){
    if(/^[a-z0-9]+$/.test(word)){result.add(word);continue;}
    for(let i=0;i<word.length-1;i++)result.add(word.slice(i,i+2));
  }
  return result;
}
export function rankColloquial(query,documents){
  const queryTerms=terms(query);if(!queryTerms.size)return [];
  const prepared=documents.map(doc=>({doc,title:terms(doc.title),keywords:terms(doc.keywords.join(' ')),summary:terms(doc.summary),aliases:terms(doc.aliases.join(' '))}));
  const weights=new Map([...queryTerms].map(term=>[term,Math.log(1+documents.length/(1+prepared.filter(d=>[d.title,d.keywords,d.summary,d.aliases].some(set=>set.has(term))).length))]));
  const possible=[...weights.values()].reduce((a,b)=>a+b,0);
  const normalized=normalizeSearch(query).replaceAll(' ','');
  const ranked=prepared.map(d=>{
    let matched=0,score=0;
    for(const [term,weight] of weights){
      const boost=d.title.has(term)?3:d.keywords.has(term)?2.8:d.summary.has(term)?1.5:d.aliases.has(term)?1:0;
      if(boost){matched+=weight;score+=weight*boost;}
    }
    const exact=d.doc.keywords.some(k=>normalizeSearch(k).replaceAll(' ','')===normalized)||normalizeSearch(d.doc.title).replaceAll(' ','').includes(normalized);
    const coverage=matched/possible;
    // A named tool/error code must match. Never promote a generic "找不到"
    // answer about HR above an actual ChatGPT result.
    const named=[...queryTerms].filter(t=>/^[a-z0-9]+$/.test(t));
    const namedMatch=named.every(t=>[d.title,d.keywords,d.summary,d.aliases].some(set=>set.has(t)));
    return {doc:d.doc,score:score*coverage+(exact?possible*4:0),coverage,exact,namedMatch};
  }).filter(d=>d.coverage>=.4&&d.namedMatch);
  ranked.sort((a,b)=>b.score-a.score||a.doc.id.localeCompare(b.doc.id));
  const top=ranked[0]?.score||0;
  return ranked.filter(d=>d.score>=top*.6);
}

export function searchSuggestions(query){const group=synonyms.find(g=>[g.canonical,...g.phrases].some(p=>query.includes(p)));return (group?.suggestions||['沒回應','連不上','教材下載']).filter(q=>q!==query);}
