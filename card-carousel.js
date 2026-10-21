(() => {
  document.querySelectorAll('[data-card-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-card-track]');
    const slides = [...track.querySelectorAll('.card-slide')];
    const previous = carousel.querySelector('[data-card-prev]');
    const next = carousel.querySelector('[data-card-next]');
    const count = carousel.querySelector('[data-card-count]');
    let active = 0;
    let frame = 0;
    const update = index => {
      active = Math.max(0, Math.min(slides.length - 1, index));
      count.textContent = `${active + 1} / ${slides.length}`;
      previous.disabled = active === 0;
      next.disabled = active === slides.length - 1;
    };
    const go = index => {
      const target = Math.max(0, Math.min(slides.length - 1, index));
      track.scrollTo({left: slides[target].offsetLeft - track.offsetLeft, behavior: 'smooth'});
      update(target);
    };
    previous.addEventListener('click', () => go(active - 1));
    next.addEventListener('click', () => go(active + 1));
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => update(Math.round(track.scrollLeft / track.clientWidth)));
    }, {passive: true});
    update(0);
  });
})();
