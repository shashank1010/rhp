// What the elements look up by tag name: slat definitions (tag -> its custom element class) and the description
// elements a chart reads (tag -> the function that turns one into its part of the Solid tree).
import { getOwner, onCleanup } from "solid-js";

// Marks a slat class (RhpSlat and its subclasses), so a class someone defined with customElements.define is found too
export const IS_SLAT = Symbol.for("rhp-web.slat");

const slats = new Map(); // tag -> slat class
const descriptions = new Map(); // tag -> (element) => JSX

export function registerSlat(tag, Class) {
  slats.set(tag.toLowerCase(), Class);
}

// The slat class for a tag: one made by slat(), or any class extending RhpSlat defined under that tag
export function lookupSlat(tag) {

  const name = tag.toLowerCase();
  const known = slats.get(name);
  if (known) return known;

  const Class = typeof customElements !== "undefined" ? customElements.get(name) : undefined;
  if (Class && Class[IS_SLAT]) {
    slats.set(name, Class);
    return Class;
  }

  return undefined;
}

export function registerDescription(tag, build) {
  descriptions.set(tag.toLowerCase(), build);
}

export function descriptionOf(node) {
  return node?.nodeType === 1 ? descriptions.get(node.localName) : undefined;
}

export const isDescription = (node) => descriptionOf(node) != null;

// An error in one element's description (a bad template, a slat that is not defined) is reported, like an uncaught
// error, and only that element is skipped: the rest of its chart keeps drawing and following its description
export function report(e) {

  if (typeof reportError === "function") reportError(e);
  else console.error(e);
}

// A custom element name (lower case, starting with a letter, with a dash). Written with escapes, so that the built file
// stays ASCII and reads the same whatever charset a page decodes it with.
export const VALID_NAME = /^[a-z][a-z0-9._\u00b7\u00c0-\uffff-]*-[a-z0-9._\u00b7\u00c0-\uffff-]*$/;

// Elements (<rhp-plot>, <rhp-scale>) waiting for a slat tag to be defined: tag -> the elements to tell. One
// whenDefined per tag, and an element is only in the set while what it draws is alive (it leaves with the owner that
// asked, the memo of its chart's tree that reads its source): a tag that is never defined (misspelled, its script never
// loaded) does not keep charts that were removed from the page.
const waiting = new Map();

// The set of elements waiting for a tag, made with its one whenDefined. A function of its own: the reaction's closure
// must not have the element in its scope (a closure keeps its whole scope alive).
function waitersOf(name) {

  let set = waiting.get(name);
  if (set) return set;
  const tell = (set = new Set());
  waiting.set(name, set);
  customElements.whenDefined(name).then(() => {
    if (waiting.get(name) === tell) waiting.delete(name);
    for (const e of [...tell]) e.childrenChanged();
    tell.clear();
  });

  return set;
}

// True (and el.childrenChanged() is called once the tag is defined) when tag is a custom element name not defined yet
export function waitForTag(tag, el) {

  const name = tag.toLowerCase();
  if (!VALID_NAME.test(name) || customElements.get(name)) return false;
  const set = waitersOf(name);
  set.add(el);
  if (getOwner()) onCleanup(() => set.delete(el));

  return true;
}
