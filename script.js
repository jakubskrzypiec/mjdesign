const header = document.getElementById('header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelectorAll('.main-nav a');
const body = document.body;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// Stabilny start po załadowaniu fontów — ogranicza przeskoki typografii.
Promise.race([
  document.fonts?.ready || Promise.resolve(),
  new Promise(resolve => setTimeout(resolve, 900))
]).then(() => requestAnimationFrame(() => body.classList.add('page-loaded')));

function setHeaderState() {
  header?.classList.toggle('scrolled', window.scrollY > 30);
}
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  body.classList.toggle('menu-active', open);
});

navLinks.forEach(link => link.addEventListener('click', () => {
  header?.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Otwórz menu');
  body.classList.remove('menu-active');
}));

// Pasek postępu.
const progressBar = document.querySelector('.scroll-progress span');
let scrollTick = false;
function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  progressBar?.style.setProperty('--progress', progress);
  scrollTick = false;
}
window.addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(updateScrollProgress);
}, { passive: true });
updateScrollProgress();

// Reveal przy scrollu.
const revealEls = [...document.querySelectorAll('.reveal')];
revealEls.forEach((el, i) => el.style.setProperty('--reveal-order', i % 4));
if (!reducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

// Parallax przerywnika przejal silnik data-fx nizej (jeden mechanizm zamiast dwoch,
// inaczej styl inline nadpisywalby reguly z CSS).

// Hero pozostaje statyczne względem kursora.

// Galerie — lokalne pliki, bez zależności od zewnętrznych serwerów.
const galleries = {
  1: {
    title: 'Elegancja',
    images: ['elegancja-1.webp', 'elegancja-2.webp', 'elegancja-3.webp', 'elegancja-4.webp']
  },
  2: {
    title: 'Koncept',
    images: ['koncept-1.webp', 'koncept-2.webp', 'koncept-3.webp']
  },
  3: {
    title: 'Nowoczesny',
    images: ['nowoczesny-1.webp', 'nowoczesny-2.webp', 'nowoczesny-3.webp', 'nowoczesny-4.webp']
  }
};

const modal = document.getElementById('galleryModal');
const galleryImage = document.getElementById('galleryImage');
const galleryCurrent = document.getElementById('galleryCurrent');
const galleryTotal = document.getElementById('galleryTotal');
const galleryCaption = document.getElementById('galleryCaption');
const galleryThumbs = document.getElementById('galleryThumbs');
const closeBtn = document.querySelector('.gallery-close');
const prevBtn = document.querySelector('.gallery-prev');
const nextBtn = document.querySelector('.gallery-next');
let activeGallery = 1;
let activeIndex = 0;
let lastTrigger = null;
let galleryTouchStart = 0;

function getActiveImages() {
  return galleries[activeGallery]?.images || [];
}

function preloadAround() {
  const images = getActiveImages();
  if (!images.length) return;
  [-1, 1].forEach(direction => {
    const index = (activeIndex + direction + images.length) % images.length;
    const preload = new Image();
    preload.src = images[index];
  });
}

function renderThumbs() {
  if (!galleryThumbs) return;
  galleryThumbs.innerHTML = '';
  getActiveImages().forEach((src, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = index === activeIndex ? 'active' : '';
    button.setAttribute('aria-label', `Pokaż zdjęcie ${index + 1}`);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    button.appendChild(img);
    button.addEventListener('click', () => {
      activeIndex = index;
      updateGallery(true);
    });
    galleryThumbs.appendChild(button);
  });
}

function updateGallery(animate = false) {
  const gallery = galleries[activeGallery];
  const images = gallery?.images || [];
  const src = images[activeIndex];
  if (!src || !galleryImage) return;

  if (animate && !reducedMotion) galleryImage.classList.add('is-changing');
  const swap = () => {
    galleryImage.src = src;
    galleryImage.alt = `${gallery.title} — ujęcie ${activeIndex + 1}`;
    galleryCurrent.textContent = String(activeIndex + 1).padStart(2, '0');
    galleryTotal.textContent = String(images.length).padStart(2, '0');
    galleryCaption.textContent = `${gallery.title} · ujęcie ${String(activeIndex + 1).padStart(2, '0')}`;
    [...galleryThumbs.children].forEach((el, i) => el.classList.toggle('active', i === activeIndex));
    galleryThumbs.children[activeIndex]?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest'
    });
    preloadAround();
  };

  if (animate && !reducedMotion) setTimeout(swap, 100);
  else swap();
}

galleryImage?.addEventListener('load', () => galleryImage.classList.remove('is-changing'));

function openGallery(number, trigger) {
  activeGallery = Number(number);
  activeIndex = 0;
  lastTrigger = trigger;
  renderThumbs();
  updateGallery(false);
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
  body.classList.add('gallery-open');
  closeBtn?.focus({ preventScroll: true });
}

function closeGallery() {
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
  body.classList.remove('gallery-open');
  lastTrigger?.focus({ preventScroll: true });
}

