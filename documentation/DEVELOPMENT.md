# Development information

The source code is still in an initial state, and has not been extensively refactored or documented into any sort of final form. 

However, the basics of organisation and program flow are as follows:

In short, we deal primarily with two XML trees: the MEI that describes the score, and the SVG that is rendered on the page. 

Moreover, we have two separate parts of each of these: the underlying _score_, and the _graph_ that represent the _analysis_. 

We use XML id values to identify elements in each of these parts that correspond to each other (side note: I have not found a good way to make the xml:id attributes of the MEI actually function as XML id:s in the javascript code, which may be browser limitations, or a user error)

For example, when _selecting notes_ in the score, we store a list of the selected _SVG_ elements until we choose to _create a relation_ (by calling `do_relation`). Once we do, we first (in `add_relation`) move to the MEI and _find (or create new) `node` elements_  in the _graph_ part of the MEI, which are _linked_ to the `note` elements in the _score_ part of the MEI (using labels with the `sameas` attribute). We then create a new `node` element in the _graph_ part for our analysed relation and use `arc` elements to link the relation to each of the note nodes, still in the _graph_ part of the MEI. For the rendering of the relation, we call `draw_relation`, which finds the positions of the involved notes and creates a new SVG `path` element with class `relation` and the same ID as the newly created MEI graph `node`.

Conceptually the SVG elements are thus mainly graphical elements with XML id's linking back into the MEI, where the real information and logic happens.

The code in js/conf.js and js/utils.js is relatively self-contained and more or less documented, once the larger organisation is understood.

The javascript in index.html begins with a section of documented global variables. The major thing to note here is that `redo_actions` and `changes`is unused.

After the globals have been declared, we have the code for reading the pre-specified types from js/conf.js, setting their colours and adding the requisite dedicated buttons.

After this follows a number of mostly graphical operations, showing and hiding various elements and changing colours. There is also `toggle_selected` which controls which elements are currently selected and how.

After these functions, we start coming into the meat of things, beginning with `delete_relation`(`s`). The basic call graph tree for these are more or less as follows

 * `delete_relations` calls, for each selected relation
   * `delete_relation`
 * `do_reduce` does a reduction step, as described in the README
 * `do_edges`(deprecated-ish)/`do_relation` calls, as mentioned above,
   * `add_edges`/`add_relation` which does the MEI manipulation, and
   * `draw_edges`/`draw_relation` which adds the graphical elements
   * _except_ if the selection is of relations, in which case `do_relations` switches the selected relations to the type specified in the parameter.
 * `do_undo` undos the action as specified on the `undo_actions` stack, removing/adding/changing elements as needed

After this, we see `handle_keypress` which does exactly that, and then a number of functions handling initial and final file manipulation, saving, loading, finding the graph element of the MEI and drawing it from a stored MEI instead of a new selection, etc. Here we also see the `rerender` function, which in the current placeholder implementation simply removes the currently hidden notes from the MEI and throws the result back at Verovio, which, to be clear, is neither Right nor Proper, as this may misalign notes vertically.

Finally, we have a number of small 1-2-line functions rounding out the source code, before the actual HTML follows.
