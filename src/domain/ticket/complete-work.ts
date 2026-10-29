import { ALLOWED_ATTACHMENT_MIME } from "@/infrastructure/storage/types";

export type CompleteWorkErrorCode =
  | "completeWorkPhotoRequired"
  | "actualCostRequired"
  | "actualCostInvalid"
  | "actualCostMustBePositive"
  | "workReportRequired";

/** EN diagnostics for logs/tests; UI uses `code` → domainErrors. */
const COMPLETE_WORK_DIAGNOSTIC: Record<CompleteWorkErrorCode, string> = {
  completeWorkPhotoRequired: "At least one photo required (JPEG/PNG/WebP)",
  actualCostRequired: "Actual cost required",
  actualCostInvalid: "Actual cost invalid",
  actualCostMustBePositive: "Actual cost must be greater than zero",
  workReportRequired: "Work report required (min 5 characters)",
};

export class CompleteWorkError extends Error {
  readonly code: CompleteWorkErrorCode;

  constructor(code: CompleteWorkErrorCode) {
    super(COMPLETE_WORK_DIAGNOSTIC[code]);
    this.name = "CompleteWorkError";
    this.code = code;
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
    throw new CompleteWorkError("completeWorkPhotoRequired");
  }

  const cost = parseCost(input.actualCost);
  if (cost === null) {
    throw new CompleteWorkError("actualCostRequired");
  }
  if (cost < 0) {
    throw new CompleteWorkError("actualCostInvalid");
  }
  if (!input.allowZeroCost && cost <= 0) {
    throw new CompleteWorkError("actualCostMustBePositive");
  }

  const report = (input.completionReport ?? "").trim();
  if (report.length < 5) {
    throw new CompleteWorkError("workReportRequired");
  }

  return { actualCost: cost, completionReport: report };
}
