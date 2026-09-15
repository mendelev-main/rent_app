import type { FastifyInstance } from 'fastify';
import { getPublishedProperty, listPublishedProperties, listPublishedPropertyPhotos } from './database.js';

export function registerGuestCatalog(app: FastifyInstance, supabaseUrl: string) {
  const photoUrl = (path: string) => `${supabaseUrl}/storage/v1/object/public/property-photos/${path}`;

  app.get<{ Querystring: { city?: string; guests?: string } }>('/api/catalog', async (request, reply) => {
    try {
      const guests = request.query.guests ? Number(request.query.guests) : undefined;
      if (guests !== undefined && (!Number.isInteger(guests) || guests < 1 || guests > 50)) {
        return reply.code(400).send({ ok: false, error: 'Некорректное количество гостей' });
      }
      const properties = await listPublishedProperties(request.query.city, guests);
      return {
        ok: true,
        properties: properties.map(({ owner_id: _ownerId, cover_path, ...property }) => ({
          ...property,
          cover_url: cover_path ? photoUrl(cover_path) : null
        }))
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ ok: false, error: 'Не удалось загрузить объявления' });
    }
  });

  app.get<{ Params: { id: string } }>('/api/catalog/:id', async (request, reply) => {
    try {
      const property = await getPublishedProperty(request.params.id);
      if (!property) return reply.code(404).send({ ok: false, error: 'Объявление не найдено' });
      const photos = await listPublishedPropertyPhotos(property.id);
      const { owner_id: _ownerId, ...safeProperty } = property;
      return {
        ok: true,
        property: safeProperty,
        photos: photos.map(photo => ({
          id: photo.id,
          sort_order: photo.sort_order,
          is_cover: photo.is_cover,
          url: photoUrl(photo.storage_path)
        }))
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ ok: false, error: 'Не удалось загрузить объявление' });
    }
  });

  app.get('/guest', async (_request, reply) => {
    reply.type('text/html; charset=utf-8');
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Снять жильё</title><script src="https://telegram.org/js/telegram-web-app.js"></script><style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--tg-theme-bg-color,#f4f6f8);color:var(--tg-theme-text-color,#15171a)}main{max-width:600px;margin:auto;padding:calc(18px + env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom))}button,input{font:inherit}.top{display:flex;align-items:center;gap:12px;margin-bottom:18px}.back{border:0;border-radius:14px;padding:11px 14px;background:var(--tg-theme-secondary-bg-color,#fff);color:inherit}h1{font-size:30px;margin:0}.filters{background:var(--tg-theme-secondary-bg-color,#fff);border-radius:22px;padding:14px;margin-bottom:18px}.filterRow{display:grid;grid-template-columns:1fr 110px;gap:8px}.filters input{width:100%;border:0;outline:0;border-radius:14px;padding:13px;background:var(--tg-theme-bg-color,#f4f6f8);color:inherit}.search{width:100%;margin-top:9px;border:0;border-radius:15px;padding:14px;font-weight:750;background:var(--tg-theme-button-color,#2481cc);color:var(--tg-theme-button-text-color,#fff)}.list{display:grid;gap:16px}.card{overflow:hidden;border-radius:22px;background:var(--tg-theme-secondary-bg-color,#fff);cursor:pointer}.card img,.placeholder{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.placeholder{display:grid;place-items:center;background:rgba(128,128,128,.12);font-size:42px}.body{padding:15px}.title{font-size:20px;font-weight:760}.meta{opacity:.65;margin-top:5px}.price{font-size:18px;font-weight:750;margin-top:9px}.state{opacity:.65;text-align:center;padding:24px}.detail{display:none}.gallery{display:flex;overflow:auto;scroll-snap-type:x mandatory;gap:8px;margin:0 -16px 18px;padding:0 16px}.gallery img{width:88%;flex:none;aspect-ratio:4/3;object-fit:cover;border-radius:20px;scroll-snap-align:start}.detailBox{background:var(--tg-theme-secondary-bg-color,#fff);border-radius:20px;padding:17px;margin:12px 0}.chips{display:flex;flex-wrap:wrap;gap:7px}.chip{padding:8px 11px;border-radius:999px;background:rgba(128,128,128,.13);font-size:13px}.detailPrice{font-size:24px;font-weight:800}.detail p{line-height:1.5}.label{font-size:13px;opacity:.6;margin-bottom:5px}
</style></head><body><main><section id="catalog"><div class="top"><button class="back" id="home">‹ Назад</button><h1>Снять жильё</h1></div><div class="filters"><div class="filterRow"><input id="city" placeholder="Город"><input id="guests" type="number" min="1" max="50" placeholder="Гостей"></div><button class="search" id="search">Найти жильё</button></div><div id="list" class="list"><div class="state">Загружаем объявления…</div></div></section><section id="detail" class="detail"><div class="top"><button class="back" id="back">‹ К списку</button></div><div id="detailContent"></div></section></main><script>
const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand()}const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function json(url){const r=await fetch(url),d=await r.json();if(!r.ok)throw new Error(d.error||'Ошибка');return d}
async function load(){const q=new URLSearchParams();if($('city').value.trim())q.set('city',$('city').value.trim());if($('guests').value)q.set('guests',$('guests').value);$('list').innerHTML='<div class="state">Ищем жильё…</div>';try{const d=await json('/api/catalog?'+q);$('list').innerHTML=d.properties.length?d.properties.map(p=>'<article class="card" data-id="'+p.id+'">'+(p.cover_url?'<img src="'+p.cover_url+'" alt="">':'<div class="placeholder">⌂</div>')+'<div class="body"><div class="title">'+esc(p.title)+'</div><div class="meta">'+esc(p.city)+' · до '+p.max_guests+' гостей</div><div class="price">'+Number(p.price_per_night).toFixed(2)+' BYN / ночь</div></div></article>').join(''):'<div class="state">По вашему запросу пока нет опубликованного жилья.</div>';document.querySelectorAll('[data-id]').forEach(x=>x.onclick=()=>openDetail(x.dataset.id))}catch(e){$('list').innerHTML='<div class="state">'+esc(e.message)+'</div>'}}
async function openDetail(id){try{const d=await json('/api/catalog/'+encodeURIComponent(id)),p=d.property,photos=d.photos||[];$('detailContent').innerHTML='<div class="gallery">'+photos.map(x=>'<img src="'+x.url+'" alt="Фото жилья">').join('')+'</div><h1>'+esc(p.title)+'</h1><div class="meta">'+esc(p.city)+' · до '+p.max_guests+' гостей</div><div class="detailBox"><div class="detailPrice">'+Number(p.price_per_night).toFixed(2)+' BYN / ночь</div></div>'+(p.description?'<div class="detailBox"><div class="label">Описание</div><p>'+esc(p.description)+'</p></div>':'')+((p.amenities||[]).length?'<div class="detailBox"><div class="label">Удобства</div><div class="chips">'+p.amenities.map(a=>'<span class="chip">'+esc(a)+'</span>').join('')+'</div></div>':'')+'<div class="detailBox"><div class="label">Заезд и выезд</div><div>'+(p.check_in_time?'Заезд с '+esc(String(p.check_in_time).slice(0,5)):'Время заезда уточняется')+'</div><div>'+(p.check_out_time?'Выезд до '+esc(String(p.check_out_time).slice(0,5)):'Время выезда уточняется')+'</div></div>'+(p.house_rules?'<div class="detailBox"><div class="label">Правила проживания</div><p>'+esc(p.house_rules)+'</p></div>':'');$('catalog').style.display='none';$('detail').style.display='block';scrollTo(0,0)}catch(e){tg?.showAlert?.(e.message)}}
$('search').onclick=load;$('home').onclick=()=>history.back();$('back').onclick=()=>{$('detail').style.display='none';$('catalog').style.display='block';scrollTo(0,0)};load();
</script></body></html>`;
  });
}
