/* Reusable house date picker, adapted from the Bahía Pádel calendar interaction.
   No availability source is connected yet. The UI never labels a date as free. */
(() => {
  const calendar = document.querySelector('[data-house-calendar]');
  if (!calendar) return;
  const propertyId = ({'lu1-luces.html':'lu1','lu2-luces.html':'lu2','col1-colunga.html':'col1','col2-colunga.html':'col2','col3-colunga.html':'col3','casa-entre-el-mar-y-la-montana.html':'ca2','cst3-colunga.html':'cst3','apt1-lastres.html':'apt1'})[location.pathname.split('/').pop()];
  let blocks = [];
  const intersects = (start,end) => blocks.some(b => key(start)<b.end && key(end)>b.start);
  const occupied = d => blocks.some(b => key(d)>=b.start && key(d)<b.end);
  const monthLabel = calendar.querySelector('[data-calendar-month]');
  const grid = calendar.querySelector('[data-calendar-grid]');
  const summary = calendar.querySelector('[data-calendar-summary]');
  const action = calendar.querySelector('[data-calendar-action]');
  const guests = calendar.querySelector('[data-calendar-guests]');
  const houseSelect = calendar.querySelector('[data-house-select]');
  const ownerMode = calendar.dataset.mode === 'owner';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthsAhead = 18;
  const lastMonth = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
  let shown = new Date(today.getFullYear(), today.getMonth(), 1);
  let arrival = null;
  let departure = null;
  const weekday = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const key = date => [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
  const format = date => new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(date);
  const nights = () => arrival && departure ? Math.round((Date.UTC(departure.getFullYear(),departure.getMonth(),departure.getDate())-Date.UTC(arrival.getFullYear(),arrival.getMonth(),arrival.getDate()))/86400000) : 0;
  function updateSummary() {
    if (!arrival) summary.textContent = 'Elige la fecha de entrada';
    else if (!departure) summary.textContent = 'Entrada: ' + format(arrival) + ' · elige la salida';
    else summary.textContent = format(arrival) + ' → ' + format(departure) + ' · ' + nights() + (nights()===1?' noche':' noches');
    if (!action) return;
    if (!(arrival && departure)) { action.href = '#'; action.setAttribute('aria-disabled','true'); return; }
    const house = houseSelect ? houseSelect.value : (calendar.dataset.house || 'COL1');
    const count = guests ? guests.value : '2';
    const group = calendar.dataset.askGuests === 'true' ? 'Quisiera consultar si encaja con nuestro grupo.' : `${count} huésped${count==='1'?'':'es'}.`;
    const message = `Hola Hernán, me interesaría ${house}. Entrada: ${key(arrival)}. Salida: ${key(departure)}. ${group} ¿Puedes confirmar disponibilidad y precio?`;
    action.href = 'https://wa.me/34649345032?text='+encodeURIComponent(message);
    action.removeAttribute('aria-disabled');
  }
  function render() {
    const label = new Intl.DateTimeFormat('es-ES',{month:'long',year:'numeric'}).format(shown);
    monthLabel.textContent = label.charAt(0).toUpperCase()+label.slice(1);
    const offset = (new Date(shown.getFullYear(),shown.getMonth(),1).getDay()+6)%7;
    const count = new Date(shown.getFullYear(),shown.getMonth()+1,0).getDate();
    grid.replaceChildren();
    weekday.forEach(day => { const cell=document.createElement('span');cell.className='hc-weekday';cell.textContent=day;grid.append(cell); });
    for(let i=0;i<offset;i++){const blank=document.createElement('span');blank.className='hc-blank';grid.append(blank);}
    for(let day=1;day<=count;day++){
      const date=new Date(shown.getFullYear(),shown.getMonth(),day);
      const cell=document.createElement('button');cell.type='button';cell.className='hc-day';cell.textContent=String(day);
      cell.setAttribute('aria-label',format(date)+(date<today&&!ownerMode?', pasado':''));
      if(date<today&&!ownerMode) cell.disabled=true;
      const choosingDeparture = arrival && !departure && date>arrival;
      const blocked = choosingDeparture ? intersects(arrival,date) : occupied(date);
      if(blocked) {cell.disabled=true;cell.classList.add('hc-blocked');cell.setAttribute('aria-label',format(date)+', no disponible');}
      if(arrival && key(date)===key(arrival)) cell.classList.add('hc-start');
      if(departure && key(date)===key(departure)) cell.classList.add('hc-end');
      if(arrival && departure && date>arrival && date<departure) cell.classList.add('hc-between');
      if(key(date)===key(today)) cell.classList.add('hc-today');
      cell.addEventListener('click',()=>{
        if(!arrival || departure || date<=arrival){arrival=date;departure=null;} else {departure=date;}
        render();updateSummary();
      });
      grid.append(cell);
    }
    calendar.querySelector('[data-calendar-prev]').disabled=shown.getFullYear()===today.getFullYear()&&shown.getMonth()===today.getMonth()&&!ownerMode;
    calendar.querySelector('[data-calendar-next]').disabled=shown>=lastMonth&&!ownerMode;
  }
  calendar.querySelector('[data-calendar-prev]').addEventListener('click',()=>{shown=new Date(shown.getFullYear(),shown.getMonth()-1,1);render();});
  calendar.querySelector('[data-calendar-next]').addEventListener('click',()=>{shown=new Date(shown.getFullYear(),shown.getMonth()+1,1);render();});
  if(action) action.addEventListener('click',event=>{if(action.getAttribute('aria-disabled')==='true')event.preventDefault();});
  if(houseSelect) houseSelect.addEventListener('change',()=>{arrival=null;departure=null;updateSummary();render();});
  if(guests) guests.addEventListener('change',updateSummary);
  updateSummary();render();
  if(propertyId) {
    const tag=calendar.querySelector('.hc-tag');
    if(tag)tag.textContent='Comprobando calendario';
    fetch('/api/availability?house='+encodeURIComponent(propertyId),{cache:'no-store'})
      .then(r=>r.json()).then(data=>{
        blocks=Array.isArray(data.blocks)?data.blocks:[];
        if(arrival && (occupied(arrival)||(departure&&intersects(arrival,departure)))){arrival=null;departure=null;}
        if(tag)tag.textContent=data.status==='synced'?'Fechas sujetas a confirmación':'Disponibilidad por confirmar';
        render();updateSummary();
      }).catch(()=>{if(tag)tag.textContent='Disponibilidad por confirmar';});
  }
})();