function moveGallery(direction) {
  const images = getActiveImages();
  if (!images.length) return;
  activeIndex = (activeIndex + direction + images.length) % images.length;
  updateGallery(true);
}

document.querySelectorAll('[data-gallery]').forEach(button => {
  button.addEventListener('click', () => openGallery(button.dataset.gallery, button));
});
closeBtn?.addEventListener('click', closeGallery);
prevBtn?.addEventListener('click', () => moveGallery(-1));
nextBtn?.addEventListener('click', () => moveGallery(1));
modal?.addEventListener('click', event => {
  if (event.target === modal) closeGallery();
});
modal?.addEventListener('touchstart', event => {
  galleryTouchStart = event.changedTouches[0]?.clientX || 0;
}, { passive: true });
modal?.addEventListener('touchend', event => {
  const end = event.changedTouches[0]?.clientX || 0;
  const delta = end - galleryTouchStart;
  if (Math.abs(delta) > 55) moveGallery(delta > 0 ? -1 : 1);
}, { passive: true });

galleryThumbs?.addEventListener('wheel', event => {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  galleryThumbs.scrollLeft += event.deltaY;
}, { passive: false });

document.addEventListener('keydown', event => {
  if (!modal?.classList.contains('open')) return;
  if (event.key === 'Escape') closeGallery();
  if (event.key === 'ArrowLeft') moveGallery(-1);
  if (event.key === 'ArrowRight') moveGallery(1);
});

// Premium micro-interactions — subtelny tilt kart na desktopie.
if (finePointer && !reducedMotion) {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - .5;
      const py = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--tilt-y', `${px * 3.2}deg`);
      card.style.setProperty('--tilt-x', `${py * -2.4}deg`);
      card.style.setProperty('--spot-x', `${(px + .5) * 100}%`);
      card.style.setProperty('--spot-y', `${(py + .5) * 100}%`);
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });
}

// FAQ — jedna odpowiedź naraz.
const details = [...document.querySelectorAll('.faq details')];
details.forEach(item => item.addEventListener('toggle', () => {
  if (!item.open) return;
  details.forEach(other => { if (other !== item) other.open = false; });
}));

// Rok w stopce.
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Aktywna sekcja w nawigacji.
const sectionLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')]
  .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter(item => item.section);

if ('IntersectionObserver' in window) {
  const activeSectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach(({ link, section }) => {
      link.classList.toggle('is-active', section === visible.target);
    });
  }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, .15, .35, .6] });

  sectionLinks.forEach(({ section }) => activeSectionObserver.observe(section));
}

/* ============================================================
   INTERAKTYWNOŚĆ STEROWANA SCROLLEM
   Każdy element z atrybutem data-fx dostaje własność --p o wartości
   od 0 do 1, opisującą, jak daleko przesunął się przez ekran.
   Cała reszta dzieje się w CSS na transformach i przezroczystości,
   więc nie rusza układu strony i nie zmusza przeglądarki do przeliczeń.
   ============================================================ */
(() => {
  if (reducedMotion) return;

  const elementy = [...document.querySelectorAll('[data-fx]')];
  if (!elementy.length) return;

  let widoczne = [];
  let zaplanowane = false;

  /* Obserwator trzyma listę elementów faktycznie będących na ekranie,
     żeby przy przewijaniu liczyć tylko je, a nie wszystkie. */
  const obserwator = new IntersectionObserver(wpisy => {
    wpisy.forEach(w => {
      const el = w.target;
      if (w.isIntersecting) { if (!widoczne.includes(el)) widoczne.push(el); }
      else widoczne = widoczne.filter(x => x !== el);
    });
    licz();
  }, { rootMargin: '15% 0px 15% 0px' });

  elementy.forEach(el => obserwator.observe(el));

  const licz = () => {
    zaplanowane = false;
    const wysokosc = window.innerHeight;

    widoczne.forEach(el => {
      const r = el.getBoundingClientRect();
      const tryb = el.dataset.fx;
      let p;

      if (tryb === 'hero') {
        /* 0 na samej górze, 1 gdy hero wyjedzie z ekranu */
        p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      } else if (tryb === 'kadr') {
        /* Zdjęcie dochodzi do naturalnej skali mniej więcej na środku ekranu,
           a nie dopiero przy wyjeździe górą. */
        p = (wysokosc - r.top) / Math.max(1, wysokosc * 0.75);
        p = Math.min(1, Math.max(0, p));
      } else {
        /* 0 gdy element dopiero wchodzi od dołu, 1 gdy wychodzi górą */
        p = (wysokosc - r.top) / Math.max(1, wysokosc + r.height);
        p = Math.min(1, Math.max(0, p));
      }

      el.style.setProperty('--p', p.toFixed(4));
    });
  };

  const naScroll = () => {
    if (zaplanowane) return;
    zaplanowane = true;
    requestAnimationFrame(licz);
  };

  window.addEventListener('scroll', naScroll, { passive: true });
  window.addEventListener('resize', naScroll, { passive: true });
  licz();
})();
