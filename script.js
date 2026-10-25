'use strict';

const phone = '34649345032';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const query = new URLSearchParams(window.location.search);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const localDate = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const today = localDate(new Date());
const formatDate = value => new Date(value + 'T12:00:00').toLocaleDateString('es-ES', {day:'numeric',month:'long',year:'numeric'});
const whatsappURL = message => 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
function openWhatsApp(message) {
  window.open(whatsappURL(message), '_blank', 'noopener,noreferrer');
}

// Shared navigation works on every page, including pages without a hero or form.
const menu = $('.menu-toggle');
const nav = $('#main-nav');
function closeMenu() {
  if (!menu || !nav) return;
  menu.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => {
  if (nav?.classList.contains('is-open') && !event.target.closest('.site-header')) closeMenu();
});
window.addEventListener('resize', () => { if (innerWidth > 800) closeMenu(); });
$$('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
$$('[data-wa]').forEach(link => {
  link.href = whatsappURL(link.dataset.wa);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});

// Dates use the visitor's local day. Never claim live availability.
function setDateBounds(form) {
  const arrival = $('[name="llegada"]', form);
  const departure = $('[name="salida"]', form);
  if (!arrival || !departure) return;
  arrival.min = today;
  departure.min = today;
  const refresh = () => {
    departure.setCustomValidity('');
    arrival.setCustomValidity('');
    if (arrival.value) {
      const next = new Date(arrival.value + 'T12:00:00');
      next.setDate(next.getDate() + 1);
      departure.min = localDate(next);
    } else departure.min = today;
  };
  arrival.addEventListener('input', refresh);
  departure.addEventListener('input', refresh);
  refresh();
}
function validDates(form) {
  const arrival = $('[name="llegada"]', form);
  const departure = $('[name="salida"]', form);
  if (!arrival || !departure) return true;
  arrival.setCustomValidity('');
  departure.setCustomValidity('');
  if (arrival.value && !departure.value) departure.setCustomValidity('Indica la fecha de salida.');
  if (departure.value && !arrival.value) arrival.setCustomValidity('Indica la fecha de llegada.');
  if (arrival.value && departure.value && departure.value <= arrival.value) departure.setCustomValidity('La salida debe ser posterior a la llegada.');
  return form.reportValidity();
}
function populateSearchFields(form) {
  ['zona', 'personas', 'llegada', 'salida'].forEach(name => {
    const field = $('[name="' + name + '"]', form);
    const value = query.get(name);
    if (!field || value === null) return;
    if (field.tagName === 'SELECT' && ![...field.options].some(option => option.value === value)) return;
    if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today)) return;
    field.value = value;
  });
}
$$('form').forEach(form => {
  if ($('[name="llegada"]', form)) {
    populateSearchFields(form);
    setDateBounds(form);
  }
});

// Catalog: explicit destination and capacity filters; dates remain a consultation.
const catalogForm = $('#catalog-search');
if (catalogForm) {
  const cards = $$('.property-card', $('#property-results'));
  const helpCard = $('.catalog-help');
  function updateCatalog(changeURL = true) {
    const fields = new FormData(catalogForm);
    const zone = fields.get('zona') || '';
    const guests = Number(fields.get('personas')) || 0;
    let count = 0;
    cards.forEach(card => {
      const visible = (!zone || card.dataset.zone === zone) && Number(card.dataset.capacity) >= guests;
      card.hidden = !visible;
      if (visible) count++;
    });
    $('#result-count').textContent = count + (count === 1 ? ' alojamiento' : ' alojamientos');
    $('#empty-results').hidden = count !== 0;
    if (helpCard) helpCard.hidden = count === 0;
    $$('[data-zone-filter]').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.zoneFilter === zone)));
    const search = new URLSearchParams();
    for (const [name, value] of fields) if (value) search.set(name, value);
    $$('.property-link').forEach(link => {
      const url = new URL(link.href);
      url.search = search.toString();
      link.href = url.pathname + url.search + url.hash;
    });
    if (changeURL) history.replaceState(null, '', location.pathname + (search.size ? '?' + search.toString() : ''));
    const arrival = fields.get('llegada');
    const departure = fields.get('salida');
    $('#date-help').textContent = arrival && departure
      ? 'Tu consulta: del ' + formatDate(arrival) + ' al ' + formatDate(departure) + '. La disponibilidad se confirma con Hernán.'
      : 'Elige el alojamiento que encaje contigo y consulta tus fechas.';
  }
  catalogForm.addEventListener('submit', event => { event.preventDefault(); if (validDates(catalogForm)) updateCatalog(); });
  $$('[data-zone-filter]').forEach(tab => tab.addEventListener('click', () => {
    $('[name="zona"]', catalogForm).value = tab.dataset.zoneFilter;
    updateCatalog();
  }));
  ['zona','personas'].forEach(name => $('[name="' + name + '"]', catalogForm).addEventListener('change', () => updateCatalog()));
  $('#clear-filters')?.addEventListener('click', () => {
    catalogForm.reset();
    $$('input', catalogForm).forEach(input => input.setCustomValidity(''));
    $('[name="salida"]', catalogForm).min = today;
    updateCatalog();
  });
  updateCatalog(false);
}

