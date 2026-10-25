/* Moving foliage shadows on calibrated wall surfaces. The photograph itself stays fixed.
   Canvas 2D also works when hardware WebGL is unavailable. */
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
  const canvas=document.createElement('canvas');canvas.className='quiet-light-canvas';canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const patch=document.createElement('canvas'),paint=patch.getContext('2d');if(!paint)return;
  let frame=0,visible=false,last=0,seconds=0,drawn=0;
  const percent=v=>v?.endsWith('%')?parseFloat(v)/100:.5;
  const render=()=>{
   const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
   const dpr=Math.min(devicePixelRatio,1.5),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   ctx.clearRect(0,0,w,h);
   const placement=(isPhoto?getComputedStyle(source).objectPosition:getComputedStyle(source).backgroundPosition).split(' ');
   const scale=Math.max(w/photo.width,h/photo.height),ox=(w-photo.width*scale)*percent(placement[0]),oy=(h-photo.height*scale)*percent(placement[1]);
   const x=ox+wall[0]*photo.width*scale,y=oy+wall[1]*photo.height*scale;
   const pw=Math.round((wall[2]-wall[0])*photo.width*scale),ph=Math.round((wall[3]-wall[1])*photo.height*scale);
   if(x>=w||x+pw<=0||y>=h||y+ph<=0)return;
   if(patch.width!==pw||patch.height!==ph){patch.width=pw;patch.height=ph;}
   paint.clearRect(0,0,pw,ph);paint.globalCompositeOperation='source-over';paint.globalAlpha=.22;
   const sway=Math.sin(seconds*.55),breathe=Math.sin(seconds*.37);
   paint.save();paint.translate(pw*.5+sway*pw*.095,ph*.5+breathe*ph*.018);paint.rotate(Math.sin(seconds*.44)*.025);
   paint.drawImage(foliage,-pw*.65,-ph*.65,pw*1.3,ph*1.3);paint.restore();
   paint.globalAlpha=1;paint.globalCompositeOperation='destination-in';
   const horizontal=paint.createLinearGradient(0,0,pw,0);horizontal.addColorStop(0,'transparent');horizontal.addColorStop(.08,'#000');horizontal.addColorStop(.9,'#000');horizontal.addColorStop(1,'transparent');paint.fillStyle=horizontal;paint.fillRect(0,0,pw,ph);
   const vertical=paint.createLinearGradient(0,0,0,ph);vertical.addColorStop(0,'transparent');vertical.addColorStop(.06,'#000');vertical.addColorStop(.88,'#000');vertical.addColorStop(1,'transparent');paint.fillStyle=vertical;paint.fillRect(0,0,pw,ph);
   ctx.drawImage(patch,x,y);
  };
  const tick=now=>{if(last)seconds+=(now-last)/1000;last=now;if(now-drawn>=40){render();drawn=now;}frame=requestAnimationFrame(tick);};
  const update=()=>{
   cancelAnimationFrame(frame);last=0;const paused=reduced.matches||document.hidden||document.documentElement.classList.contains('light-paused');
   canvas.hidden=paused;host.classList.toggle('quiet-light-ready',!paused);
   if(visible&&!paused){render();frame=requestAnimationFrame(tick);}
  };
  host.append(canvas);host.dataset.shadowSurface=surface;
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{rootMargin:'40px 0px'}).observe(host);
  new ResizeObserver(()=>{if(visible&&!canvas.hidden)render();}).observe(host);
  new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 };
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);create(entry.target);}});},{rootMargin:'200px 0px'});
 document.querySelectorAll('.light-break:not(.light-break--editorial),.light-scene--hero,.subpage-hero,.mj-workflow-image,.mj-home-contact-photo').forEach(host=>observer.observe(host));
})();
