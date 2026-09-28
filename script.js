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
  /* Ogniskujemy okno, a nie krzyzyk - inaczej po otwarciu galerii
     przy krzyzyku pojawia sie ramka ogniskowania przegladarki.
     Klawiatura i tak trafia w srodek okna, wiec Tab i Esc dzialaja. */
  modal?.focus({ preventScroll: true });
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



// Realizacje — subtelne prowadzenie wzroku scrollem przy zachowaniu 3 kafli naraz.
(() => {
  const section = document.querySelector('.projects:not(.projects-scroll):not(.projects-triple-scroll):not(.home-projects-story):not(.home-projects-stack)');
  if (!section || reducedMotion) return;

  const cards = [...section.querySelectorAll('.project-card')];
  if (cards.length < 2) return;

  const desktop = window.matchMedia('(min-width: 1101px)');
  let ticking = false;
  let nearby = true;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const reset = () => {
    cards.forEach(card => {
      card.style.removeProperty('--scroll-y');
      card.style.removeProperty('--scroll-scale');
      card.style.removeProperty('--scroll-focus');
      card.classList.remove('scroll-focus');
    });
  };

  const update = () => {
    ticking = false;
    if (!desktop.matches || !nearby) {
      reset();
      return;
    }

    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const progress = clamp((vh - rect.top) / Math.max(1, vh + rect.height));
    const position = progress * (cards.length - 1);
    const travel = (progress - .5) * 2; // -1 .. 1 przez przejazd sekcji

    cards.forEach((card, index) => {
      const focus = clamp(1 - Math.abs(position - index));
      const lane = cards.length === 1 ? 0 : (index / (cards.length - 1)) * 2 - 1;
      const y = travel * lane * 12;
      const scale = .992 + focus * .012;

      card.style.setProperty('--scroll-y', `${y.toFixed(2)}px`);
      card.style.setProperty('--scroll-scale', scale.toFixed(4));
      card.style.setProperty('--scroll-focus', focus.toFixed(4));
      card.classList.toggle('scroll-focus', focus > .64);
    });
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      nearby = entries.some(entry => entry.isIntersecting);
      requestUpdate();
    }, { rootMargin: '55% 0px 55% 0px' });
    observer.observe(section);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  if (desktop.addEventListener) desktop.addEventListener('change', requestUpdate);
  requestUpdate();
})();

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

  /* Na telefonie efekty scrollowe sa wylaczone - przypinanie sekcji
     i przeliczanie na kazdej klatce potrafilo tam rozjechac uklad.
     Telefon dostaje zwykla, spokojnie przewijana strone. */
  const maly = window.matchMedia('(max-width: 780px)');
  const WLASNOSCI = ['--p', '--k1', '--k2', '--k3', '--w1', '--w2', '--w3',
                     '--s1', '--s2', '--s3', '--odslona'];
  let wyczyszczone = false;

  const wyczysc = () => {
    if (wyczyszczone) return;
    wyczyszczone = true;
    elementy.forEach(el => {
      WLASNOSCI.forEach(w => el.style.removeProperty(w));
      el.querySelectorAll('[data-kafel]').forEach(k => k.classList.remove('aktywny'));
    });
  };

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
    if (maly.matches) { wyczysc(); return; }
    wyczyszczone = false;
    const wysokosc = window.innerHeight;

    widoczne.forEach(el => {
      const r = el.getBoundingClientRect();
      const tryb = el.dataset.fx;
      let p;

      if (tryb === 'hero' || tryb === 'realizacje') {
        /* Sekcja jest wyzsza niz ekran i ma w srodku przypieta scene.
           p biegnie od 0 do 1 przez cala droge przewijania tej sekcji. */
        p = -r.top / Math.max(1, r.height - window.innerHeight);
        p = Math.min(1, Math.max(0, p));
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

      /* Przerywnik: osobna wartosc odslony - zdjecie rozsuwa sie na pelna
         szerokosc w pierwszej polowie przejscia i tak juz zostaje. */

      /* Hero: kolejne elementy tresci wchodza jeden po drugim wraz ze scrollem. */
      if (tryb === 'hero') {
        /* Wygladzenie (smoothstep): ruch startuje i konczy sie miekko,
           zamiast biec liniowo razem z kolkiem myszy. */
        const gladko = t => t * t * (3 - 2 * t);
        const krok = (od, do_) => gladko(Math.min(1, Math.max(0, (p - od) / (do_ - od))));
        el.style.setProperty('--k1', krok(0.03, 0.26).toFixed(4));
        el.style.setProperty('--k2', krok(0.14, 0.44).toFixed(4));
        el.style.setProperty('--k3', krok(0.32, 0.62).toFixed(4));
      }

      /* Realizacje: scroll przelacza kolejne kafle zamiast zjezdzac obok nich. */
      if (tryb === 'realizacje') {
        const ile = 3;
        const gladko = t => t * t * (3 - 2 * t);
        const pozycja = p * (ile - 1);            /* 0 .. ile-1 */

        /* Kafle nie przenikaja przez siebie - kazdy kolejny jest odslaniany
           od dolu nad poprzednim. Dzieki temu w kazdej chwili widac jeden
           pelny obraz, a nie dwa polprzezroczyste na raz. */
        const odslona = [];
        for (let i = 1; i <= ile; i += 1) {
          odslona[i] = i === 1 ? 1 : gladko(Math.min(1, Math.max(0, pozycja - (i - 2))));
        }

        let wierzchni = 1;
        for (let i = 1; i <= ile; i += 1) {
          el.style.setProperty(`--w${i}`, odslona[i].toFixed(4));
          /* Glebia robi samo zdjecie w stalej ramce: wjezdzajace jest jeszcze
             lekko przyblizone i osiada na 1, a przykrywane powoli dojezdza. */
          const przykryty = i < ile ? odslona[i + 1] : 0;
          const skala = 1 + (1 - odslona[i]) * 0.06 + przykryty * 0.05;
          el.style.setProperty(`--s${i}`, skala.toFixed(4));
          if (odslona[i] > 0.5) wierzchni = i;
        }

        el.querySelectorAll('[data-kafel]').forEach(k => {
          k.classList.toggle('aktywny', +k.dataset.kafel === wierzchni);
        });
      }

      if (tryb === 'przerywnik') {
        const odslona = Math.min(1, Math.max(0, (p - 0.12) / 0.33));
        el.style.setProperty('--odslona', odslona.toFixed(4));
      }
    });
  };

  const naScroll = () => {
    if (zaplanowane) return;
    zaplanowane = true;
    requestAnimationFrame(licz);
  };

  window.addEventListener('scroll', naScroll, { passive: true });
  window.addEventListener('resize', naScroll, { passive: true });
  /* Obrot telefonu albo zmiana szerokosci okna przelacza tryb w obie strony. */
  if (maly.addEventListener) maly.addEventListener('change', naScroll);
  licz();
})();

