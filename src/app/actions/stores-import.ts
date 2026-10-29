"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  importStoresFromCsv,
  type CsvRowError,
} from "@/domain/stores/csv-import";
import { actionError } from "@/i18n/action-errors";

export type ImportState = {
  imported?: number;
  errors?: CsvRowError[];
  error?: string;
};

export async function importStoresAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const session = await auth();
  if (!session?.tenantId || !session.role) {
    return { error: await actionError("accessRequired") };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: await actionError("selectCsv") };
  }
  if (file.size > 512_000) {
    return { error: await actionError("fileTooLarge") };
  }

  const csvText = await file.text();
  const result = await importStoresFromCsv({
    tenantId: session.tenantId,
    role: session.role,
    csvText,
  });
  revalidatePath("/app/stores");
  return { imported: result.imported, errors: result.errors };
}
