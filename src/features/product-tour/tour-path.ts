import type { TourStepDef } from "./tour-registry";

/**
 * Whether the current pathname is the right place to show a tour step.
 *
 * Exact match wins. Prefix match is only for opaque id children
 * (e.g. `/app/tickets/clxyz`), never named sibling routes like `/new`,
 * `/scorecard`, `/performance`, …
 */
export function stepFitsPath(
  step: Pick<TourStepDef, "route">,
  pathname: string,
): boolean {
  if (!step.route) return true;
  if (pathname === step.route) return true;
  if (!pathname.startsWith(`${step.route}/`)) return false;

  const rest = pathname.slice(step.route.length + 1);
  const first = rest.split("/")[0] ?? "";
  // Named App Router segments that are sibling pages, not resource ids.
  if (
    /^(new|edit|scorecard|performance|members|audit|ai|locale|inbox|rfq)$/.test(
      first,
    )
  ) {
    return false;
  }
  return true;
}
