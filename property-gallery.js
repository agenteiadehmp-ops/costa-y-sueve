(() => {
  function openLinkedCard() {
    const target = document.getElementById(location.hash.slice(1));
    const card = target?.closest('details.col1-cluster');
    if (card && !card.open) {
      card.open = true;
      target.scrollIntoView();
    }
  }

  window.addEventListener('hashchange', openLinkedCard);
  openLinkedCard();

  const dialog = document.querySelector('#property-lightbox');
  if (!dialog) return;

  const large = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  const previous = dialog.querySelector('[data-photo-prev]');
  const next = dialog.querySelector('[data-photo-next]');
  const photos = [...document.querySelectorAll('#fotos [data-photo]')];
  let current = 0;
  let opener;
  let previousOverflow;

  function show(index) {
    current = Math.max(0, Math.min(photos.length - 1, index));
    const image = photos[current].querySelector('img');
    large.src = image.src;
    large.alt = image.alt;
    caption.textContent = `${current + 1} / ${photos.length} · ${image.alt}`;
    previous.disabled = current === 0;
    next.disabled = current === photos.length - 1;
  }

  photos.forEach((photo, index) => photo.addEventListener('click', () => {
    opener = photo;
    previousOverflow = document.body.style.overflow;
    show(index);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }));

  dialog.querySelector('[data-close-photo]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener.focus({ preventScroll: true });
  });
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });

  let startX = 0;
  large.addEventListener('touchstart', event => {
    startX = event.changedTouches[0].clientX;
  }, { passive: true });
  large.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - startX;
    if (Math.abs(distance) > 50) show(current + (distance < 0 ? 1 : -1));
  }, { passive: true });
})();
