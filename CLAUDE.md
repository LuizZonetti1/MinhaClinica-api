# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

REST backend for **Minha Clínica**, a multi-tenant clinic-management SaaS (Express 5 + TypeScript + Prisma + PostgreSQL). Every tenant is a **clinic**; users have one of four roles: `ADMIN` (clinic owner), `RECEPTIONIST`, `PROFESSIONAL` (health provider), `PATIENT`. The React SPA that consumes this API lives in a **separate repository** (`MinhaClinica-Interface`).

Codebase language is **Portuguese**: identifiers, comments, commit messages, and user-facing strings are pt-BR. Match this when writing code. Both `yarn.lock` and `package-lock.json` are committed; `yarn.lock` is the more actively maintained one.

## Commands

```bash
npm run dev              # tsx watch — dev server on PORT (default 3001)
npm run build            # tsc → dist/
npm start                # run compiled dist/server.js
npm test                 # vitest run (all tests)
npm run test:watch       # vitest watch mode
npm run test:coverage    # vitest with v8 coverage
npx vitest run path/to/file.test.ts   # run a single test file
npx vitest run -t "nome do teste"     # run tests matching a name
npm run lint             # biome lint src/
npm run format           # biome format --write src/
npm run check            # biome check --apply src/ (lint + format + organize imports)
npm run db:generate      # prisma generate → generated/prisma (run after schema changes)
npm run db:migrate       # prisma migrate dev
npm run db:reset         # prisma migrate reset (drops + reseeds)
npm run db:seed          # tsx src/database/seed.ts
npm run db:studio        # prisma studio
```

Biome enforces: 2-space indent, 100-char lines, double quotes, semicolons, trailing commas everywhere.

## Architecture

Strict layered flow, one concern per layer — follow it when adding endpoints:

```
routes/*.routes.ts → controller/*Controller.ts → services/**/* → repository/*Repository.ts → database/prisma.ts
```

- **routes** — declare paths and wire middleware chains: `authMiddleware` → `checkRole(...)` → `validate(schema)` → controller method. `routes/index.ts` mounts every router under `/api`. Route files carry doc comments describing each endpoint's method, path, and allowed roles — keep them accurate.
- **middlewares/auth.ts** — `authMiddleware` verifies the JWT and populates `req.userId`, `req.clinicId`, `req.userRole`, `req.userRoles`, `req.userName` (declared via a global Express `Request` augmentation). It also does **implicit token revocation**: tokens issued before `user.passwordChangedAt` are rejected. `checkRole(...roles)` gates by role; `tempRegistrationAuth` guards the multi-step registration flow using a separate temp token.
- **middlewares/validation.ts** — `validate(schema)` runs a Yup schema from `schemas/`, replaces `req.body` with the stripped/validated value, and returns `400` with a `details[]` array of field errors.
- **controller** — thin: read `req.userId`/`req.clinicId`/params, instantiate the relevant service, call `.execute(...)`, send JSON. Wrap in try/catch and delegate to `handleControllerError(res, error, msg)` from `utils/controllerUtils.ts`.
- **services** — business logic, grouped by domain folder under `services/` (e.g. `appointments/`, `auth/`, `documents/`). Convention: **one class per use-case** with a single `execute()` method (e.g. `CreateAppointmentService`, `PatchAppointmentStatusService`).
- **repository** — all Prisma access lives here; services call repositories rather than touching `prisma` directly.

The global error handler in `app.ts` maps thrown errors to responses: `err.statusCode` drives the status, and `5xx` errors are logged and returned as a generic message (details are never leaked to the client).

## Cross-cutting concerns

- **Multi-tenancy is enforced in code, not the DB.** Nearly every query must be scoped by `clinicId` taken from the token (`req.clinicId`). When adding queries, always filter by clinic to prevent cross-tenant data leaks. `PATIENT` is the exception — patients are global users who can interact with multiple clinics.
- **Unified account (one account per e-mail, many clinics).** A `User` has no `clinicId`: staff membership lives in `ClinicMembership` (roles per clinic) and patient identity in `Patient`. `req.clinicId` is the session's **active clinic** (switch via `POST /auth/session/clinic`); `authMiddleware` re-derives `req.userRoles` from the DB on every request (`services/auth/sessionContext.ts`), so never trust roles from the JWT and never use `User.role` for authorization (it is just the account's origin). To filter staff of a clinic use `activeMemberOf`/`memberOf` (`repository/membershipRepository.ts`); for appointment/document access use `resolveAppointmentRole` (`utils/appointmentAccess.ts`). Team invites are `ClinicInvite` rows (`services/invites/`), never pending `User` rows. Removing staff ends the membership and only anonymizes the account if nothing else is left; the no-show block is `Patient.blockedAt`.
- **Prisma client is generated to `generated/prisma`** (not the default `node_modules/.prisma`) and instantiated with the `@prisma/adapter-pg` driver adapter in `database/prisma.ts`. Import `prisma` from there. After editing `prisma/schema.prisma`, run `npm run db:generate`. The same schema also emits ERD SVGs to `docs/erd/`.
- **Enums live in two synced places:** `prisma/schema.prisma` and `src/types/enums.ts` (as `as const` objects + derived types). Update both together. Key domains: appointment status/type/channel, document type/status, transaction/payment, notification type/channel/status.
- **Scheduled jobs** — `server.ts` registers node-cron jobs on boot: appointment reminders (`services/notifications/reminderCronService`) and birthday greetings (`birthdayCronService`).
- **Uploads** go to Cloudinary via `multer` + `multer-storage-cloudinary` (`config/cloudinary.ts`, `config/multer.ts`, `middlewares/upload.ts`).
- **Email** — nodemailer over Gmail SMTP in development, Brevo API in production (see `services/email/`), selected by env vars.
- **Security** — `helmet`, `cors` restricted to `FRONTEND_URL`, `express-rate-limit`, bcrypt hashing, JSON body limited to 100kb. Auth uses short-lived access tokens (`JWT_ACCESS_SECRET`) plus temp registration tokens (`JWT_TEMP_SECRET`); optional 2FA via `speakeasy`/`qrcode`.
- TypeScript is `strict: false` with `noEmitOnError: false`; imports are relative (no path aliases).

## Environment

Copy `.env.example` to `.env`. Key vars: `DATABASE_URL`, `PORT`, `NODE_ENV`, `JWT_ACCESS_SECRET`, `JWT_TEMP_SECRET`, `FRONTEND_URL`, `APP_URL`, Gmail (`GMAIL_USER`/`GMAIL_APP_PASSWORD`) and Brevo (`BREVO_API_KEY`/`EMAIL_FROM`) email settings, plus Cloudinary credentials.

## Reference docs

`docs/` holds extensive functional/technical documentation: `ACOES-POR-PERFIL-USUARIO.md` (permission matrix per role), `CREDENCIAIS-TESTE.md` (seed logins), `guia-desenvolvimento-backend.md`, `guia-schemas-yup.md`, `guia-tokens-autenticacao.md`, `database-schema-explanation.md`, `fluxo-cadastro-etapas.md` (registration flow).
