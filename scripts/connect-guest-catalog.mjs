import fs from 'node:fs';

const file = new URL('../dist/src/server.js', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

if (!source.includes("./guest-catalog.js")) {
  const marker = "import { validateTelegramInitData";
  const at = source.indexOf(marker);
  if (at < 0) throw new Error('Cannot find server import marker');
  source = source.slice(0, at) + "import { registerGuestCatalog } from './guest-catalog.js';\n" + source.slice(at);
}

if (!source.includes('registerGuestCatalog(app, supabaseUrl);')) {
  const marker = "app.get('/',";
  const at = source.indexOf(marker);
  if (at < 0) throw new Error('Cannot find root route marker');
  source = source.slice(0, at) + 'registerGuestCatalog(app, supabaseUrl);\n' + source.slice(at);
}

const oldHandler = "$('rent').onclick=()=>$('state').textContent='Поиск жилья — следующая итерация.';";
const newHandler = "$('rent').onclick=()=>{location.href='/guest'};";
if (source.includes(oldHandler)) source = source.replace(oldHandler, newHandler);
else if (!source.includes("location.href='/guest'")) throw new Error('Cannot find guest button handler');

source = source.replace("version:'0.8.0'", "version:'0.9.0'");
fs.writeFileSync(file, source);
console.log('Guest catalog connected to compiled server.');
