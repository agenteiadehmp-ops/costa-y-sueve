/* Reusable house date picker, adapted from the Bahía Pádel calendar interaction.
   Known blocks and indicative estimates; availability always requires confirmation. */
(() => {
  const calendar = document.querySelector('[data-house-calendar]');
  if (!calendar) return;
  const propertyId = ({'lu1-luces.html':'lu1','lu2-luces.html':'lu2','col1-colunga.html':'col1','col2-colunga.html':'col2','col3-colunga.html':'col3','casa-entre-el-mar-y-la-montana.html':'ca2','cst3-colunga.html':'cst3','apt1-lastres.html':'apt1'})[location.pathname.split('/').pop()];
  let blocks = [];
  let pricing = null;
  const money = cents => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(cents/100);
  const priceFor = date => pricing?.rules?.find(r=>key(date)>=r.start && key(date)<r.end);
  const quote = document.createElement('div'); quote.className='hc-quote';quote.setAttribute('aria-live','polite');
  const conditions = document.createElement('details');conditions.className='hc-conditions';
  const heading = document.createElement('summary');heading.textContent='Condiciones de la reserva';conditions.append(heading);
  const conditionList=document.createElement('ul');conditions.append(conditionList);
  conditionList.textContent='Cargando condiciones…';

  const intersects = (start,end) => blocks.some(b => key(start)<b.end && key(end)>b.start);
  const occupied = d => blocks.some(b => key(d)>=b.start && key(d)<b.end);
  const monthLabel = calendar.querySelector('[data-calendar-month]');
  const grid = calendar.querySelector('[data-calendar-grid]');
  const summary = calendar.querySelector('[data-calendar-summary]');
  const action = calendar.querySelector('[data-calendar-action]');
  summary.after(quote);
  const legend=document.createElement('p');legend.className='hc-legend';legend.textContent='Tachado: ocupado · Resto: consultar disponibilidad · ≈ precio orientativo por noche';
  grid.after(legend);
  calendar.append(conditions);
  function updateQuote() {
    quote.replaceChildren();
    const add=text=>{const p=document.createElement('p');p.textContent=text;quote.append(p);};
    if(!pricing){add('Estimación de precio pendiente de consulta.');return;}
    if(!arrival || !departure){add('Selecciona entrada y salida para ver la estimación de tu estancia.');return;}
    let total=0, minimum=0,missing=false;
    for(let d=new Date(arrival);d<departure;d.setDate(d.getDate()+1)){
      const rate=priceFor(d);if(!rate){missing=true;break;}total+=rate.nightlyCents;minimum=Math.max(minimum,rate.minNights||0);
    }
    if(missing){add('Precio para estas fechas: consultar. No extrapolamos tarifas a otros periodos.');return;}
    add('Alojamiento estimado: '+money(total)+' · '+nights()+' noches');
    if(pricing.preparationCents!==null){add('Preparación: '+money(pricing.preparationCents)+' por estancia.');add('Estimación con preparación: '+money(total+pricing.preparationCents));}
    else add('Limpieza, preparación y posibles suplementos: pendientes de presupuesto; no incluidos en esta estimación.');
    if(minimum)add('Estancia mínima: '+minimum+' noches.'+(nights()<minimum?' Tu selección requiere ampliar fechas o consultar una excepción.':''));
    else add('Estancia mínima: confirmar para tus fechas.');
    add('Importe orientativo, sujeto a ocupación, condiciones y confirmación final. Esta consulta no bloquea fechas.');
  }

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
    updateQuote();
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
      const rate=priceFor(date);
      if(rate && !occupied(date) && date>=today){const label=document.createElement('small');label.className='hc-nightly';label.textContent='≈'+Math.round(rate.nightlyCents/100)+'€';cell.append(label);}

      cell.setAttribute('aria-label',format(date)+(date<today&&!ownerMode?', pasado':''));
      if(date>=today&&!occupied(date))cell.setAttribute('aria-label',format(date)+', disponibilidad por confirmar'+(rate?', precio orientativo '+money(rate.nightlyCents):', precio a consultar'));
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
    fetch('/api/rates?house='+encodeURIComponent(propertyId),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rates');return r.json();}).then(data=>{
      pricing=data;conditionList.replaceChildren();
      const texts=[data.conditions.checkIn,data.conditions.checkOut,data.conditions.pets,data.conditions.rules,data.conditions.payment,data.conditions.cancellation];
      texts.push(data.referenceGuests?'Estimación de referencia para hasta '+data.referenceGuests+' personas; confirma la ocupación y los suplementos.':'Confirma la capacidad del grupo antes de reservar.');
      texts.push('Precios de lanzamiento orientativos. Disponibilidad y presupuesto final sujetos a confirmación.');
      for(const text of texts){const li=document.createElement('li');li.textContent=text;conditionList.append(li);}
      render();updateSummary();
    }).catch(()=>{conditionList.textContent='Confirma con Hernán horarios, estancia mínima, pagos, fianza, cancelación y mascotas antes de reservar.';});

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
