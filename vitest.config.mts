import path from "node:path";
import { defineConfig } from "vitest/config";

// Tests only exercise the shared domain model and do not bootstrap Next.js.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
