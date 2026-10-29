import { ALLOWED_ATTACHMENT_MIME } from "@/infrastructure/storage/types";

export class CompleteWorkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompleteWorkError";
  }
}

export type CompleteWorkAttachment = {
  mime: string;
  deletedAt?: Date | null;
};

export type CompleteWorkInput = {
  attachments: CompleteWorkAttachment[];
  actualCost: number | string | null | undefined;
  completionReport: string | null | undefined;
  /** default: actualCost >= 0 */
  allowZeroCost?: boolean;
};

function parseCost(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

/** Invarianti chiusura `done` (T3.6) — puro, no Prisma. */
export function assertCompleteWorkReady(input: CompleteWorkInput): {
  actualCost: number;
  completionReport: string;
} {
  const photos = input.attachments.filter(
    (a) =>
      !a.deletedAt &&
      ALLOWED_ATTACHMENT_MIME.includes(
        a.mime as (typeof ALLOWED_ATTACHMENT_MIME)[number],
      ),
  );
  if (photos.length < 1) {
    throw new CompleteWorkError(
      "Per chiudere serve almeno una foto (JPEG/PNG/WebP)",
    );
  }

  const cost = parseCost(input.actualCost);
  if (cost === null) {
    throw new CompleteWorkError("Costo effettivo obbligatorio");
  }
  if (cost < 0) {
    throw new CompleteWorkError("Costo effettivo non valido");
  }
  if (!input.allowZeroCost && cost <= 0) {
    throw new CompleteWorkError("Costo effettivo deve essere maggiore di zero");
  }

  const report = (input.completionReport ?? "").trim();
  if (report.length < 5) {
    throw new CompleteWorkError(
      "Report intervento obbligatorio (minimo 5 caratteri)",
    );
  }

  return { actualCost: cost, completionReport: report };
}
