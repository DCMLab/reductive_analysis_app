require('expect-puppeteer');
const path = require('path');

jest.setTimeout(10000); // 20 second timeout for promise resolution.


describe('reductive_analysis_test_suite', () => {

  beforeAll(async () => { await page.goto("http://localhost:8000");
      console.log("DOM fully loaded and parsed?");
  });

  it('should run a rudimentary test on static HTML to confirm Jest works', async function() {
    await expect(page.title()).resolves.toMatch(/DCML.*/s, {timeout: 30000});
    await expect(page).toMatch(/Primaries.*Secondaries/s, {timeout: 30000});
  });

  it('should have loaded the config.js and set up appropriate buttons', async function() {
      // Check that e.g. the repeat button exists (with id
      // "repeatrelationbutton"), is a button of the right class
      // (relationbutton), and has the right colour
  });

  it('should load the example MEI', async function() {
    await expect(page).toUploadFile(
      'input[type=file]',
      path.join(__dirname, 'mei', 'bach_prelude.mei'),
    );
  });

  });

});
