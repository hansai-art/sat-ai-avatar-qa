type OrbitDot={el:SVGCircleElement;angle:number};
type OrbitRing={
  el:SVGGElement;
  rx:number;
  ry:number;
  id:string;
  name:string;
  label:string;
  count:string;
  link:SVGAElement;
  ellipses:SVGEllipseElement[];
  dots:OrbitDot[];
  speed:number;
  boost:number;
  boostTarget:number;
  legend:HTMLLIElement|undefined;
};

const escapeHtml=(value:string)=>value.replace(/[&<>"]/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',
}[char]||char));

document.querySelectorAll<SVGSVGElement>('.orbit-map[data-starmap]').forEach(svg=>{
  const panel=svg.closest<HTMLElement>('.starmap');
  if(!panel||svg.dataset.enhanced==='true')return;
  svg.dataset.enhanced='true';

  const centerX=Number(svg.dataset.cx);
  const centerY=Number(svg.dataset.cy);
  const baseRotation=Number(svg.dataset.rot);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const legend=[...panel.querySelectorAll<HTMLLIElement>('.starmap-legend li')];
  const rings=[...svg.querySelectorAll<SVGGElement>('.ring')].map<OrbitRing>(el=>{
    const rx=Number(el.dataset.rx);
    return {
      el,
      rx,
      ry:Number(el.dataset.ry),
      id:el.dataset.ch||'',
      name:el.dataset.name||'',
      label:el.dataset.label||'',
      count:el.dataset.count||'0',
      link:el.querySelector<SVGAElement>('a')!,
      ellipses:[...el.querySelectorAll<SVGEllipseElement>('ellipse')],
      dots:[...el.querySelectorAll<SVGCircleElement>('.dot')].map(dot=>({el:dot,angle:Number(dot.dataset.t)})),
      speed:(Math.PI*2)/(36*Math.pow(rx/40,1.2)),
      boost:1,
      boostTarget:1,
      legend:legend.find(item=>item.dataset.ch===el.dataset.ch),
    };
  });

  const tooltip=document.createElement('div');
  tooltip.className='starmap-tip';
  tooltip.setAttribute('role','status');
  tooltip.setAttribute('aria-hidden','true');
  panel.append(tooltip);

  let rotation=baseRotation;
  let targetRotation=baseRotation;
  let previousTransform='';
  let running=false;
  let visible=true;
  let frameId=0;
  let lastFrame=0;
  let pauseOrbit=false;
  let lastPointerType='mouse';
  let armedTarget:string|SVGCircleElement|null=null;
  let armedTimer=0;

  const chapterName=(ring:OrbitRing)=>`${ring.label==='＋'?'':`第 ${ring.label} 章・`}${ring.name}`;
  const showTooltip=(html:string,clientX:number,clientY:number)=>{
    const panelBox=panel.getBoundingClientRect();
    tooltip.innerHTML=html;
    const width=tooltip.offsetWidth||200;
    const left=Math.max(width/2+8,Math.min(panelBox.width-width/2-8,clientX-panelBox.left));
    tooltip.style.left=`${left}px`;
    tooltip.style.top=`${Math.max(tooltip.offsetHeight+16,clientY-panelBox.top)}px`;
    tooltip.classList.add('on');
    tooltip.setAttribute('aria-hidden','false');
  };
  const hideTooltip=()=>{
    tooltip.classList.remove('on');
    tooltip.setAttribute('aria-hidden','true');
  };
  const focusRing=(active:OrbitRing|null,on:boolean)=>{
    svg.classList.toggle('focus',on);
    rings.forEach(ring=>{
      const hot=on&&ring===active;
      ring.el.classList.toggle('hot',hot);
      ring.boostTarget=hot?4:1;
      ring.legend?.classList.toggle('hover',hot);
    });
  };

  const place=(elapsed:number)=>{
    const angle=rotation*Math.PI/180;
    const cosine=Math.cos(angle);
    const sine=Math.sin(angle);
    const transform=`rotate(${rotation.toFixed(2)} ${centerX} ${centerY})`;
    if(transform!==previousTransform){
      rings.forEach(ring=>ring.ellipses.forEach(ellipse=>ellipse.setAttribute('transform',transform)));
      previousTransform=transform;
    }
    rings.forEach(ring=>{
      ring.boost+=(ring.boostTarget-ring.boost)*Math.min(1,elapsed*6);
      const step=pauseOrbit?0:ring.speed*ring.boost*elapsed;
      ring.dots.forEach(dot=>{
        dot.angle+=step;
        const x=ring.rx*Math.cos(dot.angle);
        const y=ring.ry*Math.sin(dot.angle);
        dot.el.setAttribute('cx',(centerX+x*cosine-y*sine).toFixed(1));
        dot.el.setAttribute('cy',(centerY+x*sine+y*cosine).toFixed(1));
      });
    });
  };
  const animate=(now:number)=>{
    const elapsed=Math.min(.05,(now-(lastFrame||now))/1000);
    lastFrame=now;
    rotation+=(targetRotation-rotation)*Math.min(1,elapsed*4);
    place(elapsed);
    frameId=requestAnimationFrame(animate);
  };
  const start=()=>{
    if(reducedMotion||running||!visible||document.hidden)return;
    running=true;
    lastFrame=0;
    frameId=requestAnimationFrame(animate);
  };
  const stop=()=>{
    running=false;
    cancelAnimationFrame(frameId);
  };

  new IntersectionObserver(entries=>{
    visible=entries[0]?.isIntersecting??false;
    if(visible)start();else stop();
  }).observe(svg);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  panel.addEventListener('pointerdown',event=>{lastPointerType=event.pointerType;},{passive:true});

  rings.forEach(ring=>{
    const ringTip=()=>`<b>${escapeHtml(chapterName(ring))}</b><small>${ring.count} 題，${lastPointerType==='touch'?'再點一下':'點一下'}進入這一章</small>`;
    ring.el.addEventListener('pointerenter',event=>{
      if(event.pointerType==='mouse')focusRing(ring,true);
    });
    ring.el.addEventListener('pointerleave',event=>{
      if(event.pointerType==='mouse'){
        focusRing(ring,false);
        hideTooltip();
      }
    });
    ring.el.querySelector<SVGEllipseElement>('.hit')?.addEventListener('pointermove',event=>{
      if(event.pointerType==='mouse')showTooltip(ringTip(),event.clientX,event.clientY);
    });
    ring.link.addEventListener('click',event=>{
      if(lastPointerType!=='touch')return;
      if(armedTarget===`ring-${ring.id}`)return;
      event.preventDefault();
      armedTarget=`ring-${ring.id}`;
      clearTimeout(armedTimer);
      armedTimer=window.setTimeout(()=>{
        armedTarget=null;
        hideTooltip();
        focusRing(ring,false);
      },2500);
      focusRing(ring,true);
      showTooltip(ringTip(),event.clientX,event.clientY);
    });

    ring.dots.forEach(dot=>{
      const dotTip=()=>`<b>${escapeHtml(dot.el.dataset.q||'')}</b><small>${escapeHtml(chapterName(ring))}，${lastPointerType==='touch'?'再點一下開啟':'點一下開啟'}</small>`;
      const position=()=>{
        const box=dot.el.getBoundingClientRect();
        return [box.left+box.width/2,box.top+4] as const;
      };
      dot.el.addEventListener('pointerenter',event=>{
        if(event.pointerType!=='mouse')return;
        pauseOrbit=true;
        dot.el.classList.add('pick');
        showTooltip(dotTip(),...position());
      });
      dot.el.addEventListener('pointerleave',event=>{
        if(event.pointerType!=='mouse')return;
        pauseOrbit=false;
        dot.el.classList.remove('pick');
      });
      dot.el.parentElement?.addEventListener('click',event=>{
        if(lastPointerType!=='touch')return;
        event.stopPropagation();
        if(armedTarget===dot.el)return;
        event.preventDefault();
        armedTarget=dot.el;
        clearTimeout(armedTimer);
        pauseOrbit=true;
        rings.forEach(item=>item.dots.forEach(candidate=>candidate.el.classList.remove('pick')));
        dot.el.classList.add('pick');
        focusRing(ring,true);
        showTooltip(dotTip(),...position());
        armedTimer=window.setTimeout(()=>{
          armedTarget=null;
          pauseOrbit=false;
          dot.el.classList.remove('pick');
          hideTooltip();
          focusRing(ring,false);
        },2500);
      });
    });

    ring.legend?.addEventListener('pointerenter',event=>{
      if(event.pointerType==='mouse')focusRing(ring,true);
    });
    ring.legend?.addEventListener('pointerleave',event=>{
      if(event.pointerType==='mouse')focusRing(ring,false);
    });
  });

  document.addEventListener('pointerdown',event=>{
    if(armedTarget&&!svg.contains(event.target as Node)){
      armedTarget=null;
      pauseOrbit=false;
      hideTooltip();
      focusRing(null,false);
      svg.querySelectorAll('.pick').forEach(dot=>dot.classList.remove('pick'));
    }
  },{passive:true});
  panel.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse')return;
    const box=panel.getBoundingClientRect();
    targetRotation=baseRotation+((event.clientX-box.left)/box.width-.5)*8;
  });
  panel.addEventListener('pointerleave',()=>{
    targetRotation=baseRotation;
    hideTooltip();
  });

  const scheduleStart=()=>window.setTimeout(start,700);
  if('requestIdleCallback' in window)window.requestIdleCallback(scheduleStart,{timeout:1500});
  else setTimeout(scheduleStart,300);
});
