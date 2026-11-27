const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

// 1. Settings backup allowlist & security test
{
  const src = fs.readFileSync(path.join(root, 'patches/settings-backup.js'), 'utf8')
    .replace(/export function /g, 'function ')
    + '\nthis.api={exportHelperBackup,importHelperBackup};';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const { exportHelperBackup, importHelperBackup } = ctx.api;

  const map = new Map([
    ['wuwatappo-theme-v1', 'aemeath'],
    ['wuwatappo-hotkeys-v1', '{"reload":"F5"}'],
    ['wuwatappo-wuwa-keys-v1', '["1","2","3","Q","E","R","Shift","MouseLeft","MouseX1"]'],
    ['wuwatappo-room-history-v1:42', '[{"id":"1001","visitedAt":123}]'],
    ['wuwatappo-room-labels-v1:42', '[["1001",{"note":"好友房","pinned":true,"visitedAt":123}]]'],
    ['wuwatappo-aemeath-background-v1', 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA='],
    ['wuwatappo-login-cuid', 'SECRET_CUID'],
    ['wuwatappo-user-info-cache', '{"token":"SECRET"}'],
    ['wt-global-login-cuid', 'SECRET_GLOBAL'],
    ['infoToken', 'SECRET_TOKEN'],
    ['arbitrary-unknown', 'nope']
  ]);
  const storage = {
    get length() { return map.size; },
    key(i) { return [...map.keys()][i] ?? null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(k, String(v)); }
  };

  const basic = exportHelperBackup(storage, { includeBackgrounds: false });
  assert.equal(basic.schema, 'wuwatappo-helper-backup-v1');
  assert.equal(basic.count, 5);
  assert(!Object.hasOwn(basic.entries, 'wuwatappo-aemeath-background-v1'));
  for (const forbidden of ['wuwatappo-login-cuid', 'wuwatappo-user-info-cache', 'wt-global-login-cuid', 'infoToken', 'arbitrary-unknown']) {
    assert(!Object.hasOwn(basic.entries, forbidden), 'Sensitive or unknown key leaked: ' + forbidden);
  }

  const withBg = exportHelperBackup(storage, { includeBackgrounds: true });
  assert.equal(withBg.count, 6);
  assert(Object.hasOwn(withBg.entries, 'wuwatappo-aemeath-background-v1'));

  // Import into fresh storage with injected disallowed & bad bg entries
  const destMap = new Map();
  const dest = {
    get length() { return destMap.size; },
    key(i) { return [...destMap.keys()][i] ?? null; },
    getItem(k) { return destMap.has(k) ? destMap.get(k) : null; },
    setItem(k, v) { destMap.set(k, String(v)); }
  };
  const payload = {
    ...withBg,
    entries: {
      ...withBg.entries,
      infoToken: 'SHOULD_SKIP',
      'wuwatappo-denia-background-v1': 'javascript:alert(1)'
    }
  };
  const imported = importHelperBackup(JSON.stringify(payload), dest);
  assert.equal(imported.imported, 6);
  assert.equal(imported.skipped, 2);
  assert.equal(destMap.get('wuwatappo-theme-v1'), 'aemeath');
  assert(!destMap.has('infoToken'));
  assert(!destMap.has('wuwatappo-denia-background-v1'));
  assert.throws(() => importHelperBackup('not json', dest));
  assert.throws(() => importHelperBackup(JSON.stringify({ schema: 'wrong', entries: {} }), dest));
}

// 2. Room history remove() per-account isolation test
{
  const src = fs.readFileSync(path.join(root, 'patches/room-history-core.js'), 'utf8') + '\nthis.C=__wtRoomHistoryCore;';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const mem = new Map();
  const storage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  let t = 1000;
  const history = ctx.C.create({ storage, now: () => ++t });
  history.remember(1, 'R1');
  history.remember(1, 'R2');
  history.remember(2, 'R1');
  history.annotate(1, 'R1', { note: '固定队', pinned: true });
  assert.equal(history.remove(1, 'R1'), true);
  assert.deepEqual(Array.from(history.read(1), r => r.id), ['R2']);
  assert.deepEqual(Array.from(history.read(2), r => r.id), ['R1'], 'Account 2 must be unaffected');
  assert.equal(history.remove(1, 'MISSING'), false);
}

// 3. Input recorder custom 9-key bindings & side mouse buttons & APM summary
{
  const src = fs.readFileSync(path.join(root, 'patches/input-recorder.js'), 'utf8')
    .replace('export {__wtInputRecorder};', 'this.api=__wtInputRecorder;');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const api = ctx.api;
  assert.equal(api.normalize('Digit4'), '', 'Default normalize stays strict for legacy tests');
  assert.equal(api.normalizeAny('Digit4'), '4');
  assert.equal(api.normalizeAny('ShiftLeft'), 'Shift');
  assert.equal(api.normalizeAny('x1'), 'MouseX1');
  assert.equal(api.normalizeAny('x2'), 'MouseX2');
  assert.equal(api.normalizeAny('middle'), 'MouseMiddle');

  const custom = ['1', '2', '3', 'Q', 'E', 'R', 'Shift', 'MouseLeft', 'MouseX1'];
  let now = 0;
  const rec = api.create({ clock: () => now, date: () => '2026-11-27T05:00:00.000Z', allowedKeys: custom });
  rec.start();
  now = 200; rec.input('ShiftLeft', true);
  now = 350; rec.input('ShiftLeft', false);
  now = 500; rec.input('x1', true);
  now = 700; rec.input('x1', false);
  now = 900; rec.input('Space', true); // not in custom 9 keys -> ignored
  now = 1000; rec.input('Space', false);
  const out = rec.stop();
  assert.deepEqual(Array.from(out.events, e => [e.key, e.action]), [
    ['Shift', 'press'], ['Shift', 'release'], ['MouseX1', 'press'], ['MouseX1', 'release']
  ]);
  const stats = api.summary(out);
  assert.equal(stats.presses, 2);
  assert.equal(stats.apm, 120);
  const txt = api.txt(out);
  assert(txt.includes('鼠标侧键 1'));
  assert(txt.includes('120 APM'));
}

console.log('PASS: v1.0.5.6 backup allowlist, room remove, custom 9-key side buttons and APM summary');
