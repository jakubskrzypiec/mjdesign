/* One centered principle at a time, with no shift in the shared band geometry. */
(() => {
 const host=document.querySelector('.home-principles');if(!host)return;
 const items=[...host.querySelectorAll('.home-principles-item')];
 const button=host.querySelector('.home-principles-pause');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,timer=0,paused=false,visible=false;
 const show=next=>{
  items.forEach(item=>item.classList.remove('is-leaving'));
  const old=items[index];old.classList.remove('is-current');old.classList.add('is-leaving');old.setAttribute('aria-hidden','true');
  index=(next+items.length)%items.length;
  items[index].classList.remove('is-leaving');items[index].classList.add('is-current');items[index].removeAttribute('aria-hidden');
 };
 const sync=()=>{clearInterval(timer);button.hidden=reduced.matches;button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',paused?'Wznów zmianę tekstu':'Wstrzymaj zmianę tekstu');button.querySelector('span').textContent=paused?'▶':'Ⅱ';if(visible&&!document.hidden&&!paused&&!reduced.matches)timer=setInterval(()=>show(index+1),5000);};
 button.addEventListener('click',()=>{paused=!paused;sync();});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.3}).observe(host);
 sync();
})();
