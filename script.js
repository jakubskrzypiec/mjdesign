const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const progressBar = document.querySelector('.scroll-progress');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const isOpen = body.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

document.querySelectorAll('.site-nav a').forEach(link => {
  link.addEventListener('click', () => {
    body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('scroll', () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${percent}%`;
});

const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
reveals.forEach(el => io.observe(el));

const hoverLiftTargets = document.querySelectorAll('.hover-lift');
hoverLiftTargets.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(max-width: 860px)').matches) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 4;
    const rotateX = (0.5 - y) * 4;
    card.style.transform = `translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

const tiltTargets = document.querySelectorAll('.tilt-card');
tiltTargets.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(max-width: 860px)').matches) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 10;
    const base = card.classList.contains('social-card--front') ? -7 : 6;
    card.style.transform = `rotate(${base}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

const magneticButtons = document.querySelectorAll('.magnetic');
magneticButtons.forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(max-width: 860px)').matches) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

const parallaxCard = document.querySelector('.parallax-card');
if (parallaxCard) {
  window.addEventListener('mousemove', (e) => {
    if (window.matchMedia('(max-width: 860px)').matches) return;
    const depth = Number(parallaxCard.dataset.depth || 18);
    const x = (e.clientX / window.innerWidth - 0.5) * depth;
    const y = (e.clientY / window.innerHeight - 0.5) * depth;
    parallaxCard.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
}

const galleries = {
  'project-1': [
    { src: 'assets/images/proj1-1.jpg', alt: 'Projekt 1, ujęcie 1', caption: 'Saska Kępa · ujęcie 01' },
    { src: 'assets/images/proj1-2.jpg', alt: 'Projekt 1, ujęcie 2', caption: 'Saska Kępa · ujęcie 02' },
    { src: 'assets/images/proj1-3.jpg', alt: 'Projekt 1, ujęcie 3', caption: 'Saska Kępa · ujęcie 03' },
    { src: 'assets/images/proj1-4.jpg', alt: 'Projekt 1, ujęcie 4', caption: 'Saska Kępa · ujęcie 04' }
  ],
  'project-2': [
    { src: 'assets/images/proj2-1.jpg', alt: 'Projekt 2, ujęcie 1', caption: 'Wilanów · ujęcie 01' },
    { src: 'assets/images/proj2-2.jpg', alt: 'Projekt 2, ujęcie 2', caption: 'Wilanów · ujęcie 02' },
    { src: 'assets/images/proj2-3.jpg', alt: 'Projekt 2, ujęcie 3', caption: 'Wilanów · ujęcie 03' },
    { src: 'assets/images/proj2-4.jpg', alt: 'Projekt 2, ujęcie 4', caption: 'Wilanów · ujęcie 04' }
  ],
  'project-3': [
    { src: 'assets/images/proj3-1.jpg', alt: 'Projekt 3, ujęcie 1', caption: 'Apartament Ochota · ujęcie 01' },
    { src: 'assets/images/proj3-2.jpg', alt: 'Projekt 3, ujęcie 2', caption: 'Apartament Ochota · ujęcie 02' },
    { src: 'assets/images/proj3-3.jpg', alt: 'Projekt 3, ujęcie 3', caption: 'Apartament Ochota · ujęcie 03' },
    { src: 'assets/images/proj3-4.jpg', alt: 'Projekt 3, ujęcie 4', caption: 'Apartament Ochota · ujęcie 04' }
  ]
};

const lightbox = document.querySelector('.lightbox');
const lightboxImage = document.querySelector('.lightbox__image');
const lightboxCaption = document.querySelector('.lightbox__caption');
const lightboxThumbs = document.querySelector('.lightbox__thumbs');
const closeBtn = document.querySelector('.lightbox__close');
const prevBtn = document.querySelector('.lightbox__nav--prev');
const nextBtn = document.querySelector('.lightbox__nav--next');
let activeGalleryKey = null;
let activeIndex = 0;

function renderLightboxImage() {
  const items = galleries[activeGalleryKey];
  if (!items || !items[activeIndex]) return;
  const item = items[activeIndex];
  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  lightboxCaption.textContent = item.caption;

  [...lightboxThumbs.children].forEach((thumb, i) => {
    thumb.classList.toggle('active', i === activeIndex);
  });
  const activeThumb = lightboxThumbs.children[activeIndex];
  activeThumb?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function openLightbox(key) {
  activeGalleryKey = key;
  activeIndex = 0;
  lightboxThumbs.innerHTML = '';

  galleries[key].forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Otwórz miniaturę ${index + 1}`);
    btn.innerHTML = `<img src="${item.src}" alt="${item.alt}" />`;
    btn.addEventListener('click', () => {
      activeIndex = index;
      renderLightboxImage();
    });
    lightboxThumbs.appendChild(btn);
  });

  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  body.classList.add('lightbox-open');
  renderLightboxImage();
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  body.classList.remove('lightbox-open');
  lightboxImage.src = '';
}

function changeSlide(direction) {
  const items = galleries[activeGalleryKey];
  if (!items) return;
  activeIndex = (activeIndex + direction + items.length) % items.length;
  renderLightboxImage();
}

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => openLightbox(card.dataset.gallery));
});

closeBtn?.addEventListener('click', closeLightbox);
prevBtn?.addEventListener('click', () => changeSlide(-1));
nextBtn?.addEventListener('click', () => changeSlide(1));
lightbox?.addEventListener('click', (e) => {
  const target = e.target;
  if (target instanceof HTMLElement && target.dataset.close === 'true') {
    closeLightbox();
  }
});

document.addEventListener('keydown', (e) => {
  if (!lightbox?.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') changeSlide(-1);
  if (e.key === 'ArrowRight') changeSlide(1);
});

lightboxThumbs?.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault();
    lightboxThumbs.scrollLeft += e.deltaY;
  }
}, { passive: false });
