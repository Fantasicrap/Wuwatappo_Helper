// Build and verify a deterministic WTDP0001 binary delta from the CN payload
// to the Global payload so the launcher embeds the shared executable once.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const MAGIC = Buffer.from('WTDP0001', 'ascii');
const BLOCK = 4096;
const MERGE_GAP = 12;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function buildDelta(baseBuf, targetBuf) {
  const commonLen = Math.min(baseBuf.length, targetBuf.length);
  const rawSegments = [];

  let i = 0;
  while (i < commonLen) {
    const chunkEnd = Math.min(i + BLOCK, commonLen);
    if (baseBuf.subarray(i, chunkEnd).equals(targetBuf.subarray(i, chunkEnd))) {
      i = chunkEnd;
      continue;
    }
    let j = i;
    while (j < chunkEnd) {
      if (baseBuf[j] !== targetBuf[j]) {
        const start = j;
        while (j < chunkEnd && baseBuf[j] !== targetBuf[j]) j++;
        rawSegments.push([start, j]);
      } else {
        j++;
      }
    }
    i = chunkEnd;
  }

  if (targetBuf.length > commonLen) {
    rawSegments.push([commonLen, targetBuf.length]);
  }

  // Merge adjacent segments when the unchanged gap is <= 12-byte header overhead.
  const segments = [];
  for (const [start, end] of rawSegments) {
    if (segments.length > 0 && start - segments[segments.length - 1][1] <= MERGE_GAP) {
      segments[segments.length - 1][1] = end;
    } else {
      segments.push([start, end]);
    }
  }

  const baseHash = sha256(baseBuf);
  const targetHash = sha256(targetBuf);

  const header = Buffer.alloc(92);
  MAGIC.copy(header, 0);
  header.writeBigInt64LE(BigInt(baseBuf.length), 8);
  baseHash.copy(header, 16);
  header.writeBigInt64LE(BigInt(targetBuf.length), 48);
  targetHash.copy(header, 56);
  header.writeInt32LE(segments.length, 88);

  const parts = [header];
  let patchDataBytes = 0;
  for (const [start, end] of segments) {
    const len = end - start;
    const segHead = Buffer.alloc(12);
    segHead.writeBigInt64LE(BigInt(start), 0);
    segHead.writeInt32LE(len, 8);
    parts.push(segHead, targetBuf.subarray(start, end));
    patchDataBytes += len;
  }

  const deltaBuf = Buffer.concat(parts);

  // Self-verify round-trip reconstruction before writing.
  const reconstructed = applyDelta(baseBuf, deltaBuf);
  assert(reconstructed.equals(targetBuf), 'Delta round-trip reconstruction mismatch');

  return {
    deltaBuf,
    stats: {
      baseBytes: baseBuf.length,
      targetBytes: targetBuf.length,
      segmentCount: segments.length,
      patchDataBytes,
      deltaBytes: deltaBuf.length,
      baseSha256: baseHash.toString('hex'),
      targetSha256: targetHash.toString('hex'),
      deltaSha256: sha256(deltaBuf).toString('hex')
    }
  };
}

function applyDelta(baseBuf, deltaBuf) {
  assert(deltaBuf.length >= 92 && deltaBuf.subarray(0, 8).equals(MAGIC), 'Invalid delta header');
  const baseLen = Number(deltaBuf.readBigInt64LE(8));
  const baseHash = deltaBuf.subarray(16, 48);
  const targetLen = Number(deltaBuf.readBigInt64LE(48));
  const targetHash = deltaBuf.subarray(56, 88);
  const segCount = deltaBuf.readInt32LE(88);

  assert.equal(baseBuf.length, baseLen, 'Base length mismatch');
  assert(sha256(baseBuf).equals(baseHash), 'Base SHA-256 mismatch');

  const out = Buffer.allocUnsafe(targetLen);
  let cursor = 0;
  let pos = 92;
  for (let s = 0; s < segCount; s++) {
    const offset = Number(deltaBuf.readBigInt64LE(pos));
    const len = deltaBuf.readInt32LE(pos + 8);
    pos += 12;
    assert(offset >= cursor && len > 0 && offset + len <= targetLen, 'Invalid segment bounds');
    if (offset > cursor) {
      baseBuf.copy(out, cursor, cursor, offset);
      cursor = offset;
    }
    deltaBuf.copy(out, cursor, pos, pos + len);
    pos += len;
    cursor += len;
  }
  assert.equal(pos, deltaBuf.length, 'Trailing bytes in delta');
  if (cursor < targetLen) {
    baseBuf.copy(out, cursor, cursor, targetLen);
  }
  assert(sha256(out).equals(targetHash), 'Target SHA-256 mismatch');
  return out;
}

if (require.main === module) {
  const [basePath, targetPath, outputPath] = process.argv.slice(2);
  if (!basePath || !targetPath || !outputPath) {
    console.error('Usage: node scripts/build-payload-delta.cjs <base-exe> <target-exe> <output-delta>');
    process.exit(1);
  }
  const baseBuf = fs.readFileSync(basePath);
  const targetBuf = fs.readFileSync(targetPath);
  const { deltaBuf, stats } = buildDelta(baseBuf, targetBuf);
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, deltaBuf);
  console.log(JSON.stringify(stats, null, 2));
}

module.exports = { buildDelta, applyDelta };
