require('expect-puppeteer');

describe('reductive_analysis_test_suite', () => {
  it('should run a rudimentary test on static HTML to confirm Jest works', async function() {
    await setTimeout(() => expect(page.title()).toMatch('DCML.*/s'), 5000)
  });
});
