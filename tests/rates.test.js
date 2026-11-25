const {test}=require('node:test');const assert=require('node:assert/strict');const {rulesFor}=require('../api/rates');
const rule={start:'2027-06-01',end:'2027-07-01',nightlyCents:10000,minNights:3};
test('no invented prices',()=>assert.deepEqual(rulesFor({},'lu1'),[]));
test('prices and minimum stay scoped by property',()=>{assert.deepEqual(rulesFor({lu1:[rule]},'lu1'),[rule]);assert.deepEqual(rulesFor({lu1:[rule]},'lu2'),[]);});
test('reject overlaps and invalid rules',()=>{assert.throws(()=>rulesFor({lu1:[rule,rule]},'lu1'));for(const change of [{nightlyCents:0},{minNights:0},{start:'2027-02-30'},{end:'2027-05-01'}])assert.throws(()=>rulesFor({lu1:[{...rule,...change}]},'lu1'));});
