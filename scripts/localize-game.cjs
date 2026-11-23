const fs = require('node:fs');
const path = require('node:path');

const out = process.argv[2];
const patches = path.resolve(__dirname, '../patches');
const read = name => fs.readFileSync(path.join(patches, name), 'utf8').replace(/\r\n/g, '\n');
const script = read('helper-locale.js').replace('__WT_LOCALE_MESSAGES__', JSON.stringify(read('helper-en.txt'))).replace('__WT_LOCALE_ENDPOINT__','null');
for (const name of ['denia-blocks.html', 'denia-falling.html']) {
 const html = read(name);
 const init = 'document.addEventListener("DOMContentLoaded",()=>__wtLocale.install(document,document.documentElement.lang==="en"?"en":"zh"),{once:true});';
 fs.writeFileSync(path.join(out, name), html.replace('</head>', '<script>'+script+'\n'+init+'</script></head>'));
}
