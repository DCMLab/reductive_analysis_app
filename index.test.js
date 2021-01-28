const fireEvent = require('@testing-library/dom').fireEvent
const getByText = require('@testing-library/dom').getByText
require('@testing-library/jest-dom/extend-expect')
const JSDOM = require('jsdom').JSDOM
const fs = require('fs')
const path = require('path')

let dom

describe('index.html', () => {
  beforeAll(() => {
    // The web app uses html-embeded <scripts> therefore invoking
    // `beforeEach()` is necessary in order to initialize the test runner.
    return JSDOM.fromFile("index.html", {
      runScripts: 'dangerously',   // load inline <scripts>
      resources: "usable"   // load external resources
    })
    .then(d => {
      dom = d
    });
  })

  // Here is a dummy test to confirm that the testing framework is in place.
  it('is always happy', function() {
    expect(true).toBeTruthy();
  });
});