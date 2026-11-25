(async()=>{
 const houses={lu1:'Las Casitas de Luces 1',lu2:'Las Casitas de Luces 2',col1:'COL1 · Colunga',col2:'COL2 · Colunga',col3:'COL3 · Colunga',ca2:'CA2 · Caravia',cst3:'CST3 · Castiellu',apt1:'APT1 · Lastres'};
 const container=document.getElementById('houses');container.replaceChildren();
 await Promise.all(Object.entries(houses).map(async([id,name])=>{
  const section=document.createElement('section'),title=document.createElement('h2'),status=document.createElement('p');title.textContent=name;status.textContent='Comprobando conexión…';section.append(title,status);container.append(section);
  try{const response=await fetch('/api/availability?house='+id,{cache:'no-store'});const data=await response.json();
   status.textContent=({synced:'Calendarios consultados. Confirmar antes de reservar.',unconnected:'Pendiente de conectar los calendarios de los portales.',incomplete:'Conexión incompleta. Revisar los portales antes de confirmar.',error:'No se pudo comprobar el calendario.'})[data.status]||'Disponibilidad sin verificar.';
   if(data.checkedAt){const checked=document.createElement('p');checked.textContent='Última consulta: '+new Date(data.checkedAt).toLocaleString('es-ES',{timeZone:'Europe/Madrid'});section.append(checked);}
   const list=document.createElement('ul');for(const block of data.blocks||[]){const li=document.createElement('li');li.textContent=block.start+' hasta '+block.end+' (salida)';list.append(li);}section.append(list);
  }catch{status.textContent='Sin conexión. Consultar disponibilidad personalmente.';}
  const ratesTitle=document.createElement('h3');ratesTitle.textContent='Precios y estancia mínima';section.append(ratesTitle);
  try{const response=await fetch('/api/rates?house='+id,{cache:'no-store'});const data=await response.json();
   const note=document.createElement('p');note.textContent=data.status==='error'?'No se pudieron consultar las tarifas.':'Tarifas orientativas pendientes de confirmación. No se envían a los portales.';section.append(note);
   if(!data.rules?.length){const empty=document.createElement('p');empty.textContent='Pendiente de definir temporadas, precio por noche y mínimo de noches.';section.append(empty);}
   else{const table=document.createElement('table');table.style.width='100%';const header=document.createElement('tr');for(const title of ['Desde','Hasta (excluido)','€/noche','Mín. noches']){const th=document.createElement('th');th.textContent=title;header.append(th);}table.append(header);for(const rule of data.rules){const tr=document.createElement('tr');for(const value of [rule.start,rule.end,(rule.nightlyCents/100).toLocaleString('es-ES',{style:'currency',currency:'EUR'}),rule.minNights]){const td=document.createElement('td');td.textContent=value;tr.append(td);}table.append(tr);}section.append(table);}
  }catch{const error=document.createElement('p');error.textContent='Tarifas sin verificar.';section.append(error);}
 }));
})();
