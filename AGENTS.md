# FacilityFlow Retail — Agent Instructions

This repo is a multi-tenant retail facility / maintenance SoR (MVP Italia). Agents must follow project rules in `.cursor/rules/` and the skill routing below.

**Do not implement code until** backlog alignment + Analysis Card (see `pre-dev-analysis`) and stack decisions in `docs/product/BACKLOG.md` + `docs/product/STACK.md` are respected.

**Hard constraint — OSS-only:** no paid SaaS in the critical path (no Clerk, Neon/Supabase Cloud, R2/S3 paid, Resend/Postmark, Inngest/Trigger Cloud, Sentry Cloud). Prefer Compose self-host: Auth.js, PostgreSQL, Prisma, SeaweedFS, Nodemailer+Mailpit, pg-boss. See `STACK.md`.

---

## Mandatory skill routing

1. **Read the map first:** `docs/product/SKILLS_MAP.md` — phase → skill path → when.
2. **Meta-router:** before non-trivial work, apply `~/.cursor/skills/using-agent-skills/SKILL.md`.
3. **Always-on project rules:**
   - `.cursor/rules/multi-agent-team.mdc` — **N agents** mirroring full team (PO/PM/Architect/TL/Dev/QA/Ops/Sec/UX); cooperate until production-ready (E14/S5)
   - `.cursor/rules/pre-dev-analysis.mdc` — Analysis Card before any epic/story/task implementation
   - `.cursor/rules/post-dev-verify.mdc` — verify report after every significant slice
   - `.cursor/rules/gitflow.mdc` / `agile-scrum.mdc` — branching & delivery cadence (no PR; push `develop`)
   - `.cursor/rules/agent-autopilot.mdc` — **ciclo continuo**: Analysis → build → verify → commit → push senza chiedere a ogni slice
4. **Hard gates (every change):**
   - `verification-before-completion` before claiming done/fixed/passing
   - `solid` for non-trivial design/implement/refactor
   - `clean-ddd-hexagonal` + `domain-modeling` when touching tenancy, tickets, SLA, vendors, assets
   - `security-and-hardening` for auth, RBAC, tenant isolation, file uploads
   - `test-driven-development` (or `tdd`) for domain/business logic with clear AC
5. **Default feature sequence:**  
   `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` (+ `source-driven-development` for Auth.js/Prisma/SeaweedFS/pg-boss) → `test-driven-development` → `code-review-and-quality` / `requesting-code-review` → `verification-before-completion` → `git-workflow-and-versioning`
6. **AI is assist-only:** never replace System of Record. MVP: skip AI. Fase 2: prefer local **Ollama** + human-confirm; `ai-sdk` only if still OSS-compatible. Skip AI if ROI unclear.
7. **Skills live on the machine** under `~/.cursor/skills/` (and `~/.agents/skills/`). This repo does **not** duplicate skill bodies — see `.cursor/skills/README.md`.

---

## Agent skills (Matt Pocock / engineering config)

### Issue tracker

Local markdown under `.scratch/<feature>/` until a git remote + GitHub Issues exist. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/` (now present — prefer glossary terms; do not re-litigate ADRs without a superseding ADR). Consumer rules: `docs/agents/domain.md`.

---

## Product context (short)

| Item | Value |
|------|--------|
| Product | FacilityFlow Retail — facility maintenance SoR for mid-market retail/franchise |
| MVP wedge | Intake + ticket/SLA/dispatch + costs per store |
| UI language | Italian |
| Stack (OSS-only) | Next.js App Router, Auth.js, Prisma, Postgres Compose, SeaweedFS, Nodemailer+Mailpit, pg-boss, Tailwind/shadcn — see `docs/product/STACK.md` |
| Backlog | `docs/product/BACKLOG.md` |
| Sprint backlogs | `docs/product/sprints/` (S1–S4 + DoD) |
| Skills map | `docs/product/SKILLS_MAP.md` |

Out of scope for MVP: WhatsApp API as SoR, PM calendar, marketplace, payments, IoT, ERP, multi-country, AI chatbot replacing ops.

---

## How to install / refresh skills (human)

```bash
npx skills list -g
npx skills add vercel/ai --skill ai-sdk -g -a cursor -y
npx skills add vercel/next.js --skill next-dev-loop --skill next-bundle-optimizer -g -a cursor -y
npx skills add mattpocock/skills -g -a cursor -y
npx skills update -g -y
```

After new installs that only appear in `~/.agents/skills/<name>`, link for Cursor:

```bash
ln -s ../../.agents/skills/<name> ~/.cursor/skills/<name>
```

Do not break existing symlinks under `~/.cursor/skills/`.

Once per repo (interactive): run skill `setup-matt-pocock-skills` to refresh `docs/agents/*` if tracker/layout changes.
