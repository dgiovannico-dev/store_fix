# ADR-0008: CSP nonce / strict-dynamic deferred

## Status

Accepted (deferred)

## Date

2026-10-30

## Context

Baseline CSP (`csp-policy.ts`) still allows `'unsafe-inline'` for scripts/styles so Next.js App Router + Tailwind work without forcing every document through a nonce pipeline. Next.js docs recommend nonces with `strict-dynamic` for stronger XSS mitigation, but that implies dynamic rendering (or careful middleware injection) on essentially all HTML responses.

## Decision

Keep MVP CSP with `'unsafe-inline'` (prod without `'unsafe-eval'`) plus the existing deny directives (`script-src-attr`, `object-src`, `frame-src`, `media-src`, …). **Do not** introduce nonce/`strict-dynamic` until a dedicated E14 follow-up after VPS GO, when we can measure TTFB/cache impact and ship a vertical slice with `verify:headers --prod`.

## Consequences

- XSS via injected HTML event handlers is already mitigated (`script-src-attr 'none'`).
- Inline script XSS surface remains larger than nonce-based CSP.
- Avoids regressing static/ISR paths and lab `verify:local` latency for a soft-gate debt item.

## Alternatives rejected

| Alternative | Perché no (ora) |
|-------------|-----------------|
| Nonce on every document via middleware | Forces dynamic render; cost/complexity before VPS exit |
| Report-Only CSP with nonces | Needs reporting endpoint + ops noise; still deferred |
| `'strict-dynamic'` without nonce hygiene | Invalid / incomplete; worse than current baseline |

## References

- `docs/ops/SECURITY_HEADERS.md`
- https://nextjs.org/docs/app/guides/content-security-policy
