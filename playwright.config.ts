import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry au lieu de 2 : 2 attempts absorbent la flakiness reseau ponctuelle
  // sans demultiplier la duree des tests qui echouent vraiment.
  retries: process.env.CI ? 1 : 0,
  // 3 workers en CI : avec un bundle statique (http-server), pas de saturation
  // par compilation a la volee. Le runner self-hosted absorbe 3 contextes
  // chromium en parallele sans degrader le throughput. Avec 2 workers le job
  // depassait 30 min ; 3 workers descendent autour de 20 min.
  workers: process.env.CI ? 3 : undefined,
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
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
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