// Property inquiries carry the selected dates and explicitly identify example listings.
$$('[data-inquiry]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validDates(form)) return;
    const fields = new FormData(form);
    const property = form.dataset.property;
    const introduction = form.dataset.sample === 'true'
      ? 'Hola Hernán, he visto la ficha de ejemplo «' + property + '» y busco una estancia similar.'
      : 'Hola Hernán, buscamos alojamiento.';
    const message = introduction + '\nDel ' + formatDate(fields.get('llegada')) + ' al ' + formatDate(fields.get('salida')) + ', para ' + fields.get('personas') + ' personas.\n¿Qué alojamientos reales tenéis disponibles y cuál sería el precio?';
    openWhatsApp(message);
  });
});
const backLink = $('.property-back');
if (backLink && query.size) backLink.href = 'alojamientos.html?' + query.toString();
if (!catalogForm && query.size) {
  $$('.property-link').forEach(link => { const url = new URL(link.href); url.search = query.toString(); link.href = url.pathname + url.search + url.hash; });
}

// Contact form opens an editable WhatsApp draft. Nothing is sent by this page.
const contactForm = $('#contact-form');
if (contactForm) {
  const topic = query.get('interes');
  if (topic && topic.length < 120) {
    const select = $('[name="interes"]', contactForm);
    if (![...select.options].some(option => option.value === topic)) {
      const option = document.createElement('option'); option.value = topic; option.textContent = topic; select.append(option);
    }
    select.value = topic;
  }
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const fields = new FormData(contactForm);
    const name = String(fields.get('nombre')).trim();
    const note = String(fields.get('mensaje')).trim();
    if (!name || !note) return;
    openWhatsApp('Hola Hernán, soy ' + name + '.\nMe interesa: ' + fields.get('interes') + '.\nZona: ' + fields.get('zona') + '.\n\n' + note);
  });
}

// Accessible photo gallery with native dialog focus containment and keyboard controls.
const lightbox = $('.lightbox');
if (lightbox) {
  const tiles = $$('[data-gallery-index]');
  let photoIndex = 0;
  let previousFocus;
  const photo = $('figure img', lightbox);
  const caption = $('figcaption', lightbox);
  function renderPhoto() {
    const source = $('img', tiles[photoIndex]);
    photo.src = source.getAttribute('src');
    photo.alt = source.alt;
    caption.textContent = (photoIndex + 1) + ' / ' + tiles.length + ' — ' + source.alt;
  }
  function movePhoto(direction) {
    photoIndex = (photoIndex + direction + tiles.length) % tiles.length;
    renderPhoto();
  }
  tiles.forEach((tile, index) => tile.addEventListener('click', () => {
    photoIndex = index;
    previousFocus = document.activeElement;
    renderPhoto();
    lightbox.showModal();
    document.body.classList.add('dialog-open');
    $('.lightbox-close', lightbox).focus();
  }));
  $('.lightbox-close', lightbox).addEventListener('click', () => lightbox.close());
  $('.lightbox-prev', lightbox).addEventListener('click', () => movePhoto(-1));
  $('.lightbox-next', lightbox).addEventListener('click', () => movePhoto(1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); movePhoto(1); }
  });
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('close', () => { document.body.classList.remove('dialog-open'); previousFocus?.focus(); });
}

