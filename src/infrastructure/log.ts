type Level = "info" | "warn" | "error" | "debug";

/** Log JSON strutturato (US-E10-03) — niente PII oltre id tecnici. */
export function logJson(
  level: Level,
  msg: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
