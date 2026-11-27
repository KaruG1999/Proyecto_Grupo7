/* ==========================================================================
   Interacciones de interfaz y animaciones
   - Header que cambia al hacer scroll + menú mobile
   - Carrusel de preventa con flechas
   - Cinta de testimonios continua
   - Animaciones con GSAP + ScrollTrigger (si cargaron y si la persona
     no pidió reducir el movimiento)
   ========================================================================== */

const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Header: fondo al scrollear y menú mobile ---------- */
function iniciarHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const actualizar = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  actualizar();
  window.addEventListener('scroll', actualizar, { passive: true });

  const toggle = header.querySelector('.menu-toggle');
  if (!toggle) return;

  const cerrarMenu = () => {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  };

  toggle.addEventListener('click', () => {
    const abierto = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(abierto));
    toggle.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });

  header.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', cerrarMenu));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && cerrarMenu());
}

/* ---------- Carrusel de preventa ---------- */
function iniciarCarrusel() {
  const track = document.querySelector('.carousel-track');
  const anterior = document.querySelector('.carousel-btn.left');
  const siguiente = document.querySelector('.carousel-btn.right');
  if (!track || !anterior || !siguiente) return;

  const paso = () => {
    const card = track.querySelector('.product-card');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  const actualizarBotones = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    anterior.disabled = track.scrollLeft <= 2;
    siguiente.disabled = track.scrollLeft >= max;
  };

  anterior.addEventListener('click', () => track.scrollBy({ left: -paso(), behavior: 'smooth' }));
  siguiente.addEventListener('click', () => track.scrollBy({ left: paso(), behavior: 'smooth' }));
  track.addEventListener('scroll', actualizarBotones, { passive: true });
  window.addEventListener('resize', actualizarBotones);
  actualizarBotones();
}

/* ---------- Cinta de testimonios: duplica las cards para un loop sin cortes ---------- */
function iniciarCintas() {
  document.querySelectorAll('.slider-container, .marquee-track').forEach((cinta) => {
    [...cinta.children].forEach((item) => {
      const copia = item.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      copia.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
      cinta.appendChild(copia);
    });
  });
}

/* ---------- Animaciones con GSAP ---------- */
function iniciarAnimaciones() {
  if (prefiereMenosMovimiento || !window.gsap || !window.ScrollTrigger) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // La entrada del hero es CSS puro (style.css) para que no espere a que
  // descargue GSAP. Acá solo queda el movimiento ligado al scroll.
  // En desktop el hero es un collage; en mobile, una foto fija de fondo
  const esDesktop = window.matchMedia('(min-width: 960px)').matches;

  // Parallax: imágenes que se mueven más lento que la página.
  // En mobile la foto del hero queda fija de fondo, así que no se mueve.
  gsap.utils.toArray('[data-parallax]').forEach((img) => {
    if (!esDesktop && img.closest('.hero')) return;
    const distancia = Number(img.dataset.parallax) || -10;
    gsap.fromTo(
      img,
      { yPercent: 0 },
      {
        yPercent: distancia,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });

  // Elementos flotantes del hero que se desplazan a distinta velocidad
  gsap.utils.toArray(esDesktop ? '[data-parallax-el]' : []).forEach((el) => {
    // yPercent para no chocar con la "y" que usa la entrada del hero
    gsap.to(el, {
      yPercent: Number(el.dataset.parallaxEl) || -20,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  // Aparición escalonada de bloques al entrar en pantalla
  const bloques = gsap.utils.toArray('[data-reveal]');
  gsap.set(bloques, { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch(bloques, {
    start: 'top 88%',
    once: true,
    onEnter: (lote) =>
      gsap.to(lote, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });

  // Recalcula posiciones cuando terminan de cargar imágenes y fuentes,
  // y cuando script.js filtra, ordena o agrega contenido
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.addEventListener('contenido-actualizado', () => ScrollTrigger.refresh());
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarHeader();
  iniciarCarrusel();
  iniciarCintas();
  iniciarAnimaciones();
});
