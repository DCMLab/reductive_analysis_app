process.env.HEADLESS = false
process.env.SLOWMO = true

module.exports = {
  server: {
    command: './node_modules/.bin/lite-server',
    port: 8000,
    launchTimeout: 30000
  },
  launch: {
     headless: process.env.HEADLESS !== 'false',
     slowMo: process.env.SLOWMO ? process.env.SLOWMO : 0,
     devtools: true
  }
}
