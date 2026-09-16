import fs from 'node:fs';
const serverPath='dist/src/server.js';
let s=fs.readFileSync(serverPath,'utf8');
if(!s.includes("from './owner-bookings.js'"))s=s.replace("import { registerGuestCatalog } from './guest-catalog.js';","import { registerGuestCatalog } from './guest-catalog.js';\nimport { registerOwnerBookings } from './owner-bookings.js';");
if(!s.includes("from './telegram-contact.js'"))s=s.replace("import { registerOwnerBookings } from './owner-bookings.js';","import { registerOwnerBookings } from './owner-bookings.js';\nimport { registerTelegramContact, configureTelegramWebhook } from './telegram-contact.js';");
if(!s.includes('registerOwnerBookings(app, botToken);'))s=s.replace('registerGuestCatalog(app, supabaseUrl, botToken);','registerGuestCatalog(app, supabaseUrl, botToken);\nregisterOwnerBookings(app, botToken);');
if(!s.includes('registerTelegramContact(app, botToken);'))s=s.replace('registerOwnerBookings(app, botToken);','registerOwnerBookings(app, botToken);\nregisterTelegramContact(app, botToken);');
s=s.replace('<button class="add" id="newProperty">Добавить объект</button>','<button class="add" id="ownerBookings" type="button">Заявки на бронирование</button><button class="add" id="newProperty">Добавить объект</button>');
s=s.replace("$('newProperty').onclick=()=>{reset();show('editor')}","$('ownerBookings').onclick=()=>{location.href='/owner-bookings'};$('newProperty').onclick=()=>{reset();show('editor')}");
if(!s.includes('configureTelegramWebhook(botToken'))s=s.replace("app.listen({port,host:'0.0.0.0'})", "app.listen({port,host:'0.0.0.0'}).then(()=>configureTelegramWebhook(botToken,process.env.PUBLIC_APP_URL??'',app.log))");
fs.writeFileSync(serverPath,s);

const guestPath='dist/src/guest-catalog.js';
let g=fs.readFileSync(guestPath,'utf8');
const marker='async function book(){';
if(!g.includes('async function ensureTelegramPhone()')&&g.includes(marker)){
 const helper=`async function ensureTelegramPhone(){try{const check=await json('/api/profile/phone',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg?.initData||''})});if(check.phone_number)return true;if(!tg||typeof tg.requestContact!=='function'){throw new Error('Для бронирования нужен номер телефона. Обновите Telegram и попробуйте снова.')}$('bookState').textContent='Поделитесь номером телефона через Telegram.';const granted=await new Promise(resolve=>tg.requestContact(resolve));if(!granted){$('bookState').textContent='Для отправки заявки необходимо поделиться номером телефона.';return false}for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,500));const d=await json('/api/profile/phone',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg?.initData||''})});if(d.phone_number){$('bookState').textContent='Номер телефона подтверждён ✓';return true}}throw new Error('Telegram передал контакт, но номер ещё не получен. Попробуйте ещё раз через несколько секунд.')}catch(e){$('bookState').textContent=e.message||'Не удалось получить номер телефона.';return false}}`;
 g=g.replace(marker,helper+marker);
 g=g.replace("if(rangeBusy(selectedIn,selectedOut)){$('bookState').textContent='В выбранном периоде есть уже забронированные даты.';return}btn.disabled=true;", "if(rangeBusy(selectedIn,selectedOut)){$('bookState').textContent='В выбранном периоде есть уже забронированные даты.';return}if(!(await ensureTelegramPhone()))return;btn.disabled=true;");
}
fs.writeFileSync(guestPath,g);
