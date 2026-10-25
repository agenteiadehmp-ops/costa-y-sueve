(() => {
 const modal=document.querySelector('#col2-lightbox'), large=modal.querySelector('img'), caption=modal.querySelector('p');
 const photos=[...document.querySelectorAll('[data-photo]')];let current=0,opener;
 function show(i){current=Math.max(0,Math.min(photos.length-1,i));large.src=photos[current].src;large.alt=photos[current].alt;caption.textContent=`${current+1} / ${photos.length} · ${large.alt}`;modal.querySelector('[data-photo-prev]').disabled=current===0;modal.querySelector('[data-photo-next]').disabled=current===photos.length-1;}
 function open(i){opener=photos[i];show(i);modal.showModal();document.body.style.overflow='hidden';}
 photos.forEach((photo,i)=>{photo.addEventListener('click',()=>open(i));photo.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i);}});});
 modal.querySelector('[data-close-photo]').addEventListener('click',()=>modal.close());
 modal.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus({preventScroll:true});});
 modal.querySelector('[data-photo-prev]').addEventListener('click',()=>show(current-1));modal.querySelector('[data-photo-next]').addEventListener('click',()=>show(current+1));
 modal.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(current-1);if(e.key==='ArrowRight')show(current+1);});
 let startX=0;large.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;},{passive:true});large.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-startX;if(Math.abs(delta)>50)show(current+(delta<0?1:-1));},{passive:true});
})();
