const properties=require('./property-knowledge');
const estimates=require('../data/booking-estimates.json');
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
function rulesFor(config,house){
 const rules=config[house]||[];
 if(!Array.isArray(rules))throw new Error('Invalid rules');
 const sorted=rules.map(r=>{
  if(!validDate(r.start)||!validDate(r.end)||r.start>=r.end||(r.minNights!==null&&(!Number.isInteger(r.minNights)||r.minNights<1||r.minNights>365))||!Number.isInteger(r.nightlyCents)||r.nightlyCents<1)throw new Error('Invalid rule');
  return {start:r.start,end:r.end,minNights:r.minNights,nightlyCents:r.nightlyCents};
 }).sort((a,b)=>a.start.localeCompare(b.start));
 for(let i=1;i<sorted.length;i++)if(sorted[i].start<sorted[i-1].end)throw new Error('Overlapping seasons');
 return sorted;
}
module.exports=(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const house=String(req.query.house||'').toLowerCase();if(!Object.hasOwn(properties,house))return res.status(404).json({error:'Vivienda desconocida'});
 try{
 const configured=rulesFor(JSON.parse(process.env.CALENDAR_RATES_JSON||'{}'),house);
 const estimate=estimates.properties[house];
 const periods=[['2026-11-25','2026-12-04',false],['2026-12-04','2026-12-09',true],['2026-12-09','2026-12-23',false],['2026-12-23','2027-01-01',true]];
 const rules=configured.length?configured:periods.map(([start,end,special])=>({start,end,nightlyCents:special?estimate.specialCents:estimate.ordinaryCents,minNights:null}));
 return res.status(200).json({house,currency:'EUR',status:configured.length?'draft':'estimate',rules,referenceGuests:estimate.referenceGuests,preparationCents:estimate.preparationCents??null,updatedAt:estimates.updatedAt,conditions:{checkIn:estimate.checkIn,checkOut:estimate.checkOut,pets:estimate.pets,rules:estimate.rules||'Respetar la vivienda y el descanso de los vecinos.',payment:'La consulta no confirma ni bloquea la reserva. Recibirás precio final, forma de pago, anticipo y posible fianza antes de aceptar.',cancellation:'Las condiciones de cancelación se comunicarán por escrito antes de confirmar. Si reservas en un portal, consulta las condiciones de esa tarifa.'}});
 }catch{return res.status(503).json({house,status:'error',rules:[]});}
};
module.exports.rulesFor=rulesFor;
