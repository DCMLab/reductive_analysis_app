## Reductive score annotation app

This is an app to facilitate analysing scores using a reductive paradigm.

It is currently very much under construction, but can be tested [here](https://dcmlab.github.io/reductive_analysis_app/index.html)

The basics are as follows:
 
 * Clicking selects notes. Shift-click selects them as _primary_
 * With a number of notes selected, you can _add edges_ between them.
 * However, the more interesting things happen when you _add hyperedges_,
   especially with some primary selections
 * After having created a number of hyperedges, you can _reduce_ the
   notes that are only secondary to existing hyperedges. In particular,
   this reduces any _hyperedges_ for which all of its _secondary_ notes are
   _only secondary_, as well as said notes. Reducing again will then remove
   the "next layer" of hyperedges. If there are no cyclical dependencies
   between hyperedges (e.g. hyperedge A has note x as primary and y as
   secondary, while hyperedge B has them the other way around), this will
   eventually reduce away all hyperedges.

# A short example

Let us load a familiar piece into the annotation app: Bach's Prelude in C Major from The Well-tempered Clavier (BWV 846). This is done by selecting the file from your computer through the file selector at the top left. Once chosen, the app should render it directly as in

![](tutorial1.png?raw=true)

This done, we can begin selecting notes by clicking them. We can also select notes as _primary_ by shift-clicking them.

After selecting a number of notes, we can associate them using a hyperedge. For now, these are untyped, and the semantics are simply that the _primary_ notes are somehow more important than the secondary ones.

Let us select the first E in the upper voice as primary, and the rest of the E's in that measure as secondary:

![](tutorial2.png?raw=true)

We can do this either by clicking and shift-clicking the individual notes, or by selecting the first note, and then using the "Select similar notes" button (keyboard shortcut: +)

This done, we can add a hyperedge connecting these notes, with the "Add hyperedge" button (keyboard shortcut: h):

![](tutorial3.png?raw=true)

After having created a number of hyperedges, we can choose to a "Reduce" step, which hides the "lowest" level of edges (i.e. those for which no secondary note is a primary note in some other edge). For example, if we have made similar hyperedges for the other parts in the arpeggio, we can reduce the first bar of the Prelude from this:

![](tutorial4.png?raw=true)

To this:

![](tutorial5.png?raw=true)

However, this doesn't look very nice, as we only hide the notes, and not the beams and other things related to notes. We can hide stems and beams and such things with the button "Toggle stems etc." or the keyboard shortcut "s".

![](tutorial6.png?raw=true)

But this still leaves us with an embarrassing amount of unused space, as well as unused ledger lines. To rerender the MEI with the removed notes, we can click the button marked "Rerender less hidden notes" **but beware**! Up until now, we can undo things to no ill effect, but as soon as we rerender, Undo is not going to work very well past the point of last render (though it it still possible - this is a bug, and will be fixed).

Still, let's go ahead:

![](tutorial7.png?raw=true)

Much better!

Having done a number of reductions, you can end up with something similar to:

![](tutorial8.png?raw=true)

Which starts to be useful for further analysis.

By clicking the "Save" button, you will get the option to save the original MEI plus the graph as currently envisioned. For example, saving the above state and then loading the resulting file will show this view:

![](tutorial9.png?raw=true)

Which can then be turned into the previous view by first reducing and then rerendering (and also hiding stems etc.).

More exciting possibilities are open by having overlapping and interacting hyperedges, though this is beyond the scope of this simple example.
