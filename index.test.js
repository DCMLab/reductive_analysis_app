require('expect-puppeteer');
const snapshotSerializer = require('jest-serializer-xml');

const path = require('path');

const configFiles = [
  'action_conf',
  'navigation_conf',
  'custom_conf',
  'meta_conf',
  'type_conf',
  'combo_conf',
  'type_full_conf',
  'meta_full_conf',
]

// Make tests deterministic
Date.now = jest.fn(() => 1482363367071);

jest.setTimeout(15000); // 20 second timeout for promise resolution.

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms) )
}

var useful = `
function get_by_id(doc, id) {
  if (!id)
    return null
  if (id[0] == '#') { id = id.slice(1) }
  var elem = doc.querySelector('[*|id=\\'' + id + '\\']')
  if (elem) {
    return elem
  } else {
    return Array.from(doc.getElementsByTagName('*')).find((x) => { return x.getAttribute('id') == id || x.getAttribute('xml:id') == id })
  }
}

// From any relation element to list of MEI note elements
function relation_get_notes(mei,he) {
  he = get_by_id(mei, get_id(he))
  var note_nodes = relation_allnodes(mei, he)
  var notes = note_nodes.map(node_to_note_id).map((n) => get_by_id(mei, n))
  return notes

}
// From any relation element to list of MEI note elements
function relation_get_notes_separated(mei, he) {
  he = get_by_id(mei, get_id(he))
  var prim_nodes = relation_primaries(mei, he)
  var prims = prim_nodes.map(node_to_note_id).map((n) => get_by_id(mei, n))
  var sec_nodes = relation_secondaries(mei, he)
  var secs = sec_nodes.map(node_to_note_id).map((n) => get_by_id(mei, n))
  return [prims, secs]
}

// Get the MEI-graph nodes that are adjacent to a relation
function relation_allnodes(mei, he) {
  var arcs_array = Array.from(mei.getElementsByTagName('arc'))
  var nodes = []
  arcs_array.forEach((a) => {
    if (a.getAttribute('from') == '#' + he.getAttribute('xml:id')) {
      nodes.push(get_by_id(mei, a.getAttribute('to')))
    }
  })
  return nodes
}

function get_id(elem) {
  if (document.contains(elem)) {
    // SVG traversal
    if (!elem.hasAttribute('oldid'))
      return elem.id
    else
      return get_id(document.getElementById(elem.getAttribute('oldid')))
  } else if (elem.hasAttribute('xml:id')) {
    // MEI traversal
    if (elem.hasAttribute('sameas'))
      return get_id(get_by_id(window.mei, elem.getAttribute('sameas')))
    else if (elem.hasAttribute('corresp'))
      return get_id(get_by_id(window.mei, elem.getAttribute('corresp')))
    else if (elem.hasAttribute('copyof'))
      return get_id(get_by_id(window.mei, elem.getAttribute('copyof')))
    else if (elem.hasAttribute('xml:id'))
      return elem.getAttribute('xml:id')
  }
}

function node_to_note_id(note) {
  if (note.getElementsByTagName('label')[0].children.length == 0)
    return note.getAttribute('xml:id')
  return note.getElementsByTagName('label')[0].
    getElementsByTagName('note')[0].
    getAttribute('corresp').replace('#', '')
}

// Get the MEI-graph nodes that are adjacent and primary to a relation
function relation_primaries(mei_graph, he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName('arc'))
  var nodes = []
  arcs_array.forEach((a) => {
    if (a.getAttribute('from') == '#' + he.getAttribute('xml:id') &&
       a.getAttribute('type') == 'primary') {
      nodes.push(get_by_id(mei_graph.getRootNode(), a.getAttribute('to')))
    }
  })
  return nodes
}
// Get the MEI-graph nodes that are adjacent and secondary to a relation
function relation_secondaries(mei_graph, he) {
  var arcs_array = Array.from(mei_graph.getElementsByTagName('arc'))
  var nodes = []
  arcs_array.forEach((a) => {
    if (a.getAttribute('from') == '#' + he.getAttribute('xml:id') &&
       a.getAttribute('type') == 'secondary') {
      nodes.push(get_by_id(mei_graph.getRootNode(), a.getAttribute('to')))
    }
  })
  return nodes
}

`