// Realizacje V3 — trzy duże kafle zostają obok siebie, a scroll podmienia
// kolejne kadry wewnątrz KAŻDEJ realizacji. Nie przesuwamy samych kart.
(() => {
  const section = document.querySelector('[data-project-scroll]');
  if (!section) return;

  const desktop = window.matchMedia('(min-width: 1101px)');
  let ticking = false;
  let nearby = true;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);
  const step = (p, from, to) => smooth(clamp((p - from) / (to - from)));

  const setShot = (number, reveal) => {
    section.style.setProperty(`--shot${number}-clip`, `${((1 - reveal) * 100).toFixed(2)}%`);
    section.style.setProperty(`--shot${number}-y`, `${((1 - reveal) * 22).toFixed(2)}px`);
    section.style.setProperty(`--shot${number}-scale`, (1.038 - reveal * .038).toFixed(4));
  };

  const reset = () => {
    section.style.setProperty('--frame-progress', '0');
    setShot(2, 0);
    setShot(3, 0);
    setShot(4, 0);
  };

  const update = () => {
    ticking = false;
    if (!desktop.matches || reducedMotion || !nearby) {
      if (!desktop.matches || reducedMotion) reset();
      return;
    }

    const rect = section.getBoundingClientRect();
    const rootStyle = getComputedStyle(document.documentElement);
    const headerH = parseFloat(rootStyle.getPropertyValue('--header-h')) || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const travel = Math.max(1, rect.height - vh);
    const p = clamp((headerH - rect.top) / travel);

    // Długie chwile spokoju między zmianami i miękkie wejścia nowych kadrów.
    const shot2 = step(p, .08, .27);
    const shot3 = step(p, .37, .56);
    const shot4 = step(p, .66, .85);

    setShot(2, shot2);
    setShot(3, shot3);
    setShot(4, shot4);
    section.style.setProperty('--frame-progress', p.toFixed(4));
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      nearby = entries.some(entry => entry.isIntersecting);
      requestUpdate();
    }, { rootMargin: '80% 0px 80% 0px' });
    observer.observe(section);
  }

  // Podgrzewamy obrazy zanim użytkownik dojedzie do sekcji, żeby wipe był płynny.
  section.querySelectorAll('.project-shot').forEach(img => {
    const preload = new Image();
    preload.src = img.currentSrc || img.src;
  });

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  if (desktop.addEventListener) desktop.addEventListener('change', requestUpdate);
  reset();
  requestUpdate();
})();


