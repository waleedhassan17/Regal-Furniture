import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Database tests talk to the real project; give the network some room.
    testTimeout: 20_000,
    env: loadEnvLocal(),
  },
})

/** Loads .env.local for DB-backed tests without printing anything. */
function loadEnvLocal(): Record<string, string> {
  try {
    // process.loadEnvFile is available in Node ≥ 21.7.
    const before = { ...process.env }
    process.loadEnvFile(".env.local")
    const added: Record<string, string> = {}
    for (const [k, v] of Object.entries(process.env)) if (before[k] === undefined && v !== undefined) added[k] = v
    return added
  } catch {
    return {}
  }
}
