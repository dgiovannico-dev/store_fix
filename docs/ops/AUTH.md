# Auth — Auth.js + Postgres (OSS)

## Sessioni

- Provider: **Credentials** (email/password).
- Cookie `authjs.session-token` **httpOnly**, `SameSite=Lax`.
- Strategy: **JWT** (Auth.js) + riga `Session` in Postgres (token in JWT) per revoke — AC T1.11.
- Claim sessione: `tenantId`, `role`, `membershipId` (Membership attiva).
- UI logout: **`POST /logout`** (o Auth.js `POST /api/auth/signout`) — revoke DB + `Clear-Site-Data` + redirect `/login`. Controlo **Esci** in `AppChrome` (HQ + vendor, tutte le pagine auth) + onboarding. Risposte dinamiche: `Cache-Control: no-store` (middleware). `POST /logout` passa dal gate CSRF Origin/Sec-Fetch-Site + rate limit `logout:{ip}` 20/15 min → **429**.

### Durata / timeout (MVP)

| Controllo | Valore | Dove |
|-----------|--------|------|
| **Absolute / maxAge** | **30 giorni** (`SESSION_MAX_AGE_SEC`) | `src/infrastructure/auth/session-max-age.ts` → Auth.js `session.maxAge` + `Session.expires` Postgres al login |
| **Revoke logout** | immediato (delete `Session` by `sessionToken`) | `events.signOut` + `/logout` |
| **Idle timeout corto** | **non** implementato in MVP | JWT resta valido fino a `maxAge` se il cookie persiste; debt Fase 4 / hardening futuro (`updateAge` + idle client) |

Nota Auth.js: con strategy JWT il cookie cifrato non è revocabile “in rete” senza blocklist; FacilityFlow mitiga cancellando la riga Postgres e rifiutando JWT il cui `sessionToken` non esiste più (`jwt` callback). Fonte: [Auth.js session](https://authjs.dev/concepts/session-strategies).

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
