/** Chunk ticket text for embedding — max ~4 chunks, ~500 chars each. */

const MAX_CHUNKS = 4;
const CHUNK_SIZE = 500;

export function chunkTicketText(parts: {
  category?: string | null;
  description?: string | null;
  completionReport?: string | null;
  notes?: string[];
}): string[] {
  const blob = [
    parts.category?.trim(),
    parts.description?.trim(),
    parts.completionReport?.trim(),
    ...(parts.notes ?? []).map((n) => n.trim()).filter(Boolean),
  ]
    .filter(Boolean)
    .join("\n\n")
    .replace(/\s+/g, " ")
    .trim();

  if (!blob) return [];

  const chunks: string[] = [];
  for (let i = 0; i < blob.length && chunks.length < MAX_CHUNKS; i += CHUNK_SIZE) {
    chunks.push(blob.slice(i, i + CHUNK_SIZE).trim());
  }
  return chunks.filter(Boolean);
}
