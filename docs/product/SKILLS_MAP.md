# FacilityFlow Retail — Skills Map

> Agents must **read** the skill at the path below (via the skill tool / `SKILL.md`) before acting in that phase.
> Personal skills live under `~/.cursor/skills/` (many are symlinks into `_packs/` or `~/.agents/skills/`).
> Do **not** copy skill bodies into this repo.

**Meta-router (always first when unsure):** `~/.cursor/skills/using-agent-skills/SKILL.md`

**Project rules (always-on):** `.cursor/rules/pre-dev-analysis.mdc`, `post-dev-verify.mdc`, `gitflow.mdc`, `agile-scrum.mdc`

---

## Phase → skill → when to invoke

| Phase | Skill | Absolute path | When to invoke |
|-------|-------|---------------|----------------|
| Discover | `interview-me` | `~/.cursor/skills/interview-me` | Ambiguous ask; extract real goal before planning |
| Discover | `brainstorming` | `~/.cursor/skills/brainstorming` | Need options / creative exploration before a single design |
| Discover | `idea-refine` | `~/.cursor/skills/idea-refine` | Rough concept needs sharpening into a concept worth building |
| Discover | `grill-me` / `grill-with-docs` | `~/.cursor/skills/grill-me` | Stress-test a plan or design before committing |
| Spec | `spec-driven-development` | `~/.cursor/skills/spec-driven-development` | New epic/feature/story with no written AC |
| Spec | `constraint-driven-development` | `~/.cursor/skills/constraint-driven-development` | Quality bar / non-negotiables not written down |
| Spec | `to-spec` / `to-tickets` | `~/.cursor/skills/to-spec` | Issue/backlog item → spec or tickets (Matt Pocock chain) |
| Spec | `writing-plans` | `~/.cursor/skills/writing-plans` | Multi-step plan from an approved spec |
| Plan | `planning-and-task-breakdown` | `~/.cursor/skills/planning-and-task-breakdown` | Spec exists; need ordered, verifiable tasks |
| Plan | `prototype` | `~/.cursor/skills/prototype` | Throwaway spike to validate a design question |
| Domain | `domain-modeling` | `~/.cursor/skills/domain-modeling` | Glossary, ubiquitous language, bounded contexts |
| Domain | `codebase-design` | `~/.cursor/skills/codebase-design` | Deep modules / seams vocabulary |
| Architecture | `solid` | `~/.cursor/skills/solid` | Any non-trivial design, implement, or refactor |
| Architecture | `clean-ddd-hexagonal` | `~/.cursor/skills/clean-ddd-hexagonal` | Domain/ports/adapters boundaries (tenant, ticket, vendor) |
| Architecture | `api-and-interface-design` | `~/.cursor/skills/api-and-interface-design` | Public APIs, module contracts, DTOs |
| Architecture | `improve-codebase-architecture` | `~/.cursor/skills/improve-codebase-architecture` | User asks to deepen architecture (user-invoked) |
| Architecture | `setup-ts-deep-modules` | `~/.cursor/skills/setup-ts-deep-modules` | Wire dependency-cruiser / deep TS packages (user-invoked) |
| Implement | `incremental-implementation` | `~/.cursor/skills/incremental-implementation` | Building any feature slice |
| Implement | `implement` / `implement-spec` | `~/.cursor/skills/implement` | Explicit implement-from-spec workflows |
| Implement | `source-driven-development` | `~/.cursor/skills/source-driven-development` | Unfamiliar libs (Auth.js, Prisma, Inngest, R2) — verify docs first |
| Implement | `doubt-driven-development` | `~/.cursor/skills/doubt-driven-development` | High-stakes / unfamiliar decisions mid-flight |
| Implement | `context-engineering` | `~/.cursor/skills/context-engineering` | Agent context quality degrading or session start |
| Implement | `frontend-ui-engineering` | `~/.cursor/skills/frontend-ui-engineering` | App Router UI, a11y, forms |
| Implement | `vercel-react-best-practices` | `~/.cursor/skills/vercel-react-best-practices` | React/Next performance patterns |
| Implement | `vercel-composition-patterns` | `~/.cursor/skills/vercel-composition-patterns` | Compound components / prop proliferation |
| Test | `test-driven-development` | `~/.cursor/skills/test-driven-development` | Logic with clear AC — red/green/refactor |
| Test | `tdd` | `~/.cursor/skills/tdd` | Alternate TDD workflow (same intent) |
| Test | `browser-testing-with-devtools` | `~/.cursor/skills/browser-testing-with-devtools` | UI/runtime verification in Chrome |
| Test | `next-dev-loop` | `~/.cursor/skills/next-dev-loop` | Verify Next changes against running dev server |
| Debug | `systematic-debugging` | `~/.cursor/skills/systematic-debugging` | Non-trivial bugs |
| Debug | `debugging-and-error-recovery` | `~/.cursor/skills/debugging-and-error-recovery` | Reproduce → localize → fix → guard |
| Debug | `diagnosing-bugs` | `~/.cursor/skills/diagnosing-bugs` | Hard / intermittent failures |
| Review | `code-review-and-quality` | `~/.cursor/skills/code-review-and-quality` | Pre-merge multi-axis review |
| Review | `code-review` | `~/.cursor/skills/code-review` | Standards + intent axes vs a baseline |
| Review | `requesting-code-review` | `~/.cursor/skills/requesting-code-review` | After major slice; before merge |
| Review | `code-simplification` | `~/.cursor/skills/code-simplification` | Complexity without behavior change |
| Review | `security-and-hardening` | `~/.cursor/skills/security-and-hardening` | Auth, RBAC, tenant isolation, uploads |
| Review | `performance-optimization` | `~/.cursor/skills/performance-optimization` | Measured hotspots only |
| Review | `next-bundle-optimizer` | `~/.cursor/skills/next-bundle-optimizer` | Slow route / oversized client bundle |
| Review | `web-design-guidelines` | `~/.cursor/skills/web-design-guidelines` | UI a11y / UX audit |
| Verify | `verification-before-completion` | `~/.cursor/skills/verification-before-completion` | **Before any “done/fixed/passing” claim** |
| Verify | `review-and-ship` | `~/.cursor/skills/review-and-ship` | Branch review + tests + ship readiness |
| Git / CI | `git-workflow-and-versioning` | `~/.cursor/skills/git-workflow-and-versioning` | Commits, branches, history hygiene |
| Git / CI | `ci-cd-and-automation` | `~/.cursor/skills/ci-cd-and-automation` | Pipelines, gates, hooks |
| Git / CI | `setup-pre-commit` | `~/.cursor/skills/setup-pre-commit` | Husky / lint-staged bootstrap (user-invoked) |
| Git / CI | `pr` | `~/.cursor/skills/pr` | Writing PR bodies |
| Ops | `observability-and-instrumentation` | `~/.cursor/skills/observability-and-instrumentation` | Logs, metrics, traces, alerts (parallel to build) |
| Ops | `shipping-and-launch` | `~/.cursor/skills/shipping-and-launch` | Launch checklist, rollback |
| Ops | `deprecation-and-migration` | `~/.cursor/skills/deprecation-and-migration` | Retiring APIs/schemas safely |
| Docs | `documentation-and-adrs` | `~/.cursor/skills/documentation-and-adrs` | ADRs / decision records |
| Docs | `doc-coauthoring` | `~/.cursor/skills/doc-coauthoring` | Structured doc co-authoring |
| Docs | `writing-guidelines` | `~/.cursor/skills/writing-guidelines` | Prose / docs voice audit |
| AI / agents | `ai-sdk` | `~/.cursor/skills/ai-sdk` | Vercel AI SDK features (assist-only; never SoR) |
| AI / agents | `langchain-rag` | `~/.cursor/skills/langchain-rag` | RAG pipelines |
| AI / agents | `langchain-fundamentals` | `~/.cursor/skills/langchain-fundamentals` | LangChain agents / tools |
| AI / agents | `langgraph-fundamentals` | `~/.cursor/skills/langgraph-fundamentals` | Any LangGraph graph work |
| AI / agents | `deep-agents-core` | `~/.cursor/skills/deep-agents-core` | Deep Agents apps |
| AI / agents | `eval-engineering` | `~/.cursor/skills/eval-engineering` | Evals / harnesses for agent quality |
| AI / agents | `mcp-builder` | `~/.cursor/skills/mcp-builder` | Building MCP servers |
| Deploy | `deploy-to-vercel` | `~/.cursor/skills/deploy-to-vercel` | Preview / prod deploy requests |
| Deploy | `vercel-optimize` | `~/.cursor/skills/vercel-optimize` | Cost / CWV / usage optimization |
| Process | `triage` / `wayfinder` / `handoff` / `retro` / `swarm` | `~/.cursor/skills/triage` etc. | Ticket triage, routing, handoffs, retros, fan-out |
| Setup | `setup-matt-pocock-skills` | `~/.cursor/skills/setup-matt-pocock-skills` | **Once per repo** — configures `docs/agents/*` (user-invoked) |

