module.exports = {
    preset: "jest-puppeteer",
    setupFilesAfterEnv: ["expect-puppeteer", "jest-extended"],
    globals: {
      launchTimeout: 60 * 10 * 1000   // in ms
    },
    testMatch: [
      "**/*.test.js"
    ],
    verbose: true
}
