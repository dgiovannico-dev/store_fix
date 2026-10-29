# Auth — Auth.js + Postgres (OSS)

## Sessioni

- Provider: **Credentials** (email/password).
- Cookie `authjs.session-token` **httpOnly**, `SameSite=Lax`.
- Riga `Session` in Postgres creata al login; **logout** la cancella (revoke immediato).
- Claim sessione: `tenantId`, `role`, `membershipId` (Membership attiva).
- UI logout: **`POST /logout`** (o Auth.js `POST /api/auth/signout`) — revoke DB + `Clear-Site-Data` + redirect `/login`. Risposte dinamiche: `Cache-Control: no-store` (middleware). `POST /logout` passa dal gate CSRF Origin/Sec-Fetch-Site (come le API mutanti) + rate limit `logout:{ip}` 20/15 min → **429**.

## Conferma email (T1.13)

Dopo signup HQ viene inviata email `email_verify` (Mailpit in dev).  
Link: `/verify-email?token=…&email=…` — token SHA-256 in `VerificationToken`, TTL **24h**.

## Magic link (opzionale)

Auth.js supporta il provider **Email** sullo stesso SMTP (`SMTP_*` / Mailpit).  
Non è abilitato di default in MVP (Credentials + conferma email bastano per HQ).  
Per attivarlo in un fork: aggiungere `Email({ server: { host, port }, from })` in `src/auth.ts` e documentare `AUTH_SECRET` + deliverability SMTP.

## Rate limit

Login e signup: limit in-process (`src/infrastructure/rate-limit.ts`) — 10 req / 15 min per IP chiave.  
In multi-replica sostituire con store condiviso (Postgres/Valkey) senza SaaS.
