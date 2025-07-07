import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: process.env.E2E_BASE_URL || 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    // Skip any specs in a `performance` folder unless explicitly requested
    //   Run them manually with:  npx cypress run --spec "cypress/e2e/performance/*.cy.js" --config excludeSpecPattern=""
    excludeSpecPattern: ['**/performance/**'],
    setupNodeEvents(on, config) {
      // Node events if needed later
    },
    env: {
      BACKEND_URL:
        'https://task-management-platform-746079896238.herokuapp.com',
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
  },
});
