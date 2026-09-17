import {parseState,serializeState,queryOptions,PAGE_SIZE} from '../lib/search-state.mjs';
import {withBase} from '../lib/paths.mjs';

const config=document.querySelector<HTMLElement>('#search-config')!;
const base=config.dataset.base!,taxonomy=JSON.parse(config.dataset.taxonomy!);
const root=withBase('/questions/',base);
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
const control=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
function engine(){return enginePromise ||= import(/* @vite-ignore */ withBase('/pagefind/pagefind.js',base)).then(async mod=>{await mod.options({baseUrl:base,excerptLength:32});return mod;}).catch(error=>{enginePromise=undefined;throw error;});}
function element<K extends keyof HTMLElementTagNameMap>(tag:K,text='',className='') {
  const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;
}
function label(kind:string,id:string){const item=taxonomy[kind].find((x:any)=>x.id===id);return item?.name||item?.title||id;}
function syncForm(){for(const key of ['q','chapter','lesson','tool','type','sort'])control(key).value=state[key as keyof typeof state] as string;syncLessons();}
function syncLessons(){const chapter=control('chapter').value;for(const opt of (control('lesson') as HTMLSelectElement).options){const disabled=!!opt.value&&!!chapter&&opt.dataset.chapter!==chapter;opt.disabled=disabled;opt.hidden=disabled;}}
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
  const eyebrow=element('div','','card-eyebrow');eyebrow.append(element('span',label('types',m.type||'')));
  if(m.answerStatus==='needs-update')eyebrow.append(element('span','待更新','status-badge'));
  const title=element('h2'),link=element('a',m.title||'問題');link.href=safeResultUrl(result.url);title.append(link);
  const summary=element('p',m.summary||'','card-summary');
  const meta=element('div','','card-meta'),tags=element('div','','tag-list');
  for(const [key,kind] of [['chapters','chapters'],['tools','tools']])for(const id of (m[key]||'').split(',').filter(Boolean)) {
    const tag=element('a',label(kind,id),'tag'+(kind==='tools'?' tool-tag':''));tag.href=withBase(`/${kind}/${encodeURIComponent(id)}/`,base);tags.append(tag);
  }
  const time=element('time',m.updatedAt||'');if(m.updatedAt)time.dateTime=m.updatedAt;
  meta.append(tags,time);card.append(eyebrow,title,summary,meta);return card;
}
async function run(mode:'push'|'replace'='replace') {
  const ticket=++sequence;
  updateUrl(mode);
  const active=state.q||state.chapter||state.lesson||state.tool||state.type||state.sort==='updated'||state.page>1;
  if(!active){staticResults.hidden=false;live.hidden=true;live.setAttribute('aria-busy','false');count.textContent=`共 ${config.dataset.total} 個問題`;return;}
  staticResults.hidden=true;live.hidden=false;message.hidden=true;pagination.hidden=true;list.replaceChildren();
  live.setAttribute('aria-busy','true');count.textContent='正在搜尋…';
  try {
    const pagefind=await engine();if(ticket!==sequence)return;
    const response=await pagefind.search(state.q||null,queryOptions(state));if(ticket!==sequence)return;
    const total=response.results.length,totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    if(state.page>totalPages){state.page=totalPages;updateUrl('replace');}
    const details=await Promise.all(response.results.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE).map((r:any)=>r.data()));
    if(ticket!==sequence)return;
    count.textContent=`找到 ${total} 個問題`;live.setAttribute('aria-busy','false');
    list.replaceChildren(...details.map(resultCard));
    if(!total){message.hidden=false;const clear=element('button','清除搜尋與篩選','outline-button');clear.type='button';clear.addEventListener('click',()=>{state=parseState('',taxonomy).state;syncForm();void run('push');});message.replaceChildren(element('h2','沒有符合的問題'),element('p',state.q?`「${state.q}」沒有找到答案。試試工具名稱、錯誤碼，或放寬篩選條件。`:'試試減少篩選條件，或瀏覽其他章節。'),clear);}
    if(totalPages>1){pagination.hidden=false;pagination.replaceChildren();for(const delta of [-1,0,1]){
      if(delta===0){pagination.append(element('span',`第 ${state.page} / ${totalPages} 頁`));continue;}
      const button=element('button',delta<0?'上一頁':'下一頁','outline-button');button.type='button';button.disabled=state.page+delta<1||state.page+delta>totalPages;
      button.addEventListener('click',()=>{state.page+=delta;void run('push');});pagination.append(button);
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
  state=parseState(params.toString(),taxonomy).state;syncLessons();void run(mode);
}
form.addEventListener('submit',e=>{e.preventDefault();if(!composing)fromForm('push');});
input.addEventListener('focus',()=>{void engine().catch(()=>{});},{once:true});
input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);sequence++;});
input.addEventListener('compositionend',()=>{composing=false;clearTimeout(timer);sequence++;timer=setTimeout(()=>fromForm('replace'),250);});
input.addEventListener('input',()=>{sequence++;clearTimeout(timer);if(!composing)timer=setTimeout(()=>fromForm('replace'),250);});
for(const select of document.querySelectorAll<HTMLSelectElement>('select[form="search-form"],#search-form select'))select.addEventListener('change',()=>{if(select.name==='chapter')control('lesson').value='';fromForm('push');});
window.addEventListener('popstate',()=>{clearTimeout(timer);state=parseState(location.search,taxonomy).state;syncForm();void run();});
const initial=parseState(location.search,taxonomy);if(initial.notices.length){notice.hidden=false;notice.textContent=initial.notices.join('。');}
syncForm();void run();
