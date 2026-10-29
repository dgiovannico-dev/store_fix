/**
 * OWASP Secure Headers Project subset — powerful APIs off.
 * Clipboard left unrestricted for paste/copy UX.
 * @see https://secure-headers-project.owasp.org/response-headers/
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy/browsing-topics
 */

/** Directives as `feature=()` deny-all allowlists. */
export const PERMISSIONS_POLICY_DENY_FEATURES = [
  "accelerometer",
  "autoplay",
  "browsing-topics",
  "camera",
  "display-capture",
  "encrypted-media",
  "geolocation",
  "gyroscope",
  "interest-cohort",
  "magnetometer",
  "microphone",
  "midi",
  "payment",
  "picture-in-picture",
  "publickey-credentials-get",
  "screen-wake-lock",
  "usb",
  "xr-spatial-tracking",
] as const;

export type PermissionsPolicyFeature =
  (typeof PERMISSIONS_POLICY_DENY_FEATURES)[number];

export function buildPermissionsPolicyHeader(
  features: readonly PermissionsPolicyFeature[] = PERMISSIONS_POLICY_DENY_FEATURES,
): string {
  return features.map((f) => `${f}=()`).join(", ");
}
