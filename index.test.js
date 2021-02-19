require('expect-puppeteer');
const snapshotSerializer = require('jest-serializer-xml');

const path = require('path');

jest.setTimeout(10000); // 20 second timeout for promise resolution.

var globals = {};
const verbose = true;

describe('reductive_analysis_test_suite', () => {

  beforeAll(async () => {
    await page.goto("http://localhost:8000");

    // Import relevant webapp globals into the testing environment.
    globals.type_conf = await page.evaluate('type_conf');
    globals.meta_conf = await page.evaluate('meta_conf');
    console.log("DOM fully loaded and parsed?");
  });

  it('should run a rudimentary test on static HTML to confirm Jest works', async function() {
    await expect(page.title()).resolves.toMatch(/DCML.*/s, {timeout: 30000});
    await expect(page).toMatch(/Primaries.*Secondaries/s, {timeout: 30000});
  });

  it('should parse conf.js without throwing an exception', async function() {
    await expect(page.evaluate('CONFIG_OK')).resolves.toBeTrue();
  });

  it('should set up all buttons with expected element IDs and attributes', async function() {

    // Helper function to test a single button
    // with a compulsory element id and any other attribute-value pairs.
    button_test = async (buttonId, conditions) => {
      if (verbose) {
        console.log(`testing button with element ID #${buttonId}`
          + (conditions ? ` and attributes ${JSON.stringify(conditions)}` : ''));
      }

      // Expect the element to exist
      await expect(page)
        .toMatchElement(`#${buttonId}`);

      // ... to be an <input> element
      await expect(page.evaluate(`$('#${buttonId}').prop('tagName').toLowerCase()`)).resolves
        .toMatch('input'); // is an <input> element

      // ... of type `button`
      await expect(page.evaluate(`$('#${buttonId}').attr('type')`)).resolves
        .toMatch('button');

      // ... fulfilling any {attr, value} pairwise conditions
      if (conditions) {
        for (c in conditions) {
          await expect(page.evaluate(`$('#${buttonId}').attr('${c}')`)).resolves
            .toMatch(conditions[c]); 
        }
      }
    }

    // Test programmatically generated relation buttons.
    Object.keys(globals.type_conf).forEach(async (b) =>
      button_test(`${b}relationbutton`, {'class': 'relationbutton'})
    );

    // Test programmatically generated metarelation buttons.
    Object.keys(globals.meta_conf).forEach((b) =>
      button_test(`${b}metarelationbutton`, {'class': 'metarelationbutton'})
    );

    // Test hard-wired buttons.
    button_test('undobutton');
    button_test('deselectbutton');
    button_test('deletebutton');
    button_test('relationbutton', {'class': 'relationbutton'});
    button_test('customrelationbutton', {'class': 'relationbutton'});
    button_test('midibutton');
    button_test('midireducebutton');
    button_test('hidebutton');
    button_test('downloadbutton');
    button_test('svgdownloadbutton');
    button_test('reducebutton');
    button_test('equalizebutton');
    button_test('shadesbutton');
    button_test('rerenderbutton');
    button_test('zoominbutton', {'class': 'zoombutton'});
    button_test('zoomoutbutton', {'class': 'zoombutton'});
  });

  it('should load the example MEI', async function() {
    await expect(page).toUploadFile(
      'input[type=file]',
      path.join(__dirname, 'test_scores', 'mozart13.xml')
    );
  });

  it('should produce a directed <graph> within <mei>', async function () {
    await expect(page.evaluate(`$(window.mei).find('graph').attr('type')`)).resolves
      .toMatch(/^directed$/);
  });

  it(`should produce a convincing <mei> object (using Jest snapshots)`, async function() {

    expect.addSnapshotSerializer(snapshotSerializer);

    var mei_to_str = await page.evaluate(`$(window.mei).children()[0].outerHTML`);

    // Prevent false positives by stripping out conversion timestamps (in case of XML->MEI).
    mei_to_str = mei_to_str.replace(/isodate="\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d"/gm, '');

    // Prevent false positives by stripping out converter-generated random IDs (in case of XML->MEI).
    mei_to_str = mei_to_str.replace(/xml:id="\w+-\d+"/gm, '');

    expect(mei_to_str).toMatchSnapshot();
  });


  it('should produce a convincing SVG (using Jest snapshots)', async function() {

    expect.addSnapshotSerializer(snapshotSerializer);

    var svg_to_str = await page.evaluate(`$('svg')[1].outerHTML`);

    // Prevent false positives by stripping out Verovio-generated random attributes.
    svg_to_str = svg_to_str.replace(/id="\w+-\d+"/gm, '');
    svg_to_str = svg_to_str.replace(/section-\d+/gm, '');

    expect(svg_to_str).toMatchSnapshot();
  });

});
