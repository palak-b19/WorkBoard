import { defineConfig } from 'cypress';
import baseConfig from './cypress.config.js';

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    // Run only performance specs
    specPattern: 'cypress/e2e/performance/**/*.cy.js',
    excludeSpecPattern: [],
    setupNodeEvents(on, config) {
      // call base setupNodeEvents if it exists
      if (typeof baseConfig.e2e?.setupNodeEvents === 'function') {
        baseConfig.e2e.setupNodeEvents(on, config);
      }

      // forward perf logs to terminal
      on('task', {
        'perf:print'(msg) {
          // eslint-disable-next-line no-console
          console.log(msg);
          return null;
        },
      });
    },
  },
});
