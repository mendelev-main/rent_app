# MVP Specification

## 1. Product
Rent App — Telegram Mini App + Telegram Bot для краткосрочной аренды жилья между собственниками и гостями.

## 2. Роли
Один Telegram-пользователь может быть гостем и собственником. **Снять / Сдать** — навигационные сценарии, а не постоянная роль.

## 3. Авторизация — реализовано
Telegram Mini App передаёт `Telegram.WebApp.initData` Railway backend. Backend проверяет подпись и свежесть `auth_date`; `initDataUnsafe` не является доверенным источником. Пользователь создаётся/обновляется в Supabase по `telegram_user_id`, внутренний id — `users.id` UUID. Supabase Auth в MVP не используется. Рабочая цепочка: `Telegram → Mini App → Railway → validate initData → Supabase users`.

## 4. Сценарий собственника

### 4.1 Модель объекта — реализовано
`properties` связан с `users` через `owner_id`. Статусы: `draft`, `published`, `archived`. Поля: название, город, адрес, описание, цена/сутки, BYN, гости, удобства, правила, заезд/выезд. Цена > 0, гости 1–50.

### 4.2 Фотографии — upload flow реализован
`property_photos` хранит метаданные, Supabase Storage bucket `property-photos` — файлы. JPEG/PNG/WebP, до 10 MB. Есть сортировка и признак обложки.

Фотография выбирается в Mini App и отправляется в Railway backend вместе с Telegram `initData`. Backend сначала проверяет Telegram-пользователя и принадлежность объекта, затем загружает файл в Storage по уникальному пути `<property-id>/<uuid>.<ext>` и только после успешной загрузки создаёт запись `property_photos`. Клиент не получает `SUPABASE_SECRET_KEY`.

Для server-side Storage Railway должен иметь `SUPABASE_URL` и `SUPABASE_SECRET_KEY`. Secret key хранится только в Railway Variables и никогда не коммитится. Публичный bucket используется только для чтения фотографий опубликованных/отображаемых объектов; запись выполняет доверенный backend.

### 4.3 Безопасность
`users`, `properties`, `property_photos` имеют RLS без публичных policies. Mini App работает через Railway. Каждый owner endpoint валидирует Telegram `initData`, получает серверный `users.id`; клиентский `owner_id` не принимается. Photo upload также owner-scoped: загрузить фото в чужой объект нельзя.

### 4.4 Owner Property API — реализовано
- `POST /api/owner/properties/list` — свои объекты.
- `POST /api/owner/properties` — новый `draft`.
- `POST /api/owner/properties/:id/get` — свой объект + фотографии.
- `POST /api/owner/properties/:id` — редактирование своего объекта.
- `POST /api/owner/properties/:id/photos` — загрузка фотографии своего объекта.

### 4.5 UI «Сдать жильё» — создание, редактирование и фото реализованы
После **«Сдать жильё»** пользователь попадает в **«Мои объекты»**. Можно создать черновик или открыть существующий объект. Форма содержит основные данные и удобства. После первого сохранения появляется блок **«Фотографии»**. Пользователь выбирает JPEG/PNG/WebP и нажимает **«Добавить фотографию»**; после успешной загрузки изображение появляется в галерее объекта.

Следующая итерация: управление фотографиями (удаление/обложка/порядок) и публикация.

## 5. Сценарий гостя
Опубликованные объекты; город, даты, гости; только доступные варианты; карточка; заявка; статусы; разрешённое общение через Telegram.

## 6. Бронирование
Статусы: `pending`, `confirmed`, `rejected`, `cancelled`, `completed`. Заявка начинается `pending`; `confirmed` блокирует даты.

## 7. Календарь
Источник истины — Rent App backend/database. Занятость: confirmed booking, ручная блокировка или импорт внешнего календаря. Финальная защита от двойного бронирования выполняется сервером транзакционно, не UI.

## 8. Telegram Bot
Уведомления MVP: новая заявка, подтверждение, отклонение, отмена. Бот и Mini App используют одну модель пользователя.

## 9. Общение
Встроенного чата в первом MVP нет. Разрешённое действие «Написать» ведёт в Telegram; модель должна позволить позже скрывать контакт/проксировать чат.

## 10. Внешние календари
Предусмотрен iCalendar `.ics`: источники, импорт занятых периодов, экспорт Rent App, журнал синхронизации, дедупликация. Avito/Kufar — адаптеры после проверки актуальных возможностей.

## 11. Инфраструктура
GitHub `mendelev-main/rent_app`, production `main`; Railway — Fastify + Mini App и auto-deploy; Supabase — PostgreSQL + Storage; Railway подключён через Session pooler `DATABASE_URL`; Telegram — идентификация/уведомления; секреты только server-side.

## 12. Не входит в первый MVP
Онлайн-оплата, выплаты/комиссия, свой realtime-чат, отзывы/рейтинги, сложная модерация, динамические цены, промокоды, полноценная карта, юридическая автоматизация, профессиональный PMS/channel manager.

## 13. Definition of MVP
`Telegram → auth → собственник создаёт/публикует объект → гость находит → даты → заявка → уведомление → подтверждение → блокировка дат → уведомление гостю`.

## 14. Текущий прогресс
- [x] GitHub + Railway production.
- [x] Telegram Mini App + server-side auth.
- [x] Supabase PostgreSQL + users.
- [x] `properties` + `property_photos` + Storage bucket.
- [x] Owner Property API.
- [x] UI «Мои объекты», создание и редактирование.
- [x] Backend/UI flow загрузки фотографий.
- [ ] Настроить `SUPABASE_SECRET_KEY` в Railway и подтвердить production upload.
- [ ] Управление фотографиями: удаление, обложка, порядок.
- [ ] Публикация объекта.
- [ ] Поиск и карточка объекта для гостя.
- [ ] Бронирования и календарь.
- [ ] Telegram-уведомления по бронированиям.
