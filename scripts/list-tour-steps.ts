import { stepsForAudience } from "../src/features/product-tour/tour-registry";

for (const audience of ["hq", "store", "vendor"] as const) {
  for (const s of stepsForAudience(audience, "it")) {
    const el = s.element?.match(/data-tour='([^']+)'/)?.[1] ?? "";
    // Pipe-delimited; empty route stays empty (no tab collapse in bash read)
    process.stdout.write(`${audience}|${s.id}|${s.route ?? ""}|${el}\n`);
  }
}
