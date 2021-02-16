require('expect-puppeteer');

describe('reductive_analysis_test_suite', () => {
  it('should run a rudimentary test on static HTML to confirm Jest works', async function() {
    await expect(page.title()).toMatch('DCML.*/s', {timeout: 30000})
    await expect(page).toClick('button', { text: 'Choose File' })
  });
});
