import {parseState,serializeState,queryOptions,PAGE_SIZE} from '../lib/search-state.mjs';
import {intentLabel} from '../lib/faq.mjs';
import {withBase} from '../lib/paths.mjs';

const config=document.querySelector<HTMLElement>('#search-config')!;
const base=config.dataset.base!,taxonomy=JSON.parse(config.dataset.taxonomy!);
const root=withBase(config.dataset.root||'/questions/',base);
const form=document.querySelector<HTMLFormElement>('#search-form')!;
const input=form.elements.namedItem('q') as HTMLInputElement;
const staticResults=document.querySelector<HTMLElement>('#static-results')!;
const live=document.querySelector<HTMLElement>('#live-results')!;
const list=document.querySelector<HTMLElement>('#result-list')!;
const message=document.querySelector<HTMLElement>('#search-message')!;
const count=document.querySelector<HTMLElement>('#result-count')!;
const pagination=document.querySelector<HTMLElement>('#search-pagination')!;
const notice=document.querySelector<HTMLElement>('#search-notice')!;
let state=parseState(location.search,taxonomy).state;
let sequence=0,composing=false,timer:ReturnType<typeof setTimeout>|undefined;
let enginePromise:Promise<any>|undefined;
const control=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement|RadioNodeList;
function engine(){return enginePromise ||= import(/* @vite-ignore */ withBase('/pagefind/pagefind.js',base)).then(async mod=>{await mod.options({baseUrl:base,excerptLength:32});return mod;}).catch(error=>{enginePromise=undefined;throw error;});}
function element<K extends keyof HTMLElementTagNameMap>(tag:K,text='',className='') {
  const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;
}
function label(kind:string,id:string){const item=taxonomy[kind].find((x:any)=>x.id===id);return item?.name||item?.title||id;}
function syncForm(){
  for(const key of ['q','chapter','lesson','tool','type'])control(key).value=state[key as keyof typeof state] as string;
  // RadioNodeList.value cannot reliably select the empty "all" value.
  for(const radio of form.querySelectorAll<HTMLInputElement>('input[type=radio]'))radio.checked=radio.value===state[radio.name as keyof typeof state];
  syncLessons();syncFilters();
}
function syncLessons(){const chapter=control('chapter').value;document.querySelector<HTMLElement>('#lesson-filter')!.hidden=chapter==='ch01';for(const opt of (control('lesson') as HTMLSelectElement).options){const disabled=!!opt.value&&!!chapter&&opt.dataset.chapter!==chapter;opt.disabled=disabled;opt.hidden=disabled;}}
function syncFilters(){
  document.querySelector<HTMLElement>('#chapter-filter')!.hidden=state.sort!=='course'&&!state.chapter;
  document.querySelector<HTMLElement>('#sort-description')!.textContent=state.q?'依搜尋關聯排序':state.sort==='course'?'依章節與小節順序':state.sort==='updated'?'依最近更新':'新手卡關優先';

  document.querySelector<HTMLElement>('#clear-filters')!.hidden=!['chapter','lesson','tool','type','intent'].some(key=>state[key as keyof typeof state]);
  document.querySelector<HTMLElement>('#filter-summary')!.textContent=[state.tool&&label('tools',state.tool),state.type&&label('types',state.type),state.lesson&&'已選小節'].filter(Boolean).map(value=>' · '+value).join('');
}
function clearFilters(){state={...state,chapter:'',lesson:'',tool:'',type:'',intent:'',page:1};syncForm();void run('push');}
function updateUrl(mode:'push'|'replace') {
  const query=serializeState(state),next=root+(query?'?'+query:'');
  if(location.pathname+location.search!==next)history[mode==='push'?'pushState':'replaceState']({},'',next);
  try{sessionStorage.setItem('qa-last-search',next);}catch{}
}
function safeResultUrl(value:string) {
  const url=new URL(value,location.origin);
  if(url.origin!==location.origin||!url.pathname.startsWith(withBase('/questions/qa-',base)))throw new Error('不合法的結果網址');
  return url.pathname;
}
function resultCard(result:any) {
  const m=result.meta||{},card=element('article','','question-card');card.dataset.questionId=m.qaId||'';
  const details=element('details','','faq-item'),summary=element('summary');
  summary.append(element('h2',m.title||'問題'),element('span','＋','faq-toggle'));
  summary.querySelector('.faq-toggle')!.setAttribute('aria-hidden','true');
  summary.append(element('span',intentLabel(m.intent)+' · '+label('chapters',(m.chapters||'').split(',')[0])+(m.answerStatus==='needs-update'?' · 待更新':'')+(m.contentOrigin==='demo'?' · 示範':'')+(m.questionOrigin==='anticipated'?' · 延伸問題':''),'faq-meta'));
  const answer=element('div','','faq-answer');answer.append(element('p',m.summary||'','card-summary'));
  if(m.firstStep){const step=element('p','','first-step');step.append(element('strong','先做這一步'),document.createTextNode(m.firstStep));answer.append(step);}
  if(state.q&&result.excerpt){
    const excerpt=element('p','','search-excerpt');
    // Never attach search markup directly. Keep only plain text and highlight nodes.
    const parsed=new DOMParser().parseFromString(result.excerpt,'text/html');
    const walker=document.createTreeWalker(parsed.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(node.parentElement?.closest('script,style'))continue;
      excerpt.append(node.parentElement?.closest('mark')?element('mark',node.textContent||''):document.createTextNode(node.textContent||''));
    }
    answer.append(excerpt);
  }
  const link=element('a','查看完整解法 →','answer-link');link.href=safeResultUrl(result.url);answer.append(link);
  details.append(summary,answer);card.append(details);return card;
}
function restoreReadingPosition(){
  try {
    const saved=JSON.parse(sessionStorage.getItem('qa-reading-position')||'null');
    if(!saved||saved.url!==location.pathname+location.search)return;
    for(const card of document.querySelectorAll<HTMLElement>('.question-card'))if(saved.open.includes(card.dataset.questionId))card.querySelector('details')!.open=true;
    sessionStorage.removeItem('qa-reading-position');
    void document.fonts.ready.then(()=>requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,Number(saved.y)||0),behavior:'instant'})));
  }catch{}
}
document.addEventListener('click',event=>{
  if(!(event.target instanceof Element)||!event.target.closest('.answer-link'))return;
  try{sessionStorage.setItem('qa-reading-position',JSON.stringify({url:location.pathname+location.search,y:scrollY,open:[...document.querySelectorAll<HTMLElement>('.question-card:has(details[open])')].map(card=>card.dataset.questionId)}));}catch{}
});
async function run(mode:'push'|'replace'='replace') {
  const ticket=++sequence;
  updateUrl(mode);
  staticResults.hidden=true;live.hidden=false;message.hidden=true;pagination.hidden=true;list.replaceChildren();
  live.setAttribute('aria-busy','true');count.textContent='正在搜尋…';
  try {
    const pagefind=await engine();if(ticket!==sequence)return;
    const options=queryOptions(state);
    // Keep student questions first without downloading every result's article data.
    const groups=await Promise.all(['asked','anticipated'].map(origin=>pagefind.search(state.q||null,{...options,filters:{...options.filters,origin}})));
    if(ticket!==sequence)return;
    const response={results:groups.flatMap(group=>group.results)};
    const total=response.results.length,totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    if(state.page>totalPages){state.page=totalPages;updateUrl('replace');}
    const details=await Promise.all(response.results.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE).map((r:any)=>r.data()));
    if(ticket!==sequence)return;
    count.textContent=`找到 ${total} 個問題`;live.setAttribute('aria-busy','false');
    list.replaceChildren(...details.map(resultCard));restoreReadingPosition();
    if(!total){
      message.hidden=false;
      message.replaceChildren(element('h2','沒有符合的問題'),element('p',state.q?`「${state.q}」沒有找到答案。試試工具名稱、錯誤碼，或放寬篩選條件。`:'試試減少篩選條件，或瀏覽其他章節。'));
      if(state.chapter||state.lesson||state.tool||state.type||state.intent){const relax=element('button','清除篩選，保留關鍵字','outline-button');relax.type='button';relax.addEventListener('click',clearFilters);message.append(relax);}
      const clear=element('button','查看全部問題','outline-button');clear.type='button';clear.addEventListener('click',()=>{state=parseState('',taxonomy).state;syncForm();void run('push');});message.append(clear);const ask=element('a','回課程留言提問 ↗','answer-link');ask.href='https://sat.cool/course/201/comment';message.append(ask);
    }
    if(totalPages>1){pagination.hidden=false;pagination.replaceChildren();for(const delta of [-1,0,1]){
      if(delta===0){pagination.append(element('span',`第 ${state.page} / ${totalPages} 頁`));continue;}
      const button=element('button',delta<0?'上一頁':'下一頁','outline-button');button.type='button';button.disabled=state.page+delta<1||state.page+delta>totalPages;
      button.addEventListener('click',()=>{state.page+=delta;void run('push').then(()=>{count.tabIndex=-1;count.focus({preventScroll:true});window.scrollTo({top:count.getBoundingClientRect().top+scrollY-90,behavior:'instant'});});});pagination.append(button);
    }}
  }catch{
    if(ticket!==sequence)return;
    count.textContent='搜尋暫時無法載入';live.setAttribute('aria-busy','false');message.hidden=false;
    const retry=element('button','重試搜尋','outline-button');retry.type='button';retry.addEventListener('click',()=>void run());
    const browse=element('a','按章節瀏覽');browse.href=withBase('/chapters/',base);
    message.replaceChildren(element('h2','搜尋暫時無法載入'),element('p','請檢查連線後重試，或先從章節找到問題。'),retry,browse);
  }
}
function fromForm(mode:'push'|'replace') {
  clearTimeout(timer);sequence++;
  const params=new URLSearchParams();for(const [key,value] of new FormData(form))if(typeof value==='string')params.set(key,value);
  state=parseState(params.toString(),taxonomy).state;syncForm();void run(mode);
}
document.querySelector('#clear-filters')!.addEventListener('click',clearFilters);
form.addEventListener('submit',e=>{e.preventDefault();if(!composing)fromForm('push');});
input.addEventListener('focus',()=>{void engine().catch(()=>{});},{once:true});
input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);sequence++;});
input.addEventListener('compositionend',()=>{composing=false;clearTimeout(timer);sequence++;timer=setTimeout(()=>fromForm('replace'),250);});
input.addEventListener('input',()=>{sequence++;clearTimeout(timer);if(!composing)timer=setTimeout(()=>fromForm('replace'),250);});
for(const select of document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('#search-form select,#search-form input[type=radio]'))select.addEventListener('change',()=>{if(select.name==='chapter')control('lesson').value='';fromForm('push');});
window.addEventListener('popstate',()=>{clearTimeout(timer);state=parseState(location.search,taxonomy).state;syncForm();void run();});
const initial=parseState(location.search,taxonomy);if(initial.notices.length){notice.hidden=false;notice.textContent=initial.notices.join('。');}
syncForm();void run();
