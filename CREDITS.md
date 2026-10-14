# Credits

rhp is MIT licensed: see [LICENSE](LICENSE).
The files listed here came from elsewhere and keep their own licences, which the MIT license does not cover.

## Fruit art, in the bar chart example

`examples/gallery/assets/` — banana, grape, orange, peach, pear, strawberry, watermelon (7 SVGs).

From FreeVector.com, "Flat Colorful Fruits": <https://www.freevector.com/flat-colorful-fruits-26803>.
Credited in the gallery page that shows them, in `examples/gallery/page.jsx`.

Licence still to be confirmed from that item page.
FreeVector's terms differ per item, and some require attribution or rule out commercial use.

## Cloud photographs, in the box plot example

`examples/gallery/assets/` — altocumulus, cirrocumulus, cirrus, cumulonimbus, cumulus, nimbostratus, stratocumulus (7 JPEGs).

From Wikimedia Commons.
The copies here were resized to 640px and stripped of their metadata, so the source cannot be read back out of the files.
Each one's file page, author and licence still to be recorded:

| File | Commons file page | Author | Licence |
|---|---|---|---|
| `altocumulus.jpg` | | | |
| `cirrocumulus.jpg` | | | |
| `cirrus.jpg` | | | |
| `cumulonimbus.jpg` | | | |
| `cumulus.jpg` | | | |
| `nimbostratus.jpg` | | | |
| `stratocumulus.jpg` | | | |

A photograph under CC BY or CC BY-SA has to name its author and its licence where it is shown, so once these are known, credit them on the box plot page as the fruit art is credited.
A photograph under CC0 or in the public domain needs no credit, but is worth recording here anyway.

## Fonts

The gallery's posters name fonts; none are bundled with the package. rhp itself ships no fonts, images or other media: `files: ["dist"]` in package.json publishes only the built library.

## CodeMirror, in the web examples' editor

`web/examples/vendor/codemirror.js` — CodeMirror 6 (codemirror 6.0.2, @codemirror/view 6.43.14, @codemirror/state 6.7.6, @codemirror/lang-html 6.4.12, @codemirror/lang-javascript 6.2.5, @codemirror/theme-one-dark 6.1.3, @codemirror/merge 6.12.2), bundled into one file with esbuild from `web/examples/vendor/codemirror.entry.js`.

MIT License, Copyright (C) 2018-2021 by Marijn Haverbeke and others: <https://codemirror.net>. The licence text is at the top of the file.
