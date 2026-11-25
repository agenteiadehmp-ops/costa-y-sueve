const {test}=require('node:test'),assert=require('node:assert/strict');const {recommend}=require('../api/pricing-policy');
const context={checkIn:'2027-07-17',checkOut:'2027-07-24',guests:4};
const quote=(id,price)=>({...context,propertyId:id,nightlyCents:price,independent:true,verified:true,comparable:true,currency:'EUR',sourceURL:'https://example.com',checkedAt:'2026-11-25',cancellationGroup:'flexible',priceBasis:'accommodation'});
test('median minus 10 percent, not cheapest or another commission',()=>assert.equal(recommend([quote('a',10000),quote('b',15000),quote('c',30000)],context).recommendedCents,13500));
test('own properties, duplicates and unmatched dates excluded',()=>{const q=quote('a',10000);assert.equal(recommend([q,q,{...quote('b',10000),independent:false},{...quote('c',10000),checkIn:'2027-08-01'}],context).status,'insufficient_evidence');});
test('no publication below owner floor',()=>assert.equal(recommend([quote('a',10000),quote('b',10000),quote('c',10000)],{...context,floorCents:9500}).status,'below_floor'));
test('cancellation and fee bases must match',()=>assert.throws(()=>recommend([quote('a',10000),{...quote('b',10000),priceBasis:'all-in'},quote('c',10000)],context)));
test('supports remaining November and December 2026',()=>{for(const [checkIn,checkOut] of [['2026-11-25','2026-11-30'],['2026-12-29','2027-01-01']]){const c={checkIn,checkOut,guests:4};const quotes=['a','b','c'].map(id=>({...quote(id,10000),...c}));assert.equal(recommend(quotes,c).recommendedCents,9000);}});
test('rejects invalid dates and dates outside approved period',()=>{for(const [checkIn,checkOut] of [['2026-11-24','2026-11-30'],['2027-02-30','2027-03-04'],['2028-01-01','2028-01-03']])assert.throws(()=>recommend([],{checkIn,checkOut,guests:4}));});
