module.exports = {
    preset: "jest-puppeteer",
    setupFilesAfterEnv: ["expect-puppeteer", "jest-extended"],
    globals: {
      launchTimeout: 60 * 10 * 1000   // in ms
    },
    snapshotSerializers: ["jest-serializer-xml"],
    testMatch: [
      "**/*.test.js"
    ],
    verbose: true
}
