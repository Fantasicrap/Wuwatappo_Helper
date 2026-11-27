// Compress an embedded binary with raw Deflate and emit a 40-byte metadata
// file (Int64 length + 32-byte SHA-256) for streaming integrity verification.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const [inputPath, deflatePath, metaPath] = process.argv.slice(2);
if (!inputPath || !deflatePath || !metaPath) {
  console.error('Usage: node scripts/compress-resource.cjs <input> <output.deflate> <output.meta>');
  process.exit(1);
}

const raw = fs.readFileSync(inputPath);
const hash = crypto.createHash('sha256').update(raw).digest();
const compressed = zlib.deflateRawSync(raw, { level: 6 });

// Round-trip sanity check.
const roundTrip = zlib.inflateRawSync(compressed);
assert(roundTrip.equals(raw), 'Deflate round-trip verification failed');

const meta = Buffer.alloc(40);
meta.writeBigInt64LE(BigInt(raw.length), 0);
hash.copy(meta, 8);

fs.mkdirSync(path.dirname(path.resolve(deflatePath)), { recursive: true });
fs.mkdirSync(path.dirname(path.resolve(metaPath)), { recursive: true });
fs.writeFileSync(deflatePath, compressed);
fs.writeFileSync(metaPath, meta);

console.log(JSON.stringify({
  rawBytes: raw.length,
  compressedBytes: compressed.length,
  savedBytes: raw.length - compressed.length,
  sha256: hash.toString('hex')
}));
