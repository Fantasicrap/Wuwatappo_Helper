const target = process.env.WUWA_TEST_TARGET || require('../package.json').releaseVersion;
const v104 = target === '1.0.4.1';
const assets = new Map([
  ['index-pp8VWaUF.js', 'index-BFg5ADH5.js'],
  ['index-CuzHFfJW.js', 'index-CM6qA69G.js'],
  ['index-CiT_jZa7.js', 'index-BIzzuO5B.js'],
  ['switchDisplayMonitor-B50jXMGD.js', 'switchDisplayMonitor-Dqub4lRn.js'],
  ['index-BEWn23m-.js', 'index-inPQAlmI.js']
]);
function fixturePath(filename) {
  if (!v104) return filename;
  const file = filename.replace(/\\/g, '/');
  if (!/dist\/(?:migration-1\.0\.3\.4|upstream-1\.0\.3)(?:\/|$)/.test(file)) return filename;
  return file.replace('dist/migration-1.0.3.4', 'dist/migration-1.0.4.1')
    .replace('dist/upstream-1.0.3', 'dist/upstream-1.0.4')
    .replace(/[^/]+$/, name => assets.get(name) ?? name);
}
module.exports = { fixturePath, target, v104 };
