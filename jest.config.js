module.exports = {
    preset: "jest-puppeteer",
    setupFilesAfterEnv: ["expect-puppeteer"],
    globals: {
      launchTimeout: 60 * 10 * 1000   // in ms
    },
    testMatch: [
      "**/*.test.js"
    ],
    verbose: true
}
