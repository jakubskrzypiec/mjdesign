/* Sunlight through a window, drifting slowly across calibrated wall surfaces, as if the sun moved.
   The photograph itself stays fixed. Compositor animation keeps motion independent of a JavaScript loop. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pane=document.createElement('canvas');pane.width=800;pane.height=900;
 const ctx=pane.getContext('2d');if(!ctx)return;
 // Two columns by three rows of glass, sheared like a low sun projects them; the gaps are the glazing bars.
 ctx.filter='blur(11px)';ctx.fillStyle='#fff0d2';
 ctx.setTransform(1,0,-.38,1,330,0);
 const w=170,h=230,bar=30,x0=110,y0=70;
 for(let row=0;row<3;row++)for(let col=0;col<2;col++)ctx.fillRect(x0+col*(w+bar),y0+row*(h+bar),w,h);
 const windowLight='url("'+pane.toDataURL()+'")';
 const create=async host=>{
  const source=host.querySelector(':scope > img')||host.querySelector('.hero-approved-bg,.subpage-hero-bg')||(host.matches('.mj-home-contact-photo')?host:null);if(!source)return;
  const isPhoto=source.tagName==='IMG';
  const url=isPhoto?(source.currentSrc||source.src):getComputedStyle(source).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];if(!url)return;
  const photo=new Image();photo.src=url;try{await photo.decode();}catch{return;}
  // x/y bounds in original image coordinates (top-left origin), excluding furnishings.
  // The hero gets two walls: the window wall on the left and the panelled wall above the sofa,
  // which stays in frame on narrow screens where the left wall is cropped away.
  const walls=url.includes('panorama')?[[.10,.02,.55,.69]]:url.includes('detail')?[[.27,.02,.67,.46]]:[[.015,.02,.28,.51],[.53,.03,.87,.46]];
  const surface=url.includes('panorama')?'dining-wall':url.includes('detail')?'reading-wall':'living-walls';
  const layer=document.createElement('div');layer.className='quiet-light-canvas';layer.setAttribute('aria-hidden','true');
  const regions=walls.map((wall,i)=>{
   const region=document.createElement('div');region.className='wall-shadow-region';
   const feather=document.createElement('div');feather.className='wall-shadow-feather';
   const leaves=document.createElement('div');leaves.className='wall-light';leaves.style.backgroundImage=windowLight;
   // Offset each wall's drift so the patches never move in lockstep.
   if(i){leaves.style.animationDuration='26s';leaves.style.animationDelay='-9s';}
   feather.append(leaves);region.append(feather);layer.append(region);
   return {wall,region,leaves};
  });
  let visible=false;
  const percent=v=>v?.endsWith('%')?parseFloat(v)/100:.5;
  const layout=()=>{
   const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
   const placement=(isPhoto?getComputedStyle(source).objectPosition:getComputedStyle(source).backgroundPosition).split(' ');
   const scale=Math.max(r.width/photo.width,r.height/photo.height),ox=(r.width-photo.width*scale)*percent(placement[0]),oy=(r.height-photo.height*scale)*percent(placement[1]);
   regions.forEach(({wall,region})=>Object.assign(region.style,{left:(ox+wall[0]*photo.width*scale)+'px',top:(oy+wall[1]*photo.height*scale)+'px',width:((wall[2]-wall[0])*photo.width*scale)+'px',height:((wall[3]-wall[1])*photo.height*scale)+'px'}));
  };
  const update=()=>{
   const paused=reduced.matches||document.hidden||document.documentElement.classList.contains('light-paused');
   layer.hidden=paused;host.classList.toggle('quiet-light-ready',!paused);
   regions.forEach(({leaves})=>{leaves.style.animationPlayState=visible&&!paused?'running':'paused';});host.dataset.shadowMotion=visible&&!paused?'running':'paused';
   if(visible&&!paused)layout();
  };
  host.append(layer);host.dataset.shadowSurface=surface;layout();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{rootMargin:'40px 0px'}).observe(host);
  new ResizeObserver(layout).observe(host);
  new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 };
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);create(entry.target);}});},{rootMargin:'200px 0px'});
 document.querySelectorAll('.light-break:not(.light-break--editorial),.light-scene--hero,.subpage-hero,.mj-workflow-image,.mj-home-contact-photo').forEach(host=>observer.observe(host));
})();