---

## FacilityFlow default sequences

### New epic / story (MVP backlog)

1. Align with `docs/product/BACKLOG.md` + `.cursor/rules/pre-dev-analysis.mdc` (Analysis Card)
2. `spec-driven-development` (if AC incomplete) → `planning-and-task-breakdown`
3. `domain-modeling` / `clean-ddd-hexagonal` when touching tenancy, tickets, SLA, vendors
4. `solid` + `incremental-implementation` + `test-driven-development`
5. `source-driven-development` for Auth.js / Prisma / Inngest / R2 / Resend
6. `security-and-hardening` on auth, RBAC, tenant filters, uploads
7. `verification-before-completion` + `.cursor/rules/post-dev-verify.mdc`
8. `requesting-code-review` / `code-review-and-quality` before merge
9. `git-workflow-and-versioning` + `pr`

### Bugfix

`systematic-debugging` → `test-driven-development` (regression) → `verification-before-completion` → `code-review-and-quality`

### UI slice

`frontend-ui-engineering` + `vercel-react-best-practices` → `browser-testing-with-devtools` / `next-dev-loop` → verify

### AI assist (optional, never SoR)

Evaluate in Analysis Card → if yes: `ai-sdk` (preferred for Next) or `langchain-rag` → human confirm in UX → `eval-engineering` when quality matters