// Artykuły — fizyczny notes sterowany scrollem.
(() => {
  const notebook = document.querySelector('[data-notebook]');
  if (!notebook) return;

  const pages = [...notebook.querySelectorAll('.notebook-page')];
  const book = notebook.querySelector('.notebook-book');
  const current = notebook.querySelector('[data-notebook-current]');
  const total = notebook.querySelector('[data-notebook-total]');
  const meter = notebook.querySelector('.notebook-progress span');
  const mobile = window.matchMedia('(max-width: 760px)');

  if (!pages.length) return;

  notebook.style.setProperty('--notebook-pages', pages.length);
  if (total) total.textContent = String(pages.length).padStart(2, '0');

  pages.forEach((page, index) => {
    page.style.setProperty('--page-depth', String(index));
  });

  let ticking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);

  const resetMobile = () => {
    pages.forEach((page, index) => {
      page.classList.remove('is-past', 'is-future');
      page.classList.add('is-active');
      page.style.removeProperty('--turn');
      page.style.removeProperty('--turn-shadow');
      page.style.removeProperty('--page-lift');
      page.style.removeProperty('--page-z');
      page.style.removeProperty('z-index');
    });
    book?.classList.remove('is-turning');
    if (current) current.textContent = '01';
    notebook.style.setProperty('--book-progress', 1);
  };

  const render = () => {
    ticking = false;

    if (mobile.matches || reducedMotion) {
      resetMobile();
      return;
    }

    const rect = notebook.getBoundingClientRect();
    const distance = Math.max(1, notebook.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / distance);
    const turnCount = Math.max(1, pages.length - 1);
    const pagePosition = progress * turnCount;

    notebook.style.setProperty('--book-progress', progress.toFixed(4));

    let strongestTurn = 0;

    pages.forEach((page, index) => {
      let turn = 0;

      if (index < pages.length - 1) {
        const local = pagePosition - index;
        // Każda kartka chwilę leży płasko, potem wyraźnie przewraca się przez większość segmentu.
        turn = smooth(clamp((local - 0.12) / 0.76));
      }

      const shadow = Math.sin(Math.PI * turn);
      const lift = shadow * 34;
      strongestTurn = Math.max(strongestTurn, shadow);

      page.style.setProperty('--turn', turn.toFixed(4));
      page.style.setProperty('--turn-shadow', shadow.toFixed(4));
      page.style.setProperty('--page-lift', `${lift.toFixed(2)}px`);

      // Niezaczęte kartki leżą kolejno pod aktywną. Po przewróceniu schodzą pod cały stos.
      const z = turn >= .999
        ? index + 1
        : (pages.length - index) + 20;
      page.style.setProperty('--page-z', String(z));
      page.style.zIndex = String(z);

      page.classList.toggle('is-past', turn >= .999);
      page.classList.toggle('is-active', turn < .999 && (index === pages.length - 1 || pagePosition >= index - .5));
      page.classList.toggle('is-future', turn <= .001 && pagePosition < index);
    });

    book?.classList.toggle('is-turning', strongestTurn > .08);

    const visibleIndex = Math.min(
      pages.length - 1,
      Math.max(0, Math.floor(pagePosition + .5))
    );
    if (current) current.textContent = String(visibleIndex + 1).padStart(2, '0');
  };

  const requestRender = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  mobile.addEventListener?.('change', requestRender);
  render();
})();


