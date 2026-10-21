(() => {
  const track = document.querySelector('[data-col1-track]');
  if (!track) return;
  const slides = [...track.querySelectorAll('.col1-slide')];
  const dots = [...document.querySelectorAll('[data-col1-dot]')];
  const counter = document.querySelector('[data-col1-count]');
  const previous = document.querySelector('[data-col1-prev]');
  const next = document.querySelector('[data-col1-next]');
  let active = 0;
  const select = index => {
    active = Math.max(0, Math.min(slides.length - 1, index));
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)));
    counter.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    previous.disabled = active === 0;
    next.disabled = active === slides.length - 1;
  };
  const go = index => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({ left: slides[target].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    select(target);
  };
  previous.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  dots.forEach((dot, index) => dot.addEventListener('click', () => go(index)));
  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      let closest = 0;
      let distance = Infinity;
      slides.forEach((slide, index) => {
        const delta = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
        if (delta < distance) { distance = delta; closest = index; }
      });
      select(closest);
    });
  }, { passive: true });
  select(0);
})();
