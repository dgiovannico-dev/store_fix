/** Cool Teal Facility mist wash — shared across auth + marketing heroes. */
export const AUTH_MIST_WASH_CLASS =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,oklch(0.92_0.05_195/0.55),transparent_50%),radial-gradient(ellipse_at_85%_75%,oklch(0.93_0.04_210/0.65),transparent_45%),linear-gradient(165deg,oklch(0.985_0.01_210),oklch(0.94_0.025_195))]";

export function AuthMistWash() {
  return <div aria-hidden className={AUTH_MIST_WASH_CLASS} />;
}
