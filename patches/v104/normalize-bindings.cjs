const assert = require('node:assert/strict');
const { babelParse, traverse } = require('playwright/lib/transform/babelBundle');

function bindingIdentifiers(source, filename) {
  const identifiers = new Map();
  traverse(babelParse(source, filename, true), {
    Identifier(p) {
      const parent = p.parent;
      if ((parent.type === 'ObjectProperty' && p.key === 'key' && !parent.computed) ||
          (parent.type === 'ExportSpecifier' && p.key === 'exported') ||
          (parent.type === 'ImportSpecifier' && p.key === 'imported')) return;
      const binding = p.scope.getBinding(p.node.name);
      if (!p.isReferencedIdentifier() && !(binding && p.isBindingIdentifier())) return;
      const shorthand = parent.type === 'ObjectProperty' && parent.shorthand ||
        parent.type === 'AssignmentPattern' && p.parentPath.parent.type === 'ObjectProperty' &&
        p.parentPath.parent.shorthand && p.key === 'left';
      const importName = parent.type === 'ImportSpecifier' && parent.imported.start === p.node.start;
      const exportName = parent.type === 'ExportSpecifier' && parent.exported.start === p.node.start;
      identifiers.set(p.node.start, {
        name: p.node.name, end: p.node.end, declaration: binding?.identifier.start,
        shorthand, importName, exportName
      });
    }
  });
  return identifiers;
}

// Normalize the minified names needed by the shared patch anchors. This changes
// lexical names only, preserving property keys and the public module interface.
function normalize(source, filename, names, audit = true) {
  const before = bindingIdentifiers(source, filename);
  let out = '', cursor = 0;
  const offsets = new Map();
  for (const [start, id] of [...before].sort((a, b) => a[0] - b[0])) {
    const name = names[id.declaration];
    out += source.slice(cursor, start);
    if (name && name !== id.name) {
      if (id.shorthand) out += id.name + ':';
      if (id.importName) out += id.name + ' as ';
      offsets.set(start, out.length);
      out += name;
      if (id.exportName) out += ' as ' + id.name;
    } else {
      offsets.set(start, out.length);
      out += source.slice(start, id.end);
    }
    cursor = id.end;
  }
  out += source.slice(cursor);
  const changed = [];
  const after = bindingIdentifiers(out, filename);
  for (const [start, id] of before) {
    const location = offsets.get(start);
    const expected = offsets.get(id.declaration);
    assert(after.has(location), filename + ': identifier disappeared at ' + start);
    const actual = after.get(location).declaration;
    if (expected !== actual) changed.push({ start, id, actual: [...offsets].find(([, at]) => at === actual)?.[0] });
  }
  if (audit) assert.equal(changed.length, 0, filename + ': lexical binding changed');
  return audit ? out : { out, changed };
}
module.exports = normalize;
