# Deployment

## Platform

Initial production platform: Railway.

## GitHub integration

Repository: `mendelev-main/rent_app`

Production branch: `main`.

Railway should be connected directly to this repository. A new commit on `main` triggers a build/deploy.

## Build contract

- Install: `npm install`
- Build: `npm run build`
- Start: `npm run start`
- Health check: `/health`
- HTTP listener uses Railway-provided `PORT` and binds to `0.0.0.0`.

`railway.json` is committed to the repository and defines the initial build/start/health configuration.

## Variables

Production secrets are configured only in Railway Variables.

Initial planned variables:

- `TELEGRAM_BOT_TOKEN`
- `DATABASE_URL`
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`

`PORT` is normally supplied by Railway.

Never commit real secret values. `.env.example` contains variable names only.

## First Railway setup

1. Create a new Railway project.
2. Choose **Deploy from GitHub repo**.
3. Select `mendelev-main/rent_app`.
4. Deploy the `main` branch.
5. Generate a public domain for the service.
6. Open `/health` and confirm the response has `status: ok`.
7. Add production variables as each integration is introduced.

## CI/CD evolution

Iteration 0 uses Railway's GitHub auto-deploy as CD.

Before substantial application logic lands, GitHub Actions should be added for:

- dependency install;
- TypeScript typecheck;
- tests;
- production build.

Then we can protect `main`/use pull requests so production deploy happens only after checks pass.

## Rollback

Railway deployment history should be used for operational rollback. Git remains the source of truth for application code.
