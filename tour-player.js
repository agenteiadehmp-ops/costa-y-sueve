(() => {
 const video=document.querySelector('[data-property-video]');if(!video)return;
 const full=video.dataset.fullTour,choices=[...document.querySelectorAll('[data-tour]')],chapters=[...document.querySelectorAll('[data-seek]')];
 const status=document.querySelector('[data-tour-status]');let pending=null;
 let selected=full;
 function seekPending(){
  if(pending===null||video.readyState<1||video.seeking)return;
  const target=Math.min(pending,Number.isFinite(video.duration)?video.duration:pending);
  if(Math.abs(video.currentTime-target)<0.5){pending=null;return;}
  try{video.currentTime=target;}catch(e){/* Retry once metadata/data becomes available. */}
 }
 function play(time,src=full){
  status.textContent='';pending=time;
  if(selected!==src){selected=src;video.src=src;video.load();}
  choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tour===src)));
  const p=video.play();if(p)p.catch(e=>{if(e.name!=='AbortError')status.textContent='Pulsa el control de reproducción del vídeo para continuar.';});
  // Keep the requested chapter until seeking actually completes. Some mobile
  // browsers reset an early currentTime assignment when playback starts.
  seekPending();
  video.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
 }
 ['loadedmetadata','loadeddata','canplay','playing','progress','seeked'].forEach(event=>video.addEventListener(event,seekPending));
 document.querySelectorAll('[data-tour-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.replaceState(null,'',location.pathname+location.search+'#recorrido');play(0);}));
 chapters.forEach(b=>b.addEventListener('click',()=>play(Number(b.dataset.seek))));
 choices.forEach(b=>b.addEventListener('click',()=>play(0,b.dataset.tour)));
 video.addEventListener('timeupdate',()=>{seekPending();let active=-1;chapters.forEach((b,i)=>{if(Number(b.dataset.seek)<=video.currentTime)active=i;});chapters.forEach((b,i)=>b.setAttribute('aria-pressed',String(selected===full&&active===i)));});
 document.querySelector('[data-video-fullscreen]').addEventListener('click',()=>{if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();else video.requestFullscreen?.().catch(()=>{});});
})();
