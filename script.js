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


// Scroll interaction — lekka, natywna implementacja bez bibliotek i bez sztucznego blokowania scrolla.
const heroScroll = document.querySelector('.hero-scroll');
const projectScroll = document.querySelector('.projects-scroll');
const projectCardsStory = projectScroll ? [...projectScroll.querySelectorAll('.project-card')] : [];
const projectStoryCurrent = projectScroll?.querySelector('.project-story-current');
const philosophySection = document.querySelector('.philosophy');
const philosophyImage = philosophySection?.querySelector('.philosophy-media img');
const nativeStoryMode = !reducedMotion && window.matchMedia('(min-width: 961px)').matches;

const clamp01 = value => Math.min(1, Math.max(0, value));
let storyTick = false;

function sectionProgress(section) {
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const distance = Math.max(1, rect.height - window.innerHeight);
  return clamp01((-rect.top) / distance);
}

function updateHeroScrollStory() {
  if (!heroScroll || !nativeStoryMode) return;
  const p = sectionProgress(heroScroll);
  const eased = p * p * (3 - 2 * p);
  const insetY = 3.4 * (1 - eased);
  const insetX = 3.2 * (1 - eased);
  const radius = 26 * (1 - eased);
  const scale = 1.075 - eased * .045;
  const copyOpacity = .74 + eased * .26;
  const copyY = 22 * (1 - eased);
  const bgY = -18 * eased;
  const shade = .96 + eased * .04;
  heroScroll.style.setProperty('--hero-progress', String(Math.max(.01, p)));
  heroScroll.style.setProperty('--hero-inset-y', `${insetY}vh`);
  heroScroll.style.setProperty('--hero-inset-x', `${insetX}vw`);
  heroScroll.style.setProperty('--hero-radius', `${radius}px`);
  heroScroll.style.setProperty('--hero-scale', String(scale));
  heroScroll.style.setProperty('--hero-copy-opacity', String(copyOpacity));
  heroScroll.style.setProperty('--hero-copy-y', `${copyY}px`);
  heroScroll.style.setProperty('--hero-bg-y', `${bgY}px`);
  heroScroll.style.setProperty('--hero-shade-opacity', String(shade));
  heroScroll.style.setProperty('--hero-meter-opacity', String(1 - p * .8));
}

function updateProjectsStory() {
  if (!projectScroll || !projectCardsStory.length || !nativeStoryMode) return;
  const p = sectionProgress(projectScroll);
  const count = projectCardsStory.length;
  const position = Math.min(count - 0.0001, p * count);
  const active = Math.floor(position);
  const local = position - active;
  const fadeStart = .70;
  const nextMix = active < count - 1 ? clamp01((local - fadeStart) / (1 - fadeStart)) : 0;

  projectCardsStory.forEach((card, i) => {
    let opacity = 0;
    let y = 26;
    let scale = 1.065;
    if (i === active) {
      opacity = 1 - nextMix;
      y = -8 * nextMix;
      scale = 1.065 - local * .035;
    } else if (i === active + 1) {
      opacity = nextMix;
      y = 26 * (1 - nextMix);
      scale = 1.065 - nextMix * .012;
    }
    card.style.opacity = String(opacity);
    card.style.visibility = opacity > .01 ? 'visible' : 'hidden';
    card.style.pointerEvents = opacity > .55 ? 'auto' : 'none';
    card.style.transform = `translate3d(0, ${y}px, 0)`;
    card.style.setProperty('--story-scale', String(scale));
    card.style.zIndex = String(2 + i);
  });

  const displayIndex = nextMix > .55 && active < count - 1 ? active + 1 : active;
  if (projectStoryCurrent) projectStoryCurrent.textContent = String(displayIndex + 1).padStart(2, '0');
  projectScroll.style.setProperty('--story-progress', String(Math.max(.01, p)));
}

function updatePhilosophyMotion() {
  if (!philosophySection || !philosophyImage || !nativeStoryMode) return;
  const rect = philosophySection.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;
  const center = rect.top + rect.height / 2;
  const delta = (center - window.innerHeight / 2) / (window.innerHeight + rect.height);
  const y = Math.max(-24, Math.min(24, delta * -42));
  const scale = 1.035 + (1 - Math.min(1, Math.abs(delta) * 2)) * .015;
  philosophyImage.style.setProperty('--philosophy-y', `${y}px`);
  philosophyImage.style.setProperty('--philosophy-scale', String(scale));
}

function updateNativeStory() {
  updateHeroScrollStory();
  updateProjectsStory();
  updatePhilosophyMotion();
  storyTick = false;
}

if (nativeStoryMode) {
  requestAnimationFrame(updateNativeStory);
  window.addEventListener('scroll', () => {
    if (storyTick) return;
    storyTick = true;
    requestAnimationFrame(updateNativeStory);
  }, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(updateNativeStory), { passive: true });
}

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

// Parallax szerokiego przerywnika.
const parallaxEls = document.querySelectorAll('.image-break .parallax-bg');
if (!reducedMotion && window.innerWidth > 780) {
  let ticking = false;
  const parallax = () => {
    parallaxEls.forEach(el => {
      const section = el.parentElement;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.045;
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.055)`;
    });
    ticking = false;
  };
  parallax();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(parallax);
  }, { passive: true });
}

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
    if (nativeStoryMode && card.closest('.projects-scroll')) return;
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
