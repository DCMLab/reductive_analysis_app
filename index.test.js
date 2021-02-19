require('expect-puppeteer');
const path = require('path');

jest.setTimeout(10000); // 20 second timeout for promise resolution.

var globals = {};

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
  });

  it('should load the example MEI', async function() {
    await expect(page).toUploadFile(
      'input[type=file]',
      path.join(__dirname, 'mei', 'bach_prelude.mei'),
    );
  });

  it('should produce a minimally convincing SVG', async function() {
    await expect(page).toMatchElement('path');
  });

});