---

## Install / update commands (machine)

```bash
# CLI exists
npx skills --help

# List global installs
npx skills list -g

# Official packs (examples)
npx skills add vercel-labs/agent-skills -g -a cursor -y
npx skills add vercel/ai --skill ai-sdk -g -a cursor -y
npx skills add vercel/next.js --skill next-dev-loop --skill next-bundle-optimizer -g -a cursor -y
npx skills add mattpocock/skills -g -a cursor -y   # include setup-matt-pocock-skills

# Update
npx skills update -g -y

# If a skill lands only in ~/.agents/skills, symlink for Cursor:
# ln -s ../../.agents/skills/<name> ~/.cursor/skills/<name>
```

Matt Pocock one-time repo config: invoke `/setup-matt-pocock-skills` (see `docs/agents/`).

---

## Gaps intentionally deferred

| Skill / pack | Why deferred | Install later |
|--------------|--------------|---------------|
| `next-cache-components-*` | Adopt when on Next with Cache Components | `npx skills add vercel/next.js --skill next-cache-components-adoption -g -a cursor -y` |
| `grilling` / `teach` / `chief-of-staff` | Nice-to-have productivity; core grill/handoff already present | `npx skills add mattpocock/skills --skill grilling -g -a cursor -y` |
| Trail of Bits `property-based-testing` | Optional hardening for critical domain invariants | `npx skills add trailofbits/skills --skill property-based-testing -g -a cursor -y` |
| Duplicate project copies of Addy/Matt packs | Already global; project uses this map + `AGENTS.md` | Do not re-clone into `.cursor/skills` |
