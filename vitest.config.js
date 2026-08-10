import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

/**
 * Unit tests for the newsletter's decision-making — consent, throttling,
 * token and slug shapes, the password gate. No jsdom and no React: what is
 * covered here is the logic that can silently mail the wrong person or let the
 * wrong person in, which is all plain functions on purpose.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
