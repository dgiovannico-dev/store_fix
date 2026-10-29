import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "./src"),
};

const cssQuiet = {
  postcss: {
    plugins: [] as [],
  },
};

/**
 * E2E PG share one DB — run sequential to avoid cross-tenant job flakes
 * (e.g. checkSlaBreaches counting siblings). Unit/domain stay parallel.
 * @see https://vitest.dev/guide/recipes/parallel-sequential
 */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        css: cssQuiet,
        esbuild: { jsx: "automatic" },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/tests/e2e/**"],
          css: false,
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
      {
        resolve: { alias },
        css: cssQuiet,
        test: {
          name: "e2e",
          environment: "node",
          include: ["src/tests/e2e/**/*.test.ts"],
          fileParallelism: false,
          css: false,
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
    ],
  },
});
