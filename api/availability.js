// Server-only calendar sources. Never return private feed URLs or guest details.
const properties = require('./property-knowledge');
const allowedHosts = ['airbnb.com','airbnb.es','booking.com','vrbo.com','homeaway.com'];
function date(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value) throw new Error('Invalid date');
  return value;
}
function parseICS(body) {
  if (!body.includes('BEGIN:VCALENDAR') || !body.includes('END:VCALENDAR')) throw new Error('Invalid calendar');
  const result=[];
  const unfolded=body.replace(/\r?\n[ \t]/g,'');
  const starts=(unfolded.match(/BEGIN:VEVENT/g)||[]).length;
  const events=[...unfolded.matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)];
  if(starts!==events.length) throw new Error('Incomplete calendar');
  for(const [,event] of events) {
    if(/^STATUS:CANCELLED\s*$/m.test(event)) continue;
    if(/^(RRULE|RDATE|EXDATE|RECURRENCE-ID)[;:]/m.test(event)) throw new Error('Recurring events require review');
    const field=name=>{
      const match=event.match(new RegExp('^'+name+'(?:;VALUE=DATE)?:([0-9]{8})\\r?$','m'));
      if(!match) throw new Error('Only full-day stays supported');
      return date(match[1].replace(/^(....)(..)(..)$/,'$1-$2-$3'));
    };
    const start=field('DTSTART'),end=field('DTEND');
    if(start>=end) throw new Error('Invalid stay');
    result.push({start,end});
  }
  return result;
}
function sourceURL(raw) {
  const u=new URL(raw);
  if(u.protocol!=='https:' || u.port || u.username || u.password || !allowedHosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))) throw new Error('Unsupported calendar host');
  return u;
}
async function readFeed(url) {
  const response=await fetch(sourceURL(url),{redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error('Feed unavailable');
  const reader=response.body.getReader();let size=0;const chunks=[];
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000)throw new Error('Calendar too large');chunks.push(Buffer.from(value));}}finally{await reader.cancel();}
  return parseICS(Buffer.concat(chunks).toString('utf8'));
}
async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'Método no permitido'});
  const house=String(req.query.house||'').toLowerCase();
  if(!Object.hasOwn(properties,house))return res.status(404).json({error:'Vivienda desconocida'});
  try {
    const config=JSON.parse(process.env.CALENDAR_SOURCES_JSON||'{}');
    const sources=config[house]||[];
    if(!Array.isArray(sources)||sources.length>6)throw new Error('Invalid configuration');
    if(!sources.length)return res.status(200).json({house,status:'unconnected',blocks:[],checkedAt:null});
    const results=await Promise.allSettled(sources.map(readFeed));
    const blocks=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
    const unique=[...new Map(blocks.map(b=>[b.start+'/'+b.end,b])).values()];
    return res.status(200).json({house,status:results.every(r=>r.status==='fulfilled')?'synced':'incomplete',blocks:unique,checkedAt:new Date().toISOString()});
  }catch{return res.status(503).json({house,status:'error',blocks:[],checkedAt:null});}
}
module.exports=handler;
module.exports.parseICS=parseICS;
module.exports.sourceURL=sourceURL;
