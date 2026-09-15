import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'rent-app',
    version: '0.1.0'
  };
});

app.get('/', async (_request, reply) => {
  reply.type('text/html; charset=utf-8');
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Rent App</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f6f7f9; color: #17191c; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      section { width: min(560px, 100%); background: white; border-radius: 24px; padding: 32px; box-shadow: 0 18px 50px rgba(0,0,0,.08); }
      h1 { margin-top: 0; font-size: 32px; }
      p { line-height: 1.55; color: #555b66; }
      .status { margin-top: 20px; display: inline-block; padding: 10px 14px; border-radius: 999px; background: #ecf8ef; color: #22733a; font-weight: 600; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Rent App</h1>
        <p>Telegram Mini App для аренды и бронирования жилья.</p>
        <p>Iteration 0: приложение развернуто, backend запущен, следующий этап — Telegram Mini App и авторизация.</p>
        <span class="status">Backend is running</span>
      </section>
    </main>
  </body>
</html>`;
});

const port = Number(process.env.PORT ?? 3000);
const host = '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
