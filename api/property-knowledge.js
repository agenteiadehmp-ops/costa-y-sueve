// Only guest-safe, confirmed facts belong in these profiles. This module is deployed
// publicly with the Vercel function; owner inventories and access details stay private.
module.exports = Object.freeze({
  col1: require('./profiles/col1.json'),
  col2: require('./profiles/col2.json'),
  col3: require('./profiles/col3.json'),
  ca2: require('./profiles/ca2.json'),
  cst3: require('./profiles/cst3.json'),
  apt1: require('./profiles/apt1.json')
});