const verbose = false;
let log = () => null

// Helper function to test a single button
// with a compulsory element id and any other attribute-value pairs.
var button_test = async (buttonId, conditions) => {
  log(`testing button with element ID #${buttonId}`
    + (conditions ? ` and attributes ${JSON.stringify(conditions)}` : ''));

  // Expect the element to exist
  await expect(page)
    .toMatchElement(`#${buttonId}`);

  // ... to be an <input> or a <button> element
  await expect(page.evaluate(`$('#${buttonId}').prop('tagName').toLowerCase()`)).resolves
    .toMatch(/input|button/); // is an <input> element

  // ... of type `button`
  await expect(page.evaluate(`$('#${buttonId}').attr('type')`)).resolves
    .toMatch('button');

  // ... fulfilling any {attr, value} pairwise conditions
  if (conditions) {
    for (const c in conditions) {
      await expect(page.evaluate(`$('#${buttonId}').attr('${c}')`)).resolves
        .toMatch(conditions[c]);
    }
  }
}

describe('reductive_analysis_test_suite', () => {

  beforeAll(async () => {
    await page.goto("http://localhost:8000");
    // Make tests deterministic
    await wait(1000)
    await page.evaluate('Date.now = () => 1482363367071')
    await page.evaluate(useful)

    if (verbose) {
      log = console.log
    }


    log("DOM fully loaded and parsed?");
  });

  it('should run a rudimentary test on static HTML to confirm Jest works', async function () {
    await expect(page.title()).resolves.toMatch(/^DCML/s, { timeout: 30000 });
    //await expect(page).toMatch(/Primaries.*Secondaries/s, {timeout: 30000});
  });

/*  it('should parse conf.js without throwing an exception', function () {
    configFiles.forEach(async filename => {
      await expect(page.evaluate(filename)).resolves.toBeTruthy();
    })
  });*/

  it('should load the example MEI', async function() {
    await expect(page).toUploadFile(
      'input[type=file]',
      path.join(__dirname, 'test_scores', 'mozart13.xml')
    );
    await expect(page).toMatchElement('div.layer'); 
  });


  it('should set up all buttons with expected element IDs and attributes', async function () {

    // Wrapping in `await expect` seems to be needed to make `window` available.
    await expect(async () => {

      // Test programmatically generated relation buttons.
      Object.keys(window.type_conf).forEach(async (b) =>
        await button_test(`${b}relationbutton`, { 'class': 'relationbutton' })
      );

      // Test programmatically generated metarelation buttons.
      Object.keys(window.meta_conf).forEach(async (b) =>
        await button_test(`${b}metarelationbutton`, { 'class': 'metarelationbutton' })
      );

      // Test hard-wired buttons.
      await button_test('undobutton');
      await button_test('deselectbutton');
      await button_test('deletebutton');
      await button_test('relationbutton', { 'class': 'relationbutton' });
      await button_test('player-play');
      await button_test('player-pause');
      await button_test('player-stop');
      await button_test('downloadbutton');
      await button_test('svgdownloadbutton');
      await button_test('equalizebutton');
      await button_test('shadesbutton');
    })
  });

  it('should have loaded view-specific buttons', async function  () {
    await expect(async () => {
      button_test('reducebutton', {'class': 'reducebutton'});
      button_test('unreducebutton', {'class': 'unreducebutton'});
      button_test('rerenderbutton', {'class': 'rerenderbutton'});
      button_test('newlayerbutton', {'class': 'newlayerbutton'});
      button_test('zoominbutton', {'class': 'zoominbutton'});
      button_test('zoomoutbutton', {'class': 'zoomoutbutton'});
    })
  });


  it('should produce a directed <graph> within <mei>', async function () {
    await page.waitForTimeout(3300);
    await expect(page.evaluate(`window.mei.querySelector('graph').getAttribute('type')`)).resolves
      .toMatch(/^directed$/);
  });

  it(`should produce a convincing <mei> object (using Jest snapshots)`, async function() {

    expect.addSnapshotSerializer(snapshotSerializer);

    var mei_to_str = await page.evaluate(`window.mei.children[0].outerHTML`);

    // Prevent false positives by stripping out conversion timestamps (in case of XML->MEI).
    mei_to_str = mei_to_str.replace(/isodate="\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d"/gm, '');

    // Prevent false positives by stripping out converter-generated random IDs (in case of XML->MEI).
    mei_to_str = mei_to_str.replace(/xml:id="\w+-\d+"/gm, '');

    expect(mei_to_str).toMatchSnapshot();
  });


  it('should produce a convincing SVG (using Jest snapshots)', async function() {

    expect.addSnapshotSerializer(snapshotSerializer);

    var svg_to_str = await
    page.evaluate(`window.document.querySelector('div.svg_container').children[0].outerHTML`);

    // Prevent false positives by stripping out Verovio-generated random attributes.
    svg_to_str = svg_to_str.replace(/id="\w+-\d+"/gm, '');
    svg_to_str = svg_to_str.replace(/section-\d+/gm, '');

    expect(svg_to_str).toMatchSnapshot();
  });

  it('should ensure that (the very last) note IDs of the MEI and the SVG match', async function () {

    // There is probably a better way to test this.
    var mei_id = await page.evaluate(`window.mei.querySelector('note').getAttribute('xml:id')`);
    var svg_id = await page.evaluate(`window.document.querySelector('g.note').getAttribute('id')`);

    expect(mei_id).toMatch(svg_id);
  })

  it('should toggle a note, ensuring that the relevant array is updated and the note styled accordingly', async function () {

    log(`About to toggle a note`);
    var svg_first_note_id = await page.evaluate(`window.document.querySelector('g.note').getAttribute('id')`);
    var svg_first_note_selector = `#${svg_first_note_id}`;
    var svg_first_notehead_selector = `#${svg_first_note_id} .notehead`;

    // Simulate click on the first note.
    log('Selecting note.')
    await expect(page).toClick(svg_first_notehead_selector);

    // Confirm that the selected note has been styled accordingly.
    // (I *think* that Jest-Puppeteer does not provide async monitoring of global state,
    // so checking for DOM changes before global state seems generally prudent. This might be worth revisiting.)
    await expect(page).toMatchElement(svg_first_note_selector + `[class*="selectednote"]`);

    log(await page.evaluate('selected[0]'))

    // Confirm that the selected note has been added to the `selected` array.
    await expect(page.evaluate(`window.selected[0].getAttribute('id')`)).resolves.toEqual(svg_first_note_id)

    // Simulate second click on first note (deselecting it).
    log('Deselecting note.')
    await expect(page).toClick(svg_first_notehead_selector);

    // Confirm that the selected note has been styled accordingly.
    await expect(page).toMatchElement(svg_first_note_selector + `:not([class*="selectednote"])`);

    // Confirm that the selected note has been added to the `selected` array.
    await expect(page.evaluate(`window.selected[0]`)).resolves.toBeFalsy();
 });


  it('should extra-toggle a note, ensuring that the relevant array is updated and the note styled accordingly', async function () {

    log(`About to extra-toggle a note`);
    var svg_first_note_id = await page.evaluate(`window.document.querySelector('g.note').getAttribute('id')`);
    var svg_first_note_selector = `#${svg_first_note_id}`;
    var svg_first_notehead_selector = `#${svg_first_note_id} .notehead`;

    // Simulate click on the first note.
    log('Selecting note.')
    await page.keyboard.down('Shift');
    await expect(page).toClick(svg_first_notehead_selector);
    await page.keyboard.up('Shift');

    // Confirm that the selected note has been styled accordingly.
    // (I *think* that Jest-Puppeteer does not provide async monitoring of global state,
    // so checking for DOM changes before global state seems generally prudent. This might be worth revisiting.)
    await expect(page).toMatchElement(svg_first_note_selector + `[class*="extraselectednote"]`);

    // Confirm that the selected note has been added to the `selected` array.
    await expect(page.evaluate(`window.extraselected[0].getAttribute('id')`)).resolves.toEqual(svg_first_note_id);

    // Simulate second click on first note (deselecting it).
    log('Deselecting note.')
    await page.keyboard.down('Shift');
    await expect(page).toClick(svg_first_notehead_selector);
    await page.keyboard.up('Shift');

    // Confirm that the selected note has been styled accordingly.
    await expect(page).toMatchElement(svg_first_note_selector + `:not([class*="extraselectednote"])`);

    // Confirm that the selected note has been added to the `selected` array.
    await expect(page.evaluate(`window.extraselected[0]`)).resolves.toBeFalsy();
  });

  it('should toggle a new relation between structurally unequal notes', async function () {

    // Pick the first two notes for this test.
    var primary_id = await page.evaluate(`window.document.querySelectorAll('g.note')[0].id`);
    var secondary_id = await page.evaluate(`window.document.querySelectorAll('g.note')[1].id`);

    log(`About to create relationship between primary #${primary_id} and secondary #${secondary_id}.`);

    // Simulate click on the first note.
    await page.keyboard.down('Shift');
    await expect(page).toClick(`#${primary_id} .notehead`);
    await page.keyboard.up('Shift');
    log('Selected primary note.')

    // Simulate click on the secondary note.
    await expect(page).toClick(`#${secondary_id} .notehead`);
    log('Selected secondary note.')

    // Enter arpeggio relation via the keyboard shortcut.
    await page.keyboard.press('a');
    log('Created test relation.')

    // // Assert MEI nodes with respective xml:id attributes.
    // // TODO: Understand why the following saner and faster alternative doesn't seem to work.
    // // Note: wrapping in await `expect(async => ())` seems to work. No idea why.
    // await expect(async () => {
    //   await expect(page.evaluate(`window.mei.querySelector('node[*|id*="${primary_id}"]')`)).resolves
    //     .toBeTruthy();
    //   await expect(page.evaluate(`window.mei.querySelector('node[*|id*="${secondary_id}"]')`)).resolves
    //     .toBeTruthy();
    // })

    await expect(page
      .evaluate(`
         Object.entries(window.mei.querySelectorAll('node'))
               .map ( x => x[1].outerHTML
                               .match(/xml:id="gn-${primary_id}"/) ? true : false )`))
      .resolves
      .toIncludeAllMembers([true]);

    await expect(page
      .evaluate(`
         Object.entries(window.mei.querySelectorAll('node'))
               .map ( x => x[1].outerHTML
                               .match(/xml:id="gn-${secondary_id}"/) ? true : false )`))
      .resolves
      .toIncludeAllMembers([true]);

    // Assert relation <arc>'s for primary and secondary notes.
    // TODO: This should likely be revisited for compliance with the TEI-derived standard.
    // See https://github.com/DCMLab/reductive_analysis_app/issues/48.
    var expected_relation_id = await page.evaluate(`window.mei
      .querySelector('arc[to="#gn-${primary_id}"][type="primary"]')
      .getAttribute('from')
      .substring(1)`); // remove the hash prefix from the ID, for consistency.
    log(`Expecting to match the primary-node arc with relation id: #${expected_relation_id}.`);

    await expect(page.evaluate(`window.mei
      .querySelector('arc[to="#gn-${secondary_id}"][type="secondary"][from="#${expected_relation_id}"]')`)).resolves
      .toBeTruthy();
    log(`Found a matching secondary-node arc with the expected relation id: #${expected_relation_id}.`);

    // Assert that a node of type `relation` has been added to the MEI tree.
    await expect(page.evaluate(`
         window.test_relation = Object.entries(window.mei.querySelectorAll('node[type="relation"]'))
                                      .filter( x => x[1]
                                                      .outerHTML
                                                      .match(/xml:id="${expected_relation_id}"/) )[0][1]`
    ))
    .resolves
    .toBeTruthy();

    // Assert a graphic element for the relation.
    await expect(page).toMatchElement(`path#${expected_relation_id}`);

    // Assert that notes are retrievable from the test relation (`relation_get_notes`).
    await expect(page.evaluate(`
      window.test_notes = relation_get_notes(window.mei,
        window.test_relation
      ).map(n => n.getAttribute('xml:id'))
    `)).resolves.toBeTruthy();

    var notes_to_test = await page.evaluate(`window.test_notes`);
    log(`Note id's returned by relation_get_notes: #${notes_to_test[0]} #${notes_to_test[1]}`);
    log(`Primary and secondary note id's to be matched by those of relation_get_notes: #${primary_id} #${secondary_id}`);

    // Assert that the notes retrieved from the relation are valid.
    expect([primary_id, secondary_id]).toIncludeAllMembers(notes_to_test);

    // Assert that primary and secondary notes are retrievable from relations (`relation_get_notes_separated`).
    await expect(page.evaluate(`
      window.test_notes_separated = relation_get_notes_separated(window.mei,
        window.test_relation
      ).map(n => n[0].getAttribute('xml:id'))
    `)).resolves.toBeTruthy();

    var notes_to_test_separated = await page.evaluate(`window.test_notes_separated`);
    log(`Note id's returned by relation_get_notes_separated: #${notes_to_test_separated[0]} #${notes_to_test_separated[1]}`);
    log(`Primary and secondary note id's to be matched by those of relation_get_notes: #${primary_id} #${secondary_id}`);

    // Assert that the notes retrieved from the relation are valid.
    expect([primary_id, secondary_id]).toEqual(notes_to_test_separated);

    // Attempt to press Undo.
    await page.keyboard.press('U');
    log('Pressed Undo via keyboard shortcut.')

    // Confirm that the relation is no longer drawn.
    await expect(page.evaluate(`window.test_relation`)).resolves.toEqual({});

    // Confirm that the relation node is removed from the graph.
    await expect(page.evaluate(`
      document.querySelectorAll('path[id="${expected_relation_id}"]')[0] 
    `)).resolves.toBeNil();

    // Confirm that the relevant note nodes are removed from the graph.
    await expect(page.evaluate(`
      // Checking for any residual nodes is enough because the only possibly remaining
      // (relation) node has already been ruled out.
      window.mei.querySelector('node');  
    `)).resolves.toBeNull();

    // Confirm that the relevant arcs are removed from the graph.
    await expect(page.evaluate(`
      window.mei.querySelector('arc');
    `)).resolves.toBeNull();

  });

  it('should reduce the relation between structurally unequal notes, hiding the less important one', async function () {
    // Re-enter arpeggio relation via the keyboard shortcut.
    await page.keyboard.press('a');
    log('Re-created test relation.')

    // Find and click the reduce button

    // First we need to get the reducebutton to be shown
    await page.keyboard.press('-');
    var buttons_id = "layers-menu-toggle";
    await expect(page).toClick(`#${buttons_id}`);
    await wait(1000)
    var reducebutton_id = "layers-menu-reduce";
    await expect(page).toClick(`#${reducebutton_id}`);

    log('Reduced the test relation.');

    // Check that the secondary note has been hidden
    var secondary_id = await page.evaluate(`window.document.querySelectorAll('g.note')[1].id`);
    await expect(page.evaluate(`
	document.querySelectorAll('g[id="${secondary_id}"]')[0].classList.contains("hidden") `
      )).resolves.toBeTruthy();

    // And also the relation
    var expected_relation_id = await page.evaluate(`window.mei
      .querySelector('arc[to="#gn-${secondary_id}"][type="secondary"]')
      .getAttribute('from')
      .substring(1)`); // remove the hash prefix from the ID, for consistency.
    await expect(page.evaluate(`
	document.querySelectorAll('path[id="${expected_relation_id}"]')[0].classList.contains("hidden") `
      )).resolves.toBeTruthy();
  });

  it('should unreduce the relation, showing it again', async function () {
    // Find and click the unreducebutton
    var unreducebutton_id = "layers-menu-unreduce";
    await expect(page).toClick(`#${unreducebutton_id}`);

    log('Unreduced the test relation.');

    // Check that the secondary note is shown again
    var secondary_id = await page.evaluate(`window.document.querySelectorAll('g.note')[1].id`);
    await expect(page.evaluate(`
	document.querySelectorAll('g[id="${secondary_id}"]')[0].classList.contains("hidden") `
      )).resolves.toBeFalsy();

    // And also the relation
    var expected_relation_id = await page.evaluate(`window.mei
      .querySelector('arc[to="#gn-${secondary_id}"][type="secondary"]')
      .getAttribute('from')
      .substring(1)`); // remove the hash prefix from the ID, for consistency.
    await expect(page.evaluate(`
	document.querySelectorAll('path[id="${expected_relation_id}"]')[0].classList.contains("hidden") `
      )).resolves.toBeFalsy();

    var reducebutton_id = "layers-menu-reduce";

    await expect(page).toClick(`#${reducebutton_id}`);

    log('Re-reduced the test relation.');
  });

});
