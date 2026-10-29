/**
 * Crea il bucket allegati su SeaweedFS (S3 API).
 * Uso: npm run storage:init
 */
import { ensureBucket } from "../src/infrastructure/storage/s3";

async function main() {
  await ensureBucket();
  console.log(
    `Bucket OK: ${process.env.S3_BUCKET ?? "facilityflow-attachments"} @ ${process.env.S3_ENDPOINT ?? "http://localhost:8333"}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
