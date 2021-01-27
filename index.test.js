// import { fireEvent, getByText } from '@testing-library/dom'
const fireEvent = require('@testing-library/dom').fireEvent
const getByText = require('@testing-library/dom').getByText
// import '@testing-library/jest-dom/extend-expect'
require('@testing-library/jest-dom/extend-expect')
// import { JSDOM } from 'jsdom'
const JSDOM = require('jsdom').JSDOM
// import fs from 'fs'
const fs = require('fs')
// import path from 'path'
const path = require('path')

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

let dom
let container

describe('index.html', () => {
  beforeEach(() => {
    // The web app uses html-embeded <scripts> therefore
    // `beforeEach()` is necessary in order to execute this embedded code.
    // This is indeed dangerous, use with caution.
    // See https://github.com/jsdom/jsdom#executing-scripts
    dom = new JSDOM(html, { runScripts: 'dangerously' })
    container = dom.window.document.body
  })

  // Here is a dummy test to confirm that the testing framework is in place.
  it('is always happy', function() {
    expect(true).toBeTruthy();
  });
});
