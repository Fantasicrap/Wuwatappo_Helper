const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { babelParse, traverse } = require('playwright/lib/transform/babelBundle');
const { fixturePath } = require('./upstream-fixtures.cjs');
const source = fs.readFileSync(fixturePath('dist/migration-1.0.3.4/index-pp8VWaUF.js'), 'utf8');
const expected = ['no', 'ul', 'xd', 'hh', 'eh', 'jp', '__wtSetAllRoomMembersVisible', '__wtSyncRoomVisibility', '__wtToggleOnlyShowSelf', '__wtPerformHelperAction'];
const functions = new Map();
traverse(babelParse(source, 'panel.mjs', true), {
  FunctionDeclaration(p) {
    const n = p.node;
    if (expected.includes(n.id.name)) functions.set(n.id.name, source.slice(n.start, n.end));
  }
});
assert.equal(functions.size, expected.length);
const self = { id: 1, online: true, dockVisible: true };
const peer = { id: 2, online: true, dockVisible: true };
const settings = { onlyShowSelf: false };
const callbacks = [];
let refreshes = 0;
function launch() {
  const ctx = {
    officialOnlyShowSelf: { value: settings.onlyShowSelf },
    Eo: { value: new Set() }, Wo: { value: self.id }, de: { value: [self, peer] },
    Ie: () => false, Go: m => m.id === self.id, on: () => {},
    dt: Number, ut: new Set(), Mt: new Set(), Vr: new Set(), ip: () => {}, il: () => {},
    xo: () => {}, Fe: fn => callbacks.push(fn), Me: () => refreshes++,
    ri: patch => Object.assign(settings, patch)
  };
  vm.runInNewContext([...functions.values()].join('\n'), ctx);
  return ctx;
}
const ctx = launch();
ctx.hh(peer.id);
assert(ctx.no(peer.id), 'Per-member hide works in normal mode');
ctx.hh(peer.id);
assert(!ctx.no(peer.id), 'Per-member show works in normal mode');
ctx.__wtSetAllRoomMembersVisible(false);
assert(settings.onlyShowSelf, 'Helper hide uses the official persisted preference');
assert(!ctx.no(self.id) && ctx.no(peer.id));
assert(ctx.no(3), 'New member is hidden before any watcher or render');
ctx.eh(peer.id, 'offline');
assert(ctx.no(peer.id), 'Offline cleanup cannot expose a member on reconnect');
ctx.eh(peer.id, 'left');
assert(ctx.no(peer.id), 'Rejoining the room keeps members hidden');
assert(launch().no(peer.id), 'Preference is read again after restarting');
ctx.jp({ type: 'set-only-show-self', value: false });
assert(!ctx.no(peer.id) && !settings.onlyShowSelf, 'Official checkbox changes the same state');
ctx.hh(peer.id);
ctx.__wtSetAllRoomMembersVisible(false);
ctx.__wtSetAllRoomMembersVisible(true);
assert(!ctx.no(peer.id) && !ctx.no(3) && !settings.onlyShowSelf, 'Show All clears local member hides too');
callbacks.forEach(fn => fn());
assert.equal(refreshes, 7);
ctx.hh(peer.id);
ctx.__wtHelperCapture=new Map();
ctx.__wtHelperLast=new Map();
ctx.__wtPerformHelperAction('roomOnlySelf');
assert(settings.onlyShowSelf && ctx.no(3), 'Shortcut switches on the official preference');
ctx.__wtPerformHelperAction('roomOnlySelf');
assert(settings.onlyShowSelf,'Duplicate event delivery cannot undo the switch');
ctx.__wtHelperLast.clear();
ctx.__wtPerformHelperAction('roomOnlySelf');
assert(!settings.onlyShowSelf && ctx.no(peer.id), 'Shortcut mirrors the checkbox and preserves the prior per-member hide');
assert(source.includes('"data-room-cat-ui-hidden":no(o.id)?"true":"false"'));
assert(source.includes('no(o.id)?[]:'));
console.log('PASS: official persisted only-self, bulk actions, late joins, offline/online, individual visibility and render wiring');