// Reveal never controls image loading or the default visibility of content.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('reveal-in'); observer.unobserve(entry.target); }
  }), {threshold:0.1});
  $$('[data-reveal]').forEach(element => observer.observe(element));
}

// Seven chapters share the same scroll timing; each retains its own photograph and destination.
const cinema = $('.cinema');
if (cinema) {
  const scenes = $$('.scene', cinema), copies = $$('.scene-copy', cinema);
  const photos = $$('.scene img', cinema), dots = $$('[data-scene]', cinema);
  const caption = $('[data-scene-caption]', cinema), stage = $('.stage', cinema);
  const smoothstep = (a,b,v) => { const t = clamp((v-a)/(b-a)); return t*t*(3-2*t); };
  let progress = 0, pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  let rafPending = false, initialized = false;
  function updateCinema() {
    rafPending = false;
    const distance = Math.max(1, cinema.offsetHeight - stage.offsetHeight);
    const target = reducedMotion.matches ? 0 : clamp(-cinema.getBoundingClientRect().top / distance);
    if (!initialized || reducedMotion.matches) { progress = target; initialized = true; }
    progress += (target-progress)*0.13;
    pointerX += (targetX-pointerX)*0.1; pointerY += (targetY-pointerY)*0.1;
    const phase = progress*(scenes.length-1);
    const active = Math.min(scenes.length-1, Math.round(phase));
    scenes.forEach((scene,index) => {
      // A readable pause around each chapter, followed by a short crossfade.
      const enter = index === 0 ? 1 : smoothstep(index-0.7,index-0.3,phase);
      const exit = index === scenes.length-1 ? 0 : smoothstep(index+0.3,index+0.7,phase);
      const visibility = enter*(1-exit);
      scene.style.opacity = visibility;
      const textEnter = index === 0 ? 1 : smoothstep(index-0.48,index-0.25,phase);
      const textExit = index === scenes.length-1 ? 0 : smoothstep(index+0.25,index+0.48,phase);
      const textOpacity = textEnter*(1-textExit);
      const copy = copies[index];
      copy.style.opacity = textOpacity;
      copy.style.transform = reducedMotion.matches ? 'none' : 'translateY(' + ((1-textEnter)*24-textExit*24) + 'px)';
      copy.inert = textOpacity < 0.65;
      copy.style.pointerEvents = textOpacity >= 0.65 ? 'auto' : 'none';
      // Desktop retains the complete image. Only mobile gets a very small overscan.
      photos[index].style.transform = reducedMotion.matches || innerWidth >= 1000 ? 'none' : 'translate3d('+(pointerX*8)+'px,'+(pointerY*6)+'px,0) scale(1.03)';
    });
    dots.forEach((dot,index) => dot.setAttribute('aria-pressed',String(active===index)));
    caption.textContent = String(active+1).padStart(2,'0')+' / '+dots[active].dataset.caption;
    if (!reducedMotion.matches && (Math.abs(target-progress)>0.0001 || Math.abs(targetX-pointerX)>0.001 || Math.abs(targetY-pointerY)>0.001)) requestTick();
  }
  function requestTick() { if (!rafPending) { rafPending=true; requestAnimationFrame(updateCinema); } }
  window.addEventListener('scroll',requestTick,{passive:true});
  window.addEventListener('resize',requestTick);
  window.addEventListener('pointermove',event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    targetX=event.clientX/innerWidth-0.5; targetY=event.clientY/innerHeight-0.5; requestTick();
  },{passive:true});
  dots.forEach((dot,index) => dot.addEventListener('click',() => {
    const start=cinema.getBoundingClientRect().top+scrollY;
    const distance=Math.max(1,cinema.offsetHeight-stage.offsetHeight);
    window.scrollTo({top:start+distance*index/(scenes.length-1),behavior:reducedMotion.matches?'auto':'smooth'});
  }));
  reducedMotion.addEventListener('change',requestTick);
  requestTick();
}
