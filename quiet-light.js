/* A sheer curtain moving in a light breeze, seen as soft folds of light and shade that ripple
   across the window wall on the left of the hero photograph. The photograph itself stays fixed.
   Only the hero gets this; every other photograph is static. Compositor animation only. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const host=document.querySelector('.light-scene--hero');if(!host)return;
 // Vertical folds of a sheer curtain: an uneven sine, so the folds are not evenly spaced.
 const folds=(period,wobble,color,power)=>{
  const c=document.createElement('canvas');c.width=900;c.height=40;
  const g=c.getContext('2d');if(!g)return null;
  for(let x=0;x<c.width;x++){
   const v=Math.pow(.5+.5*Math.sin(x/period+wobble*Math.sin(x/(period*3.3))),power);
   g.fillStyle=`rgba(${color},${v.toFixed(3)})`;g.fillRect(x,0,1,c.height);
  }
  return 'url("'+c.toDataURL()+'")';
 };
 const light=folds(17,1.3,'255,243,222',1.4), shade=folds(29,1,'58,45,32',2.6);
 if(!light||!shade)return;
 const create=async()=>{
  const source=host.querySelector('.hero-approved-bg');if(!source)return;
  const url=getComputedStyle(source).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];if(!url)return;
  const photo=new Image();photo.src=url;try{await photo.decode();}catch{return;}
  // Window wall on the left, in original image coordinates (x0, y0, x1, y1), above the skirting.
  const wall=[.0,.0,.285,.66];
  const layer=document.createElement('div');layer.className='quiet-light-canvas';layer.setAttribute('aria-hidden','true');
  const region=document.createElement('div');region.className='wall-shadow-region wall-shadow-region--curtain';
  const feather=document.createElement('div');feather.className='wall-shadow-feather';
  const sheets=[light,shade].map((image,i)=>{const el=document.createElement('div');el.className='wall-curtain wall-curtain--'+(i?'shade':'light');el.style.backgroundImage=image;feather.append(el);return el;});
  region.append(feather);layer.append(region);
  let visible=false;
  const percent=v=>v?.endsWith('%')?parseFloat(v)/100:.5;
  const layout=()=>{
   const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
   const placement=getComputedStyle(source).backgroundPosition.split(' ');
   const scale=Math.max(r.width/photo.width,r.height/photo.height),ox=(r.width-photo.width*scale)*percent(placement[0]),oy=(r.height-photo.height*scale)*percent(placement[1]);
   Object.assign(region.style,{left:(ox+wall[0]*photo.width*scale)+'px',top:(oy+wall[1]*photo.height*scale)+'px',width:((wall[2]-wall[0])*photo.width*scale)+'px',height:((wall[3]-wall[1])*photo.height*scale)+'px'});
  };
  const update=()=>{
   const paused=reduced.matches||document.hidden||document.documentElement.classList.contains('light-paused');
   layer.hidden=paused;host.classList.toggle('quiet-light-ready',!paused);
   sheets.forEach(el=>{el.style.animationPlayState=visible&&!paused?'running':'paused';});host.dataset.shadowMotion=visible&&!paused?'running':'paused';
   if(visible&&!paused)layout();
  };
  host.append(layer);host.dataset.shadowSurface='window-wall';layout();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{rootMargin:'40px 0px'}).observe(host);
  new ResizeObserver(layout).observe(host);
  new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 };
 create();
})();
