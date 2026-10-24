// Focused motion for the approved hero and the three process statements.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const heroTitle = document.querySelector('.hero-static-approved h1');
  if (heroTitle) {
    let pending = false;
    const render = () => {
      pending = false;
      const progress = Math.min(1, Math.max(0, scrollY / innerHeight));
      heroTitle.style.setProperty('--title-y', reduced.matches ? '0px' : `${-progress * 36}px`);
    };
    addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(render); } }, { passive: true });
    reduced.addEventListener('change', render);
    render();
  }
  const process = document.querySelector('.mj-process');
  if (!process || reduced.matches) return;
  const items = [...process.querySelectorAll('.mj-process-statements li')];
  const controls = process.querySelector('.mj-process-controls');
  let index = 0, timer, paused = false, visible = false, hovered = false, focused = false;
  process.classList.add('has-motion');
  controls.hidden = false;
  const show = value => {
    index = (value + items.length) % items.length;
    items.forEach((item, i) => { item.classList.toggle('is-current', i === index); item.setAttribute('aria-hidden', String(i !== index)); });
    process.querySelector('[data-process-count]').textContent = `0${index + 1} / 03`;
  };
  const sync = () => {
    clearInterval(timer);
    if (!paused && visible && !hovered && !focused && !document.hidden && !reduced.matches) timer = setInterval(() => show(index + 1), 5500);
  };
  process.querySelector('[data-process-prev]').onclick = () => { show(index - 1); sync(); };
  process.querySelector('[data-process-next]').onclick = () => { show(index + 1); sync(); };
  const pause = process.querySelector('[data-process-pause]');
  pause.onclick = () => { paused = !paused; pause.textContent = paused ? '▶' : 'Ⅱ'; pause.setAttribute('aria-label', paused ? 'Wznów zmianę tekstu' : 'Wstrzymaj zmianę tekstu'); sync(); };
  process.addEventListener('mouseenter', () => { hovered = true; sync(); });
  process.addEventListener('mouseleave', () => { hovered = false; sync(); });
  process.addEventListener('focusin', () => { focused = true; sync(); });
  process.addEventListener('focusout', event => { if (!process.contains(event.relatedTarget)) { focused = false; sync(); } });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .2 }).observe(process);
  reduced.addEventListener('change', () => {
    process.classList.toggle('has-motion', !reduced.matches);
    controls.hidden = reduced.matches;
    items.forEach((item, i) => item.setAttribute('aria-hidden', String(!reduced.matches && i !== index)));
    sync();
  });
  show(0);
})();
