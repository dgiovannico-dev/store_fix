"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  importStoresFromCsv,
  type CsvRowError,
} from "@/domain/stores/csv-import";

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
    return { error: "Accesso richiesto" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file CSV" };
  }
  if (file.size > 512_000) {
    return { error: "File troppo grande (max 512 KB)" };
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
