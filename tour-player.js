(() => {
 const video=document.querySelector('[data-property-video]');if(!video)return;
 const full=video.dataset.fullTour,choices=[...document.querySelectorAll('[data-tour]')],chapters=[...document.querySelectorAll('[data-seek]')];
 const status=document.querySelector('[data-tour-status]');let pending=null;
 let selected=full;
 function play(time,src=full){
  status.textContent='';pending=time;
  if(selected!==src){selected=src;video.src=src;video.load();}
  if(video.readyState>=1){video.currentTime=time;pending=null;}
  choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tour===src)));
  const p=video.play();if(p)p.catch(e=>{if(e.name!=='AbortError')status.textContent='Pulsa el control de reproducción del vídeo para continuar.';});
  video.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
 }
 video.addEventListener('loadedmetadata',()=>{if(pending!==null){video.currentTime=Math.min(pending,video.duration);pending=null;}});
 document.querySelectorAll('[data-tour-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.replaceState(null,'',location.pathname+location.search+'#recorrido');play(0);}));
 chapters.forEach(b=>b.addEventListener('click',()=>play(Number(b.dataset.seek))));
 choices.forEach(b=>b.addEventListener('click',()=>play(0,b.dataset.tour)));
 video.addEventListener('timeupdate',()=>{let active=-1;chapters.forEach((b,i)=>{if(Number(b.dataset.seek)<=video.currentTime)active=i;});chapters.forEach((b,i)=>b.setAttribute('aria-pressed',String(selected===full&&active===i)));});
 document.querySelector('[data-video-fullscreen]').addEventListener('click',()=>{if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();else video.requestFullscreen?.().catch(()=>{});});
})();
