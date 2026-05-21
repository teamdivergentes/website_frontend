import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry au lieu de 2 : 2 attempts absorbent la flakiness reseau ponctuelle
  // sans demultiplier la duree des tests qui echouent vraiment.
  retries: process.env.CI ? 1 : 0,
  // 2 workers en CI : 3 workers degrade massivement le runner self-hosted
  // (run #25451353578 : 103 fails contre 1-2 avec 2 workers — saturation
  // CPU/memoire des contextes chromium concurrents). Avec 2 workers et un
  // bundle statique (http-server), la suite tourne en ~30-35 min, ce qui
  // tient dans le timeout-minutes 45 du job.
  workers: process.env.CI ? 2 : 4,
  // Le test timeout par defaut est 30s. En CI sur ng serve dev, le cold start
  // d'une route lazy peut prendre 5-15s a lui seul, ce qui ne laisse plus
  // beaucoup de marge pour les assertions. 45s par test laisse 30s pour le
  // waitFor du form + 15s pour les assertions, sans laisser un test foireux
  // consommer 60s plein.
  timeout: process.env.CI ? 45_000 : 30_000,
  // expect() utilise 5s par defaut. En CI lent, certains elements (form,
  // composants lazy) peuvent prendre plus de temps a apparaitre apres le
  // domcontentloaded. 15s laisse une marge raisonnable sans masquer les bugs.
  expect: {
    timeout: process.env.CI ? 15_000 : 5_000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['github'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // navigationTimeout par defaut = 0 (= illimite). En CI on borne pour
    // detecter un ng serve qui ne repond plus.
    navigationTimeout: process.env.CI ? 30_000 : 30_000,
    // actionTimeout par defaut = 0 (= illimite). 15s suffit pour un click
    // ou un fill, mais laisse de la marge si l'app est encore en cours
    // de bootstrap (CSS/fonts non chargees).
    actionTimeout: process.env.CI ? 15_000 : 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm start',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
