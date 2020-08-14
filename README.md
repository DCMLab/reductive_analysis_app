**Reductive score annotation app**

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

