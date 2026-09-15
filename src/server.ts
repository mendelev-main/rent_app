import Fastify from 'fastify';
import { validateTelegramInitData } from './telegram-auth.js';
import { databaseHealth, upsertTelegramUser } from './database.js';

const app = Fastify({ logger: true });
const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

app.get('/health', async (_request, reply) => {
  try {
    const database = await databaseHealth();
    return { status: 'ok', service: 'rent-app', version: '0.2.0', database: database ? 'ok' : 'not_configured' };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({ status: 'degraded', service: 'rent-app', version: '0.2.0', database: 'error' });
  }
});

app.post<{ Body: { initData?: string } }>('/api/auth/telegram', async (request, reply) => {
  let telegramUser;
  try {
    telegramUser = validateTelegramInitData(request.body?.initData ?? '', botToken);
  } catch (error) {
    request.log.warn(error);
    return reply.code(401).send({ ok: false, error: 'Telegram authorization failed' });
  }

  try {
    const user = await upsertTelegramUser(telegramUser);
    return { ok: true, user };
  } catch (error) {
    request.log.error(error);
    return reply.code(503).send({ ok: false, error: 'Database unavailable' });
  }
});

app.get('/', async (_request, reply) => {
  reply.type('text/html; charset=utf-8');
  return `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><title>Rent Belarus</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--tg-theme-bg-color,#f4f6f8);color:var(--tg-theme-text-color,#15171a)}main{min-height:100vh;padding:calc(28px + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:center}.wrap{width:min(520px,100%)}.eyebrow{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:12px}h1{font-size:36px;line-height:1.05;margin:0 0 12px}.lead{font-size:17px;line-height:1.5;opacity:.68;margin:0 0 28px}.hello{display:none;margin:0 0 18px;font-weight:650}.choices{display:grid;gap:12px}button{border:0;border-radius:22px;padding:22px;text-align:left;font:inherit;cursor:pointer;background:var(--tg-theme-secondary-bg-color,#fff);color:inherit;box-shadow:0 8px 30px rgba(0,0,0,.06)}button strong{display:block;font-size:21px;margin-bottom:5px}button span{font-size:14px;opacity:.62}.primary{background:var(--tg-theme-button-color,#2481cc);color:var(--tg-theme-button-text-color,#fff)}#state{margin-top:18px;font-size:13px;opacity:.55}</style></head>
<body><main><div class="wrap"><div class="eyebrow">Rent Belarus</div><h1>Жильё в Telegram</h1><p class="lead">Найдите жильё для поездки или разместите свой объект для бронирования.</p><p id="hello" class="hello"></p><div class="choices"><button class="primary" data-mode="rent"><strong>Снять жильё</strong><span>Найти свободные варианты и забронировать</span></button><button data-mode="host"><strong>Сдать жильё</strong><span>Добавить объект и управлять календарём</span></button></div><div id="state">Проверяем запуск через Telegram…</div></div></main>
<script>const tg=window.Telegram?.WebApp,state=document.getElementById('state'),hello=document.getElementById('hello');if(tg){tg.ready();tg.expand()}async function authenticate(){if(!tg?.initData){state.textContent='Откройте приложение через Telegram-бота для авторизации.';return}try{const response=await fetch('/api/auth/telegram',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData})}),data=await response.json();if(!response.ok)throw new Error();hello.textContent='Здравствуйте, '+data.user.first_name+'!';hello.style.display='block';state.textContent='Аккаунт подключён ✓'}catch{state.textContent='Не удалось выполнить авторизацию.'}}document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{tg?.HapticFeedback?.impactOccurred('light');state.textContent=btn.dataset.mode==='rent'?'Раздел поиска жилья — следующая итерация.':'Кабинет собственника — следующая итерация.'}));authenticate();</script></body></html>`;
});

const port = Number(process.env.PORT ?? 3000);
try { await app.listen({ port, host: '0.0.0.0' }); }
catch (error) { app.log.error(error); process.exit(1); }
