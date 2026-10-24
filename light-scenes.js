// Light motion runs only while its scene is visible and the page is active.
(() => {
 const scenes=[...document.querySelectorAll('.light-scene')];
 if(!scenes.length)return;
 const root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const buttons=[...document.querySelectorAll('.light-motion-toggle')];
 let paused=false;
 const sync=()=>{
  root.classList.toggle('light-paused',paused||reduced.matches);
  root.classList.toggle('light-document-hidden',document.hidden);
  buttons.forEach(button=>{
   button.setAttribute('aria-pressed',String(paused));
   const label=paused?'Wznów ruch światła':'Wstrzymaj ruch światła';
   button.setAttribute('aria-label',label);
   button.title=label;
   button.querySelector('span').textContent=paused?'▶':'Ⅱ';
  });
 };
 buttons.forEach(button=>button.addEventListener('click',()=>{paused=!paused;sync();}));
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>entry.target.classList.toggle('light-visible',entry.isIntersecting));
 },{rootMargin:'40px 0px',threshold:0});
 scenes.forEach(scene=>observer.observe(scene));
 document.addEventListener('visibilitychange',sync);
 reduced.addEventListener('change',sync);
 sync();
})();
