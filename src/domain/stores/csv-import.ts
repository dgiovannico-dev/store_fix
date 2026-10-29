import type { Role } from "@prisma/client";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCanMutate } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { checkRateLimit } from "@/infrastructure/rate-limit";
import { storeInputSchema } from "./store-service";
import { parseCsv, rowsToObjects } from "./csv";

export const STORE_CSV_MAX_ROWS = 200;

/** Domain errors: stable `code` (+ params). Copy IT/EN at action boundary. */
export type CsvRowError = {
  line: number;
  code: string;
  params?: Record<string, string>;
  /** Optional legacy; prefer localize via `code` in `actionResultError`. */
  message?: string;
};

export type StoreCsvImportResult = {
  imported: number;
  errors: CsvRowError[];
};

const REQUIRED_HEADERS = ["nome"] as const;

const STORE_FIELD_CODES = new Set([
  "storeWebhookUrlInvalid",
  "storeNtfyTopicInvalid",
  "storeNameRequired",
]);

/**
 * Import CSV IT (template public/templates/stores.it.csv).
 * Validazione riga-per-riga; rate limit per tenant.
 */
export async function importStoresFromCsv(input: {
  tenantId: string;
  role: Role;
  csvText: string;
}): Promise<StoreCsvImportResult> {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudStore);

  const limit = checkRateLimit(
    `store-csv:${input.tenantId}`,
    5,
    15 * 60 * 1000,
  );
  if (!limit.ok) {
    return {
      imported: 0,
      errors: [
        {
          line: 0,
          code: "csvImportRateLimited",
          params: { sec: String(limit.retryAfterSec) },
        },
      ],
    };
  }

  const { headers, records } = rowsToObjects(parseCsv(input.csvText));
  const errors: CsvRowError[] = [];

  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) {
      return {
        imported: 0,
        errors: [
          {
            line: 1,
            code: "csvHeaderMissing",
            params: { header: h },
          },
        ],
      };
    }
  }

  if (records.length > STORE_CSV_MAX_ROWS) {
    return {
      imported: 0,
      errors: [
        {
          line: 0,
          code: "csvTooManyRows",
          params: {
            max: String(STORE_CSV_MAX_ROWS),
            found: String(records.length),
          },
        },
      ],
    };
  }

  let imported = 0;
  for (let i = 0; i < records.length; i++) {
    const line = i + 2; // 1-based + header
    const r = records[i]!;
    if (!r.nome && !r.indirizzo && !r.citta) {
      continue; // skip blank
    }
    const parsed = storeInputSchema.safeParse({
      name: r.nome,
      address: r.indirizzo || null,
      city: r.citta || null,
      zip: r.cap || null,
      timezone: r.timezone || "Europe/Rome",
      contacts: r.contatti || null,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? "csvRowInvalid";
      errors.push({
        line,
        code: STORE_FIELD_CODES.has(issue) ? issue : "csvRowInvalid",
      });
      continue;
    }
    try {
      await prisma.store.create({
        data: {
          tenantId: input.tenantId,
          name: parsed.data.name,
          address: parsed.data.address ?? null,
          city: parsed.data.city ?? null,
          zip: parsed.data.zip ?? null,
          timezone: parsed.data.timezone,
          contacts: parsed.data.contacts ?? null,
        },
      });
      imported += 1;
    } catch {
      errors.push({
        line,
        code: "csvSaveFailed",
      });
    }
  }

  return { imported, errors };
}
