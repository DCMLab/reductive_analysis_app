const { JSDOM } = require('jsdom')
var fs = require('fs')
const fastXmlParser = require('fast-xml-parser')

let document
let dom
let window
let $

let mei
let meiPlainText

describe('reductive_analysis_test_suite', () => {

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

      // Load a sample MEI (mock the Open File button).
      let meiFilePath = './mei/bach_prelude.mei';

      meiPlainText = fs.readFileSync(meiFilePath, 'utf8');
      console.log('Loaded sample MEI file.');

      parser = new DOMParser();
      mei = parser.parseFromString(meiPlainText, 'text/xml');

      dom.window.addEventListener("load", resolve) 
    })

    // Create (read-only) helpers for quering the DOM in tests.
    window = dom.window
    document = window.document
    $ = window.$

    // Inject the MEI into the app (effectively "mocking" the Open button).
    dom.window.data = meiPlainText;
    dom.window.selected = [];
    dom.window.extraselected = [];
    dom.window.filename = 'MEI_SAMPLE_FILE';
    dom.window.load_finish();

  })

  // Allow Jest hooks longer than 5000ms to complete, or Jest might crash.
  jest.setTimeout(3 * 60 * 1000)

  it('should run a rudimentary test on static HTML to confirm Jest works', async function(done) {
    expect(
      $('#selected_things').html()
      .match(/Primaries:.*<br>Secondaries:.*/g)
    ).toBeTruthy();
    done();
  });

  it('should check that the sample MEI is a valid XML file', async function(done) {
    expect(
      fastXmlParser.validate(meiPlainText)
    ).toBeTruthy();
    done();
  })

  it('should parse the MEI plaintext producing an XML tree with a `meiHead`', async function(done) {
    expect(
      mei.querySelector('meiHead')
    ).toBeTruthy();
    done();
  })

  it("should confirm that the MEI tree is rendered as a convincing SVG", async function(done) {
    expect(
      $('#svg_output svg path').length
    ).toBeGreaterThan(2);
    console.log('Number of <path> notes in SVG: ', $('#svg_output svg path').length)
    done();
  })

});
