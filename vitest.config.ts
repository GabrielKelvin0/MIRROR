import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // Next preserves JSX for its compiler; component tests need a JSX runtime.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
});
