/* Moving foliage shadows on calibrated wall surfaces. The photograph itself stays fixed.
   Compositor animation keeps motion independent of a JavaScript drawing loop. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const foliage=document.createElement('canvas');foliage.width=600;foliage.height=900;
 const leaf=foliage.getContext('2d');if(!leaf)return;
 leaf.filter='blur(6px)';leaf.strokeStyle='#111';leaf.fillStyle='#111';leaf.lineCap='round';
 leaf.lineWidth=9;leaf.beginPath();leaf.moveTo(40,920);leaf.bezierCurveTo(230,650,170,320,410,-40);leaf.stroke();
 // Individually angled leaves and smaller branches make a soft organic silhouette.
 for(let i=0;i<13;i++) {
  const y=70+i*62,x=360-i*20,side=i%2?1:-1,endX=x+side*(100+(i%3)*24),endY=y-72;
  leaf.lineWidth=4;leaf.beginPath();leaf.moveTo(x,y+50);leaf.quadraticCurveTo(x+side*45,y-10,endX,endY);leaf.stroke();
  for(let j=0;j<4;j++) {
   const t=(j+1)/4,lx=x+(endX-x)*t,ly=y+50+(endY-y-50)*t;
   leaf.save();leaf.translate(lx,ly);leaf.rotate(side*(.5+j*.2));leaf.beginPath();leaf.ellipse(0,0,25+(i%3)*4,9+(j%2)*2,0,0,Math.PI*2);leaf.fill();leaf.restore();
  }
 }
 const create=async host=>{
  const source=host.querySelector(':scope > img')||host.querySelector('.hero-approved-bg,.subpage-hero-bg')||(host.matches('.mj-home-contact-photo')?host:null);if(!source)return;
  const isPhoto=source.tagName==='IMG';
  const url=isPhoto?(source.currentSrc||source.src):getComputedStyle(source).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];if(!url)return;
  const photo=new Image();photo.src=url;try{await photo.decode();}catch{return;}
  // x/y bounds in original image coordinates (top-left origin), excluding furnishings.
  const wall=url.includes('panorama')?[.10,.02,.55,.69]:url.includes('detail')?[.27,.02,.67,.46]:[.015,.02,.28,.51];
  const surface=url.includes('panorama')?'dining-wall':url.includes('detail')?'reading-wall':'left-wall';
  const layer=document.createElement('div');layer.className='quiet-light-canvas';layer.setAttribute('aria-hidden','true');
  const region=document.createElement('div');region.className='wall-shadow-region';
  const feather=document.createElement('div');feather.className='wall-shadow-feather';
  const leaves=document.createElement('div');leaves.className='wall-shadow-leaves';leaves.style.backgroundImage='url("'+foliage.toDataURL()+'")';
  feather.append(leaves);region.append(feather);layer.append(region);
  let visible=false;
  const percent=v=>v?.endsWith('%')?parseFloat(v)/100:.5;
  const layout=()=>{
   const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
   const placement=(isPhoto?getComputedStyle(source).objectPosition:getComputedStyle(source).backgroundPosition).split(' ');
   const scale=Math.max(r.width/photo.width,r.height/photo.height),ox=(r.width-photo.width*scale)*percent(placement[0]),oy=(r.height-photo.height*scale)*percent(placement[1]);
   Object.assign(region.style,{left:(ox+wall[0]*photo.width*scale)+'px',top:(oy+wall[1]*photo.height*scale)+'px',width:((wall[2]-wall[0])*photo.width*scale)+'px',height:((wall[3]-wall[1])*photo.height*scale)+'px'});
  };
  const update=()=>{
   const paused=reduced.matches||document.hidden||document.documentElement.classList.contains('light-paused');
   layer.hidden=paused;host.classList.toggle('quiet-light-ready',!paused);
   leaves.style.animationPlayState=visible&&!paused?'running':'paused';host.dataset.shadowMotion=visible&&!paused?'running':'paused';
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
