const assert = require('node:assert/strict');
const { buildDelta, applyDelta } = require('./build-payload-delta.cjs');

// 1. Equal-length binary with scattered small and large differing regions
const base = Buffer.alloc(65536, 0x41);
const target = Buffer.from(base);
target.fill(0x42, 4090, 4120);
target.fill(0x43, 4125, 4135); // within 12-byte merge gap -> merges with previous
target.fill(0x44, 50000, 50500);
const { deltaBuf, stats } = buildDelta(base, target);
assert.equal(stats.segmentCount, 2, 'Adjacent runs within 12 bytes should merge');
assert(applyDelta(base, deltaBuf).equals(target));
assert(deltaBuf.length < 1024, 'Delta should stay compact');

// 2. Identical binaries -> zero segments
const identical = buildDelta(base, Buffer.from(base));
assert.equal(identical.stats.segmentCount, 0);
assert.equal(identical.deltaBuf.length, 92);
assert(applyDelta(base, identical.deltaBuf).equals(base));

// 3. Target longer than base
const longer = Buffer.concat([base, Buffer.from('extra-global-tail')]);
const longerRes = buildDelta(base, longer);
assert(applyDelta(base, longerRes.deltaBuf).equals(longer));

// 4. Target shorter than base
const shorter = base.subarray(0, 12345);
const shorterRes = buildDelta(base, shorter);
assert(applyDelta(base, shorterRes.deltaBuf).equals(shorter));

// 5. Corruption detection: modified base, modified delta, trailing byte
const badBase = Buffer.from(base);
badBase[0] ^= 1;
assert.throws(() => applyDelta(badBase, deltaBuf), /Base SHA-256 mismatch/);

const badDelta = Buffer.from(deltaBuf);
badDelta[badDelta.length - 1] ^= 1;
assert.throws(() => applyDelta(base, badDelta), /Target SHA-256 mismatch/);

const trailingDelta = Buffer.concat([deltaBuf, Buffer.from([0])]);
assert.throws(() => applyDelta(base, trailingDelta), /Trailing bytes/);

console.log('PASS: payload delta build, merge, length variants, and integrity checks');
