const JSDOM = require('jsdom').JSDOM

let dom

describe('load DOM', () => {

  beforeAll(async () => {

    // The web app uses html-embeded <scripts>, therefore 
    // `beforeAll()` is necessary to initialize the test runner.
    dom = await JSDOM.fromFile("index.html", {
      runScripts: 'dangerously',   // load inline <scripts>
      resources: "usable",   // load external resources
      contentType: "text/html",
      includeNodeLocations: true
    })
    await new Promise(resolve => {
      console.log('[JSDOM] DOM loaded.')
      // The following line is crucial and took a lifetime to figure out.
      // It is possibly necessary due to a Jest bug to be fixed in Jest 27.
      // See for instance https://github.com/facebook/jest/issues/1256
      // Long story short, `beforeAll` does not handle async calls as well
      // as it is supposed to be.
      dom.window.addEventListener("load", resolve) 
    })

  })

  // Allow Jest hooks longer than 5000ms to complete, or Jest might crash.
  jest.setTimeout(3 * 60 * 1000)

  // Run a trivial test to confirm that the testing framework is in place.
  it('displays the Primaries and Secondaries labels in the layout', function() {
    expect(
      dom.window.document.getElementById('selected_things').innerHTML
      .match(/Primaries:.*<br>Secondaries:.*/g)
    ).toBeTruthy();
  });

});
