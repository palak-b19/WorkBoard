const { defineConfig } = require("cypress");

module.exports = defineConfig({
  video: false, // disable video to speed up CI runs
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: process.env.E2E_BASE_URL || "http://localhost:5173",
    supportFile: false, // no custom support yet
    setupNodeEvents(on, config) {
      // implement node event listeners here if needed
    },
  },
});
