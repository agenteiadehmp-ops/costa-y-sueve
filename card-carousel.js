(() => {
  document.querySelectorAll('[data-card-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-card-track]');
    const slides = [...track.querySelectorAll('.card-slide')];
    const previous = carousel.querySelector('[data-card-prev]');
    const next = carousel.querySelector('[data-card-next]');
    const count = carousel.querySelector('[data-card-count]');
    let active = 0;
    let frame = 0;
    let pointer=null,suppressClick=false;
    const update = index => {
      active = Math.max(0, Math.min(slides.length - 1, index));
      count.textContent = `${active + 1} / ${slides.length}`;
      previous.disabled = active === 0;
      next.disabled = active === slides.length - 1;
    };
    const go = index => {
      const target = Math.max(0, Math.min(slides.length - 1, index));
      track.scrollTo({left: target * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      update(target);
    };
    previous.addEventListener('click', () => go(active - 1));
    next.addEventListener('click', () => go(active + 1));
    track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(active+(e.key==='ArrowLeft'?-1:1));}});
    track.addEventListener('dragstart',e=>e.preventDefault());
    track.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){pointer={x:e.clientX,left:track.scrollLeft,id:e.pointerId};suppressClick=false;}});
    track.addEventListener('pointermove',e=>{if(!pointer)return;const delta=e.clientX-pointer.x;if(Math.abs(delta)>6){suppressClick=true;track.classList.add('is-dragging');track.setPointerCapture(e.pointerId);}if(suppressClick){e.preventDefault();track.scrollLeft=pointer.left-delta;}});
    const finish=()=>{if(!pointer)return;const id=pointer.id;pointer=null;track.classList.remove('is-dragging');if(track.hasPointerCapture(id))track.releasePointerCapture(id);if(suppressClick)go(Math.round(track.scrollLeft/track.clientWidth));};
    track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);
    track.addEventListener('pointerleave',()=>{if(pointer&&!suppressClick)pointer=null;});
    track.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => update(Math.round(track.scrollLeft / track.clientWidth)));
    }, {passive: true});
    update(0);
  });
})();
