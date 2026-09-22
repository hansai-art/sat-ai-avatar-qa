import PhotoSwipeLightbox from 'photoswipe/lightbox';

// Existing Markdown images use the same viewer. Structured screenshots also
// provide a small preview and a full-image link when JavaScript is unavailable.
for(const img of document.querySelectorAll<HTMLImageElement>('.prose img')) {
  let link=img.closest('a');
  if(!link){link=document.createElement('a');link.href=img.currentSrc||img.src;link.target='_blank';link.rel='noopener noreferrer';img.before(link);link.append(img);}
  const width=Number(img.getAttribute('width'))||img.naturalWidth,height=Number(img.getAttribute('height'))||img.naturalHeight;
  if(!width||!height)continue;
  link.dataset.qaImage='';link.dataset.pswpWidth=String(width);link.dataset.pswpHeight=String(height);
  link.setAttribute('aria-label','放大圖片：'+img.alt);
}

if(document.querySelector('[data-qa-image]')) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lightbox=new PhotoSwipeLightbox({
    gallery:'.answer',children:'[data-qa-image]',
    pswpModule:()=>import('photoswipe'),mainClass:'qa-image-viewer',
    // Open immediately so Close also works during image loading or rapid taps.
    bgOpacity:1,showHideAnimationType:'fade',showAnimationDuration:0,
    hideAnimationDuration:reduced?0:160,zoomAnimationDuration:reduced?0:160,
    initialZoomLevel:'fit',secondaryZoomLevel:1,maxZoomLevel:3,
    paddingFn:()=>({top:80,bottom:130,left:12,right:12}),
    zoom:false,closeTitle:'關閉圖片',closeSVG:'關閉',
    arrowPrevTitle:'上一張圖片',arrowNextTitle:'下一張圖片',
    errorMsg:'圖片暫時無法載入，請關閉後重新開啟。',
    imageClickAction:'zoom',tapAction:false,doubleTapAction:'zoom',
    wheelToZoom:true,pinchToClose:false,closeOnVerticalDrag:false,
    allowPanToNext:false,loop:false,preload:[0,0],
  });
  let savedScroll=0;
  let trigger:HTMLElement|null=null;
  let oldOverflow='';
  const background=new Map<HTMLElement,boolean>();
  for(const link of document.querySelectorAll<HTMLElement>('[data-qa-image]'))link.addEventListener('click',()=>link.focus({preventScroll:true}));
  lightbox.on('beforeOpen',()=>{
    savedScroll=scrollY;trigger=document.activeElement as HTMLElement;
    oldOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    for(const child of document.body.children)if(child instanceof HTMLElement&&!['SCRIPT','STYLE','LINK'].includes(child.tagName)){background.set(child,child.inert);child.inert=true;}
  });
  lightbox.on('afterInit',()=>{
    const pswp=lightbox.pswp!;
    pswp.element?.setAttribute('aria-label','操作圖片檢視器');
    pswp.element?.setAttribute('aria-modal','true');
    pswp.element?.setAttribute('aria-describedby','image-viewer-help');
    pswp.scrollWrap?.setAttribute('aria-roledescription','圖片瀏覽');
  });
  lightbox.on('openingAnimationEnd',()=>lightbox.pswp?.element?.querySelector<HTMLButtonElement>('.pswp__button--close')?.focus({preventScroll:true}));
  lightbox.on('keydown',event=>{
    const key=event.originalEvent;
    if(key.key!=='Tab')return;
    // PhotoSwipe's focusin guard cannot intercept focus moving into browser
    // chrome. Cycle enabled controls explicitly, including Shift+Tab.
    key.preventDefault();event.preventDefault();
    const controls=[...(lightbox.pswp?.element?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')||[])].filter(el=>el.getClientRects().length>0);
    const at=controls.indexOf(document.activeElement as HTMLElement);
    controls[(at+(key.shiftKey?-1:1)+controls.length)%controls.length]?.focus({preventScroll:true});
  });
  lightbox.on('destroy',()=>{
    document.documentElement.style.overflow=oldOverflow;
    for(const [el,inert] of background)el.inert=inert;
    background.clear();
    trigger?.focus({preventScroll:true});window.scrollTo({top:savedScroll,behavior:'instant'});
  });
  lightbox.on('uiRegister',()=>{
    const pswp=lightbox.pswp!;
    for(const [name,title,factor] of [['zoom-out','縮小',1/1.5],['zoom-in','放大',1.5],['fit','全圖',0]] as const) {
      pswp.ui?.registerElement({name,order:10+factor,isButton:true,title:name==='fit'?'顯示全圖':title,html:title,
        onClick:()=>{const s=pswp.currSlide;if(!s)return;const level=factor?Math.max(s.zoomLevels.initial,Math.min(s.zoomLevels.max,s.currZoomLevel*factor)):s.zoomLevels.initial;pswp.zoomTo(level,{x:Math.max(12,s.pan.x),y:Math.max(80,s.pan.y)},reduced?0:160);},
        onInit:(el)=>{const update=()=>{const s=pswp.currSlide;if(s)(el as HTMLButtonElement).disabled=factor>1?s.currZoomLevel>=s.zoomLevels.max-.001:s.currZoomLevel<=s.zoomLevels.initial+.001;};pswp.on('zoomPanUpdate',update);pswp.on('change',update);}
      });
    }
    pswp.ui?.registerElement({name:'image-help',appendTo:'root',isButton:false,
      onInit:(el)=>{
        const caption=document.createElement('p'),help=document.createElement('p');
        help.id='image-viewer-help';help.textContent='雙指或雙擊縮放，放大後拖曳查看。';
        el.append(caption,help);
        pswp.on('change',()=>{
          const item=pswp.currSlide?.data.element;
          caption.textContent=item?.closest('figure')?.querySelector('figcaption')?.textContent||item?.querySelector('img')?.alt||'';
        });
      }
    });
  });
  lightbox.init();
}
