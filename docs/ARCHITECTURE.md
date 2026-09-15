# Architecture

## Target architecture for MVP

```text
Telegram Client
   │
   ├── Mini App (React/Vite)
   │      │
   │      └── HTTPS API
   │
   └── Telegram Bot
          │ webhook
          ▼
      Node.js API (Fastify)
          │
          ├── Auth / Telegram initData validation
          ├── Users
          ├── Listings
          ├── Availability
          ├── Bookings
          ├── Calendar Sync
          └── Bot notifications
          │
          ▼
      PostgreSQL

Photos -> object storage
```

## Repository layout

```text
apps/
  web/
  api/
packages/
  shared/
```

For the first deploy, the repository may be bootstrapped with a minimal server and static Mini App build. We intentionally keep deployment simple before splitting into additional services.

## Trust boundaries

### Telegram auth

The browser is not trusted to self-assert identity.

The frontend sends raw Telegram `initData` to the API. The API validates it server-side before creating a session/user context.

### Booking availability

The client calendar is informative only. Every booking mutation must re-check conflicts server-side.

### External calendars

Imported iCal events are normalized into external calendar blocks. Core booking entities do not depend on Avito/Kufar-specific fields.

## Deployment

Initial production deployment runs on Railway from GitHub branch `main`.

Required properties:

- automatic deploy after change to `main`;
- health endpoint for deployment checks;
- secrets only in Railway Variables;
- no production secrets committed to repository;
- `.env.example` contains names only / safe placeholders;
- application listens on the `PORT` supplied by Railway.

## Database

PostgreSQL is the canonical datastore.

Initial domain model:

- users
- properties
- property_photos
- availability_blocks
- bookings
- external_calendars
- external_calendar_events

Database schema/migrations are introduced before persistence-dependent product flows are implemented.

## Environments

Initial phase:

- local development
- production on Railway

A separate staging environment will be introduced once destructive schema changes or production traffic make it useful.

## CI/CD principle

`main` must remain deployable.

Before larger feature work we will introduce automated checks (typecheck/tests/build) so invalid commits do not silently become production releases.
