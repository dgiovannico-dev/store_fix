# ADR-0007: UI design system — Tailwind + shadcn/ui

## Status

Accepted

## Date

2026-10-28

## Context

MVP surfaces are phone-first (store intake, vendor field updates at ~390px) and HQ dashboards in Italian. Need accessible, consistent components without a paid design SaaS or heavy custom kit. Design package (`docs/design/`) must be human-approved before scaffold.

## Decision

Build the product UI on **Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui** (copy-in components, MIT). Locale default `it`. Approved companions (still OSS): **motion** for intentional micro-interactions, **TanStack Table/Query** where lists/filters need structure, **React Hook Form + Zod** for forms/validation. No card-heavy marketing chrome inside app shells; follow `docs/design/DESIGN_SYSTEM.md` once approved.

## Consequences

- Components live in-repo (shadcn pattern) — upgrade is manual, not a black-box dependency.
- A11y target WCAG 2.1 AA on primary store/HQ flows (`US-E10-02`).
- Empty/loading/error states are mandatory on lists/details.
- Design tokens and IA must land before mass page scaffolding.

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| MUI / Ant Design as primary kit | Heavier theming fight; less “owned” primitives |
| Custom CSS-only system from zero | Slow for multi-role MVP |
| Paid component SaaS | Conflicts with OSS-only posture |
| Headless-only without shadcn starter | Reinvention cost with no UX gain for MVP |
