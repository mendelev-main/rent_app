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

### 4.2 Фотографии — production upload подтверждён
`property_photos` хранит метаданные, Supabase Storage bucket `property-photos` — файлы. JPEG/PNG/WebP, до 10 MB. Есть сортировка и признак обложки. Mini App отправляет файл в Railway с Telegram `initData`; backend проверяет пользователя и владельца объекта, загружает по уникальному пути и создаёт метаданные. `SUPABASE_SECRET_KEY` существует только в Railway. Production-загрузка пользователем успешно проверена.

### 4.3 Безопасность
`users`, `properties`, `property_photos` имеют RLS без публичных policies. Mini App работает через Railway. Каждый owner endpoint валидирует Telegram `initData`, получает серверный `users.id`; клиентский `owner_id` не принимается. Photo upload owner-scoped.

### 4.4 Owner Property API — реализовано
- `POST /api/owner/properties/list` — свои объекты.
- `POST /api/owner/properties` — новый `draft`.
- `POST /api/owner/properties/:id/get` — свой объект + фотографии.
- `POST /api/owner/properties/:id` — редактирование.
- `POST /api/owner/properties/:id/photos` — загрузка фото.

### 4.5 UI «Сдать жильё»
Реализованы список своих объектов, создание/редактирование черновика и загрузка фотографий. Следующая итерация: управление фото и публикация.

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

## 12. UI / UX — обязательное требование
Дизайн должен быть понятным, последовательным и выполненным в одном стиле на всех экранах. Каждая новая UI-функция проходит обязательный Design Review до отметки как завершённая. Полные критерии находятся в `docs/UI_DESIGN_REQUIREMENTS.md` и являются частью требований MVP, а не рекомендацией.

Ключевые требования: единая визуальная система; mobile-first для Telegram; ясное главное действие; понятные loading/empty/error/success состояния; сохранение введённых данных при ошибках; безопасные destructive actions; Telegram light/dark theme compatibility; критичные бизнес-проверки дублируются backend.

## 13. Не входит в первый MVP
Онлайн-оплата, выплаты/комиссия, свой realtime-чат, отзывы/рейтинги, сложная модерация, динамические цены, промокоды, полноценная карта, юридическая автоматизация, профессиональный PMS/channel manager.

## 14. Definition of MVP
`Telegram → auth → собственник создаёт/публикует объект → гость находит → даты → заявка → уведомление → подтверждение → блокировка дат → уведомление гостю`.

## 15. Текущий прогресс
- [x] GitHub + Railway production.
- [x] Telegram Mini App + server-side auth.
- [x] Supabase PostgreSQL + users.
- [x] `properties` + `property_photos` + Storage bucket.
- [x] Owner Property API.
- [x] UI «Мои объекты», создание и редактирование.
- [x] Production-загрузка фотографий.
- [x] UI Design Review требования закреплены.
- [ ] Управление фотографиями: удаление, обложка, порядок.
- [ ] Публикация объекта.
- [ ] Поиск и карточка объекта для гостя.
- [ ] Бронирования и календарь.
- [ ] Telegram-уведомления по бронированиям.
