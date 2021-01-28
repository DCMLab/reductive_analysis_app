const JSDOM = require('jsdom').JSDOM

let dom

describe('load DOM', () => {

  beforeAll(async () => {

    // The web app uses html-embeded <scripts> therefore invoking
    // `beforeAll()` is necessary in order to initialize the test runner.
    dom = await JSDOM.fromFile("index.html", {
      runScripts: 'dangerously',   // load inline <scripts>
      resources: "usable",   // load external resources
      contentType: "text/html",
      includeNodeLocations: true
    })
    await new Promise(resolve => {
      console.log('[JSDOM] DOM loaded.')
      // The following line is crucial and took a lifetime to figure out.
      // It is possibly necessary due to Jest bug to be fixed in Jest 27.
      // See for instance https://github.com/facebook/jest/issues/1256
      // Long story short, `beforeAll` does not handle asynch steps well(!)
      dom.window.addEventListener("load", resolve) 
  })

  // Here is a dummy test to confirm that the testing framework is in place.
  it('is always happy', function() {
    expect(true).toBeTruthy();
  });
});
