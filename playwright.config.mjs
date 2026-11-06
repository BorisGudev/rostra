import { defineConfig } from '@playwright/test';

/* End-to-end tests run against the local dev server (static dist + the API functions in-process) in mock mode:
   no keys, no network, deterministic AI answers. Screenshots land in test-results/shots. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: 'http://localhost:8788',
    trace: 'off',
    permissions: ['microphone'],
    launchOptions: {
      // Chromium answers getUserMedia with a fake device and, when a WAV is given, plays that file as the microphone.
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', ...(process.env.FAKE_AUDIO ? [`--use-file-for-fake-audio-capture=${process.env.FAKE_AUDIO}`] : [])],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'node scripts/dev.mjs --build',
    url: 'http://localhost:8788/api/health',
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, MOCK_AI: '1', PORT: '8788' },
    timeout: 60_000,
  },
});
