import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'player.spec.mjs', workers: 1, timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:4180/elevenlabs-hackathon/', viewport: { width: 1440, height: 900 }, headless: true },
  outputDir: '.qa/test-results',
  webServer: { command: 'pnpm exec vite preview --host 127.0.0.1 --port 4180 --base /elevenlabs-hackathon/', port: 4180, reuseExistingServer: false }
});
