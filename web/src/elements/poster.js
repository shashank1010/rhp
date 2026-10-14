// <rhp-poster>: rhp's Poster (a magazine-style panel: kicker, headline, dek, the chart, a note) around the charts it
// holds. It is not a description element: it stands anywhere in the page, is not hidden, and draws its own <figure>
// into itself (light DOM, no shadow root), with its child nodes moved into the figure:
//
//   <rhp-poster look="day" kicker="Fruit" title="Bananas lead" dek="Sold this week" note="Source: the shop">
//     <rhp-chart scale="[0, 30]">...</rhp-chart>
//   </rhp-poster>
//
// draws <rhp-poster><figure class="poster day"><figcaption><span class="kicker">... </figcaption><rhp-chart>...
// </rhp-chart><span class="note">...</span></figure></rhp-poster>.
//
// - Parts: the attributes look, kicker, title, dek and note (strings), or the same names as properties (any content
//   Solid inserts: a string, a Node, a list). `title` is also HTMLElement's own property (and its attribute shows a
//   tooltip over the poster): its property is reached with set("title", v) / get("title"), and a slotted title (below)
//   gives a headline with no tooltip. A property wins over its attribute; set to undefined, the attribute comes back.
// - Rich parts: a child with slot="kicker" | "title" | "dek" | "note" is moved into that part (several children with the
//   same slot, in their order), and wins over the attribute and the property.
// - Every other child (the <rhp-chart>s, other elements, text that is not blank) becomes the figure's children, in DOM
//   order. Blank text, comments, <template>, <script>, <style> and <link> stay in the host.
// - Add or remove children on the <rhp-poster> itself (not inside the figure): the poster then draws again from its
//   children (the charts are moved, which keeps them drawn). A child's slot is read when the poster draws.
// - Lifecycle as <rhp-chart>: drawn in a microtask after it connects, kept when it is moved in the page, and disposed in
//   a microtask once it is out of the page, its children moved back into it in their order (so it draws again when put
//   back). Its look is the page's CSS (@shashank1010/rhp-web/posters.css has the gallery's looks); the host is an inline
//   element unless the page says otherwise (rhp-poster { display: block }).
import { createRoot, createComponent } from "solid-js";
import { Poster } from "@bezda/rhp";
import { Model, adopt, defineAccessors } from "../model.js";

export const POSTER = { look: "string", kicker: "string", title: "string", dek: "string", note: "string" };
const PARTS = ["kicker", "title", "dek", "note"];
const SKIP = new Set(["TEMPLATE", "SCRIPT", "STYLE", "LINK"]);

let domReady;
const contentLoaded = () => (domReady ??= new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true })));

export class RhpPoster extends HTMLElement {

  static observedAttributes = Object.keys(POSTER);

  #dispose = null; // the root's dispose while the poster is drawn
  #figure = null;
  #nodes = []; // the host's child nodes when it was drawn, in order
  #scheduled = false;
  #leaving = false; // disconnected, and disposed in a microtask unless connected again
  #adopted = false;
  #observer = null;

  constructor() {
    super();
    // Not enumerable, so it is not taken for a property set before the upgrade (see adopt)
    Object.defineProperty(this, "model", { value: new Model({ schema: POSTER }) });
  }

  connectedCallback() {

    this.#leaving = false;
    if (!this.#adopted) {
      this.#adopted = true;
      adopt(this, (key) => key in POSTER, (key, v) => this.model.set(key, v));
    }
    this.model.attributes(this);
    if (!this.#dispose) this.#schedule();
  }

  disconnectedCallback() {

    this.#leaving = true;
    queueMicrotask(() => {
      if (!this.#leaving || this.isConnected) return;
      this.#leaving = false;
      this.#teardown();
    });
  }

  attributeChangedCallback(name) {
    this.model.attribute(this, name);
  }

  // Never synchronously (a classic script in <head> upgrades the element at its start tag, before its children)
  #schedule() {

    if (this.#scheduled) return;
    this.#scheduled = true;
    const go = () => queueMicrotask(() => {
      this.#scheduled = false;
      if (!this.isConnected) return;
      this.#teardown();
      this.#build();
    });
    if (document.readyState === "loading" && !this.firstChild) contentLoaded().then(go);
    else go();
  }

  #build() {

    const nodes = (this.#nodes = [...this.childNodes]);
    const slots = Object.fromEntries(PARTS.map((k) => [k, []]));
    const children = [];
    for (const n of nodes) {
      if (n.nodeType === 1) {
        const slot = n.getAttribute("slot");
        if (slot && PARTS.includes(slot)) slots[slot].push(n);
        else if (!SKIP.has(n.tagName)) children.push(n);
      } else if (n.nodeType === 3 && n.data.trim() !== "") {
        children.push(n);
      }
    }

    const store = this.model.store;
    const part = (k) => (slots[k].length ? slots[k] : store[k]);
    createRoot((dispose) => {
      this.#dispose = dispose;
      // Solid inserts the Nodes, which moves them into the figure and its parts
      this.#figure = createComponent(Poster, {
        get look() {
          return store.look;
        },
        get kicker() {
          return part("kicker");
        },
        get title() {
          return part("title");
        },
        get dek() {
          return part("dek");
        },
        get note() {
          return part("note");
        },
        children,
      });
      this.appendChild(this.#figure);
    });

    // Children added to (or removed from) the host draw the poster again
    this.#observer = new MutationObserver(() => this.#schedule());
    this.#observer.observe(this, { childList: true });
  }

  #teardown() {

    this.#observer?.disconnect();
    this.#observer = null;
    if (!this.#dispose) return;
    const figure = this.#figure;
    // The nodes the poster took come back to the host in their order (those moved elsewhere since are left there)
    const at = figure.parentNode === this ? figure : null;
    for (const n of this.#nodes) {
      if (n.parentNode === this || figure.contains(n)) this.insertBefore(n, at);
    }
    this.#dispose();
    figure.remove();
    this.#dispose = this.#figure = null;
    this.#nodes = [];
  }

  // The rendered <figure class="poster"> (null until the poster is drawn)
  get figure() {
    return this.#figure;
  }

  // Any part by name, also title (HTMLElement's own title property is the attribute)
  set(key, v) {
    this.model.set(key, v);
  }

  get(key) {
    return this.model.get(key);
  }
}

defineAccessors(RhpPoster.prototype, Object.keys(POSTER));
