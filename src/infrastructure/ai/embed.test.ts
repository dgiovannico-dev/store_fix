import { describe, expect, it } from "vitest";
import { EMBEDDING_DIM, vectorToSql } from "./embed";

describe("vectorToSql", () => {
  it("formats pgvector literal", () => {
    const v = Array.from({ length: EMBEDDING_DIM }, (_, i) =>
      i === 0 ? 0.5 : 0,
    );
    const sql = vectorToSql(v);
    expect(sql.startsWith("[")).toBe(true);
    expect(sql.endsWith("]")).toBe(true);
    expect(sql.split(",")).toHaveLength(EMBEDDING_DIM);
  });
});