// Artykuły V3 — zamknięta okładka otwiera się raz, potem zwykły scroll.
(() => {
  const opening = document.querySelector('[data-article-open]');
  if (!opening) return;

  const mobile = window.matchMedia('(max-width: 760px)');
  let ticking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);

  const render = () => {
    ticking = false;

    const rect = opening.getBoundingClientRect();
    const distance = Math.max(1, opening.offsetHeight - window.innerHeight);
    const raw = clamp(-rect.top / distance);

    // Okładka długo pozostaje zamknięta, następnie otwiera się wyraźnie
    // i pod koniec scrolla zatrzymuje się już jako otwarta.
    const open = reducedMotion ? 1 : smooth(clamp((raw - .06) / .78));
    const angle = open * -176;
    const scale = .90 + open * .10;
    const x = mobile.matches ? 0 : -25 * (1 - open);

    opening.style.setProperty('--open-progress', open.toFixed(4));
    opening.style.setProperty('--cover-angle', angle.toFixed(2) + 'deg');
    opening.style.setProperty('--book-scale', scale.toFixed(4));
    opening.style.setProperty('--book-x', x.toFixed(2) + '%');
  };

  const requestRender = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  mobile.addEventListener?.('change', requestRender);
  render();
})();


// ARTICLE BOOK V4 — całość artykułu czytana w jednej książce.
(() => {
  const reader = document.querySelector('[data-reader-book]');
  if (!reader) return;

  const spreads = [...reader.querySelectorAll('[data-reader-spread]')];
  const cover = reader.querySelector('.reader-cover');
  const current = reader.querySelector('[data-reader-current]');
  const label = reader.querySelector('[data-reader-label]');
  const mobile = window.matchMedia('(max-width: 760px)');

  if (!spreads.length) return;

  let ticking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => value * value * (3 - 2 * value);

  const setActiveSpread = index => {
    spreads.forEach((spread, i) => spread.classList.toggle('is-active', i === index));
  };

  const render = () => {
    ticking = false;

    if (mobile.matches || reducedMotion) {
      spreads.forEach(spread => spread.classList.add('is-active'));
      reader.style.setProperty('--cover-open', '1');
      reader.style.setProperty('--cover-angle', '-178deg');
      reader.style.setProperty('--book-x', '0%');
      reader.style.setProperty('--book-scale', '1');
      reader.style.setProperty('--reader-progress', '1');
      reader.style.setProperty('--turn-angle', '0deg');
      reader.style.setProperty('--turn-opacity', '0');
      if (cover) cover.style.visibility = 'hidden';
      return;
    }

    const rect = reader.getBoundingClientRect();
    const distance = Math.max(1, reader.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / distance);

    const coverProgress = smooth(clamp(progress / .22));
    const readingProgress = clamp((progress - .20) / .80);

    const coverAngle = coverProgress * -178;
    const bookX = -25 * (1 - coverProgress);
    const bookScale = .92 + coverProgress * .08;

    reader.style.setProperty('--cover-open', coverProgress.toFixed(4));
    reader.style.setProperty('--cover-angle', coverAngle.toFixed(2) + 'deg');
    reader.style.setProperty('--book-x', bookX.toFixed(2) + '%');
    reader.style.setProperty('--book-scale', bookScale.toFixed(4));
    reader.style.setProperty('--reader-progress', progress.toFixed(4));

    if (cover) {
      cover.style.visibility = coverProgress > .995 ? 'hidden' : 'visible';
    }

    if (coverProgress < .92) {
      setActiveSpread(0);
      reader.style.setProperty('--turn-angle', '0deg');
      reader.style.setProperty('--turn-opacity', '0');
      if (current) current.textContent = '00';
      if (label) label.textContent = 'Otwórz książkę';
      return;
    }

    if (label) label.textContent = 'Przewijaj strony';

    if (spreads.length === 1) {
      setActiveSpread(0);
      if (current) current.textContent = '01';
      return;
    }

    const position = readingProgress * (spreads.length - 1);
    const base = Math.min(spreads.length - 2, Math.floor(position));
    const local = clamp(position - base);
    const turn = smooth(clamp((local - .08) / .84));
    const visibleIndex = turn < .5 ? base : base + 1;

    setActiveSpread(visibleIndex);

    const sheetOpacity = Math.sin(Math.PI * turn);
    reader.style.setProperty('--turn-angle', (-178 * turn).toFixed(2) + 'deg');
    reader.style.setProperty('--turn-opacity', sheetOpacity.toFixed(4));

    if (current) current.textContent = String(visibleIndex + 1).padStart(2, '0');
  };

  const requestRender = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  mobile.addEventListener?.('change', requestRender);
  setActiveSpread(0);
  render();
})();


