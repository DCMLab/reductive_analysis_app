process.env.HEADLESS = false
process.env.SLOWMO = true

module.exports = {
  server: {
    command: 'npm run preview',
    port: 4173,
    launchTimeout: 30000
  },
  launch: {
     headless: process.env.HEADLESS !== 'false',
     slowMo: process.env.SLOWMO ? process.env.SLOWMO : 0,
     devtools: false
  }
}
