import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node", // fit-engine tests are pure; component tests opt into jsdom per-file
    include: ["src/**/*.test.{ts,tsx}", "data/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/fit-engine/**/*.ts"],
      exclude: ["src/lib/fit-engine/**/__tests__/**"],
    },
  },
});
