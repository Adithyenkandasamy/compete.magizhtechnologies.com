import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Vitest configuration for the Magizh loading & motion system tests.
 *
 * These tests focus on UI behavior, not on build quality.
 * Run `npm test` or `npx vitest` to execute them.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: false,
    include: ["**/*.test.tsx"],
  },
});
