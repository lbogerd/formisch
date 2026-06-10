import { defineConfig } from '@playwright/test';

export const VALIBOT_PORT = 6171;
export const ZOD_PORT = 6172;

/**
 * Playwright config that boots both React playgrounds side by side:
 *
 * - `playgrounds/react` (valibot, published `@formisch/react`) on port 6171
 * - `playgrounds/react-zod` (zod, workspace `@formisch/react`) on port 6172
 *
 * Each test drives the exact same interaction sequence against both apps
 * and asserts that the serialized form behavior is identical.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 4,
  timeout: 120_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Both apps compare against the same snapshot files (no browser or
  // project name in the path), so the recorded behavior is app-agnostic.
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{arg}{ext}',
  use: {
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  webServer: [
    {
      command: `pnpm --dir ../react dev --port ${VALIBOT_PORT} --strictPort`,
      url: `http://localhost:${VALIBOT_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --dir ../react-zod dev --port ${ZOD_PORT} --strictPort`,
      url: `http://localhost:${ZOD_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