// ============================================================
// HOMEPAGE SCROLL STORY V5
// Jeden kadr hero + kinetyczna typografia z inercja.
// ============================================================
(() => {
  const hero = document.querySelector('[data-hero-editorial]');
  const process = document.querySelector('[data-process-story]');
  const projects = document.querySelector('[data-project-stack]');
  const about = document.querySelector('.home-about-elephant');
  const offerCards = [...document.querySelectorAll('.home-offer-card')];

  if (!hero && !process && !projects && !about && !offerCards.length) return;

  const desktop = window.matchMedia('(min-width: 1001px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = t => t * t * (3 - 2 * t);
  const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);

  let ticking = false;
  let layoutTicking = false;
  let heroTarget = 0;
  let heroCurrent = 0;
  let heroFrame = 0;
  let heroInitialized = false;

  const headerHeight = () => {
    const raw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
    return Number.isFinite(raw) ? raw : 92;
  };

  const stickyProgress = (section, stage, topOffset = 0) => {
    if (!section || !stage) return 0;
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
    return clamp((topOffset - rect.top) / travel);
  };

  const applyHero = raw => {
    if (!hero) return;

    const p = clamp(raw);
    const lineA = smoother(clamp((p - .04) / .29));
    const lineB = smoother(clamp((p - .21) / .31));
    const rule = smoother(clamp((p - .39) / .22));
    const side = smoother(clamp((p - .47) / .24));
    const bottom = smoother(clamp((p - .57) / .27));
    const kickerFade = smoother(clamp((p - .60) / .28));
    const kicker = 1 - kickerFade * .42;

    hero.style.setProperty('--hero-p', p.toFixed(5));
    hero.style.setProperty('--hero-line-a', lineA.toFixed(4));
    hero.style.setProperty('--hero-line-b', lineB.toFixed(4));
    hero.style.setProperty('--hero-rule', rule.toFixed(4));
    hero.style.setProperty('--hero-bottom', bottom.toFixed(4));
    hero.style.setProperty('--hero-side', side.toFixed(4));
    hero.style.setProperty('--hero-kicker', kicker.toFixed(4));
    hero.classList.toggle('is-ready', bottom > .74);
  };

  const animateHero = () => {
    heroFrame = 0;
    const delta = heroTarget - heroCurrent;

    if (Math.abs(delta) < .00035) {
      heroCurrent = heroTarget;
      applyHero(heroCurrent);
      return;
    }

    heroCurrent += delta * .105;
    applyHero(heroCurrent);
    heroFrame = requestAnimationFrame(animateHero);
  };

  const setHeroTarget = (p, immediate = false) => {
    heroTarget = clamp(p);

    if (immediate || reduced.matches || !desktop.matches) {
      if (heroFrame) cancelAnimationFrame(heroFrame);
      heroFrame = 0;
      heroCurrent = heroTarget;
      applyHero(heroCurrent);
      return;
    }

    if (!heroFrame) heroFrame = requestAnimationFrame(animateHero);
  };

  const layoutStories = () => {
    layoutTicking = false;
    const isDesktop = desktop.matches && !reduced.matches;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const headerH = headerHeight();

    if (hero) {
      if (isDesktop) {
        hero.style.height = Math.round(vh * 1.85) + 'px';
        hero.style.minHeight = hero.style.height;
      } else {
        hero.style.removeProperty('height');
        hero.style.removeProperty('min-height');
      }
    }

    if (process) {
      const stage = process.querySelector('.home-process-sticky');
      if (isDesktop && stage) {
        const stageH = Math.max(520, vh - headerH);
        const scrollBudget = Math.max(vh * 1.05, 820);
        process.style.height = Math.round(stageH + scrollBudget) + 'px';
        process.style.minHeight = process.style.height;
      } else {
        process.style.removeProperty('height');
        process.style.removeProperty('min-height');
      }
    }

    if (projects) {
      projects.style.removeProperty('height');
      projects.style.removeProperty('min-height');
    }

    requestRender();
  };

  const requestLayout = () => {
    if (layoutTicking) return;
    layoutTicking = true;
    requestAnimationFrame(layoutStories);
  };

  const render = () => {
    ticking = false;
    const isDesktop = desktop.matches && !reduced.matches;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const headerH = headerHeight();

    if (hero) {
      const stage = hero.querySelector('.hero-stage');
      const p = isDesktop ? stickyProgress(hero, stage, 0) : 1;
      setHeroTarget(p, !heroInitialized);
      heroInitialized = true;
    }

    if (about) {
      const r = about.getBoundingClientRect();
      const p = smooth(clamp((vh * .86 - r.top) / Math.max(1, vh * .68)));
      about.style.setProperty('--about-line', p.toFixed(4));
    }

    if (process) {
      const stage = process.querySelector('.home-process-sticky');
      const p = isDesktop ? stickyProgress(process, stage, headerH) : 1;
      process.style.setProperty('--process-p', p.toFixed(4));

      const steps = [...process.querySelectorAll('.home-process-step')];
      const position = p * Math.max(0, steps.length - 1);
      const finale = isDesktop ? smoother(clamp((p - .86) / .14)) : 1;

      steps.forEach((step, i) => {
        const distance = Math.abs(position - i);
        const local = isDesktop ? smoother(1 - clamp(distance / .92)) : 1;
        const focus = Math.max(local, finale);
        step.style.setProperty('--step-focus', focus.toFixed(4));
        step.classList.toggle('is-scroll-active', focus > .72);
      });
    }

    if (projects) {
      const cards = [...projects.querySelectorAll('.project-card')];
      const target = headerH + Math.min(72, vh * .08);

      cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const delta = Math.abs(r.top - target);
        const focus = isDesktop ? smoother(1 - clamp(delta / (vh * .72))) : 1;
        card.style.setProperty('--stack-focus', focus.toFixed(4));
      });
    }

    offerCards.forEach(card => {
      if (!isDesktop) {
        card.style.setProperty('--offer-focus', '0');
        return;
      }

      const r = card.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const distance = Math.abs(center - vh / 2);
      const focus = smooth(1 - clamp(distance / (vh * .78)));
      card.style.setProperty('--offer-focus', focus.toFixed(4));
    });
  };

  const requestRender = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  };

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestLayout, { passive: true });
  window.addEventListener('load', requestLayout, { once: true });
  desktop.addEventListener?.('change', () => {
    heroInitialized = false;
    requestLayout();
  });
  reduced.addEventListener?.('change', () => {
    heroInitialized = false;
    requestLayout();
  });

  layoutStories();
})();
