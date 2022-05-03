# Reductive score annotation app

This is an app to facilitate analysing scores using a reductive paradigm.

It is currently very much under construction, but can be tested [here](https://dcmlab.github.io/reductive_analysis_app/index.html)

## Table of contents

- [The basics](#the-basics)
- [A short example](#a-short-example)
- [Hierarchical analysis](#hierarchical-analysis)
  - [Showcase: Schenkerian analysis](#showcase-schenkerian-analysis)
  - [Showcase: GTTM Tree](#showcase-gttm-Tree)
  - [Showcase: MOP annotation](#showcase-mop-annotation)
- [Funding and publications](#funding-and-publications)
- [Development](#development)

## The basics

The basics are as follows:
 
 * Clicking selects notes. Shift-click selects them as _primary_
 * Linking together the selected notes into a _relation_, alternatively
   referred to as a _relation_ can be done either without giving the
   relation a type at all, by clicking one of the preset buttons or their
   key bindings, or by writing a custom type into the text field and
   clicking the "Add relation with custom type" button.
 * Relations with both primary and secondary notes imply a priority among
   the notes. If we add a number of relations such that no circular
   priorities are introduced, we have defined a typ of _hierarchy_ among
   the notes and relations.
 * After having annotated a number of relations/relations, we can _reduce_
   the lowest-ranked notes in our hierarchy by clicking the "Reduce
   Relations" button. We can also select a subset of the existing
   relations to attempt to reduce. The basic algorithm is this: Each
   reduced relation also removes its secondary notes, and leaves its
   primary notes to the next step.  However, any relations that are _not_
   removed in this step needs to have all of its notes remain. Thus, the
   removed relations have, as secondaries, only notes that are removed in
   this step, and the removed notes are only secondaries of removed
   relations.

*Note that the below illustrations all come from a previous version referring to "hyperedges". In the present version these have all been replaced by "relations".*

## A short example

Let us load a familiar piece into the annotation app: Bach's Prelude in C
Major from The Well-tempered Clavier (BWV 846). This is done by selecting
the file from your computer through the file selector at the bottom left. Once
chosen, the app should render it directly as in

![](images/tutorial1.png?raw=true)

This done, we can begin selecting notes by clicking them. We can also select notes as _primary_ by shift-clicking them.

After selecting a number of notes, we can associate them using a relation,
either of some specific type, or untyped. There are a number of predefined
edge types with dedicated buttons and keybindings, and a textfield for
entering a custom type.

Let us select the first E in the upper voice as primary, and the rest of the E's in that measure as secondary:

![](images/tutorial2.png?raw=true)

We can do this either by clicking and shift-clicking the individual notes,
and then either clicking the button marked "Add repeat(+) relation" or
using the "+" keyboard shortcut. However, specifically for the situation
that all the notes of the same pitch in a single bar should be selected and
related as repeats, it is also possible to just select the primary note of
the repeat and then hitting "+".

![](images/tutorial3.png?raw=true)

After having created a number of relations, we can choose to a "Reduce"
step, which hides the "lowest" level of edges, as described above.. For
example, if we have made similar relations for the other parts in the
arpeggio, we can reduce the first bar of the Prelude from this:

![](images/tutorial4.png?raw=true)

To this:

![](images/tutorial5.png?raw=true)

However, this doesn't look very nice, as we only hide the notes, and not
the beams and other things related to notes. We can hide stems and beams
and such things with the button "Toggle (s)tems etc." or the keyboard
shortcut "s".

![](images/tutorial6.png?raw=true)

But this still leaves us with an embarrassing amount of unused space, as
well as unused ledger lines. To rerender the MEI with the removed notes, we
can click the button marked "Rerender less hidden notes" **but beware**! Up
until now, we can undo things to no ill effect (with the button or the "u"
key), but as soon as we rerender, undo is not going to work past that
point. 

Still, let's go ahead:

![](images/tutorial7.png?raw=true)

Much better!

Having done a number of reductions and rerenderings, we can end up with something similar to:

![](images/tutorial8.png?raw=true)

Which starts to be useful for further analysis.

By clicking the "Save" button, you will get the option to save the original
MEI plus the graph as currently envisioned. For example, saving the above
state and then loading the resulting file will show this view:

![](images/tutorial9.png?raw=true)

Which can then be turned into the previous view by first reducing and then
rerendering (and also hiding stems etc.).

## Hierarchical analysis

More exciting possibilities are open by having overlapping and interacting
relations, though this is beyond the scope of this simple example. For
presenting this work as a Late-Breaking Demo at ISMIR2020, the following
illustrative gifs were produced, showcasing some more advanced ideas:

**Update**: In the GIFs below, reference is made to needing to delete edges in order to see relations "behind" them. This is no longer required: instead, by scrolling with the scroll wheel (up or down), the currently highlighted edge is sent to the "bottom" of the stack, showing the edges that were "hidden".

### Showcase: Schenkerian analysis

![](images/schenker.gif?raw=true)

### Showcase: GTTM Tree

![](images/gttm.gif?raw=true)

### Showcase: MOP annotation

![](images/mop.gif?raw=true)


## Funding and publications

The present work has been presented at ISMIR 2020 as a Late-Breaking Demo,
with this [extended abstract](papers/ismir_2020_lbd_extended_abstract.pdf)
and [poster](papers/ismir_2020_lbd_poster.pdf).

This project has received funding from the European Research Council (ERC)
under the European Union's Horizon 2020 research and innovation program
under grant agreement No 760081 – PMSB. We thank Claude Latour
for supporting this research through the Latour Chair in Digital
Musicology. Additionally, the members of the Digital and Cognitive
Musicology Lab (DCML) have contributed valuable insights through
discussions and user testing.

## Building the app

The app is in `/src`. Assets called by the app needs to be compiled using some front-end tooling, detailed below.

### Development

1. Duplicate `.env.example` to `.env` and edit it.
2. Run `npm install` (Node > 12.13) to install all the required packages and tools.
3. Run `npm run dev` and open the URL returned by the CLI.
4. **After a code merge in the main branch**, update the modified build (`npm run build`) and push it, too.

### Production

1. Duplicate `.env.example` to `.env` and edit it.
2. Run `npm install` (Node > 12.13) to install all the required packages and tools.
3. Run `npm run build` to compile the app. The compiled app goes in `/public`.

### Various

- Files in `/src/public` are copied as is (respecting the directory structure in `/src/public`) in the build directory.
- Lint JavaScript: `npm run lint`.
- Run tests with `npm run test`.
