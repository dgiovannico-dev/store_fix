/**
 * OWASP Secure Headers Project subset — powerful APIs off.
 * Clipboard left unrestricted for paste/copy UX.
 * @see https://secure-headers-project.owasp.org/response-headers/
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy/browsing-topics
 */

/** Directives as `feature=()` deny-all allowlists. */
export const PERMISSIONS_POLICY_DENY_FEATURES = [
  "accelerometer",
  "ambient-light-sensor",
  "attribution-reporting",
  "autoplay",
  "battery",
  "bluetooth",
  "browsing-topics",
  "camera",
  "compute-pressure",
  "display-capture",
  "encrypted-media",
  "gamepad",
  "geolocation",
  "gyroscope",
  "hid",
  "interest-cohort",
  "magnetometer",
  "microphone",
  "midi",
  "payment",
  "picture-in-picture",
  "publickey-credentials-get",
  "screen-wake-lock",
  "serial",
  "usb",
  "web-share",
  "window-management",
  "xr-spatial-tracking",
] as const;

export type PermissionsPolicyFeature =
  (typeof PERMISSIONS_POLICY_DENY_FEATURES)[number];

export function buildPermissionsPolicyHeader(
  features: readonly PermissionsPolicyFeature[] = PERMISSIONS_POLICY_DENY_FEATURES,
): string {
  return features.map((f) => `${f}=()`).join(", ");
}
