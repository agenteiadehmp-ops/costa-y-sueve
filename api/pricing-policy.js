// Costa y Sueve noviembre 2026–2027: apply once to independently verified, like-for-like quotes.
const POLICY=Object.freeze({year:2027,effectiveFrom:'2026-11-25',effectiveUntil:'2028-01-01',launchDiscount:0.10,minimumComparables:3,targetComparables:5,reference:'median',automaticPublishing:false});
function recommend(quotes,{checkIn,checkOut,guests,floorCents=0}){
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 if(!validDate(checkIn)||!validDate(checkOut)||checkIn<POLICY.effectiveFrom||checkIn>=POLICY.effectiveUntil||checkOut>POLICY.effectiveUntil||checkIn>=checkOut||!Number.isInteger(guests)||guests<1||!Number.isInteger(floorCents)||floorCents<0)throw new Error('Invalid comparison');
 const seen=new Set();
 const usable=quotes.filter(q=>{
  if(!q.independent||!q.verified||!q.comparable||!q.propertyId||seen.has(q.propertyId)||q.currency!=='EUR'||q.checkIn!==checkIn||q.checkOut!==checkOut||q.guests!==guests||!Number.isInteger(q.nightlyCents)||q.nightlyCents<1||!q.sourceURL||!q.checkedAt||!q.cancellationGroup||!q.priceBasis)return false;
  seen.add(q.propertyId);return true;
 });
 // Different fee/cancellation bases must not be pooled.
 const bases=new Set(usable.map(q=>q.cancellationGroup+'|'+q.priceBasis));
 if(bases.size>1)throw new Error('Inconsistent comparison bases');
 if(usable.length<POLICY.minimumComparables)return {status:'insufficient_evidence',sampleSize:usable.length,referenceCents:null,recommendedCents:null};
 const prices=usable.map(q=>q.nightlyCents).sort((a,b)=>a-b),n=prices.length;
 const referenceCents=n%2?prices[(n-1)/2]:(prices[n/2-1]+prices[n/2])/2;
 const discountedCents=Math.round(referenceCents*(1-POLICY.launchDiscount));
 if(discountedCents<floorCents)return {status:'below_floor',sampleSize:n,referenceCents,discountedCents,recommendedCents:null};
 return {status:'draft',sampleSize:n,referenceCents,recommendedCents:discountedCents};
}
module.exports={POLICY,recommend};
