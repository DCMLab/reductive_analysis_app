require('expect-puppeteer');

describe('reductive_analysis_test_suite', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    await new Promise(resolve => {
      document.addEventListener("load", resolve);
      console.log("DOM fully loaded and parsed");
    })
  });

  it('should run a rudimentary test on static HTML to confirm Jest works', async function() {
    await expect(page.title()).toMatch('DCML.*/s', {timeout: 30000})
    await expect(page).toClick('button', { text: 'Choose File' })
  });
});
