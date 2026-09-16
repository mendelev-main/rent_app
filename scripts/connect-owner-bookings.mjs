import fs from 'node:fs';
const path='dist/src/server.js';
let s=fs.readFileSync(path,'utf8');
if(!s.includes("from './owner-bookings.js'"))s=s.replace("import { registerGuestCatalog } from './guest-catalog.js';","import { registerGuestCatalog } from './guest-catalog.js';\nimport { registerOwnerBookings } from './owner-bookings.js';");
if(!s.includes('registerOwnerBookings(app, botToken);'))s=s.replace('registerGuestCatalog(app, supabaseUrl, botToken);','registerGuestCatalog(app, supabaseUrl, botToken);\nregisterOwnerBookings(app, botToken);');
s=s.replace('<button class="add" id="newProperty">Добавить объект</button>','<button class="add" id="ownerBookings" type="button">Заявки на бронирование</button><button class="add" id="newProperty">Добавить объект</button>');
s=s.replace("$('newProperty').onclick=()=>{reset();show('editor')}","$('ownerBookings').onclick=()=>{location.href='/owner-bookings'};$('newProperty').onclick=()=>{reset();show('editor')}");
fs.writeFileSync(path,s);
