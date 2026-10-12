import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStanzas, poemAlign } from "./stanzas.js";

const NBSP = " ";

test("splits stanzas on blank lines and lone dashes", () => {
  assert.deepEqual(parseStanzas("a\nb\n\nc\n–\nd"), [
    [
      { text: "a", align: "left" },
      { text: "b", align: "left" },
    ],
    [{ text: "c", align: "left" }],
    [{ text: "d", align: "left" }],
  ]);
});

test("keeps a line of non-breaking spaces as verse", () => {
  assert.deepEqual(parseStanzas(`a\n${NBSP}${NBSP}\nb`), [
    [
      { text: "a", align: "left" },
      { text: `${NBSP}${NBSP}`, align: "left" },
      { text: "b", align: "left" },
    ],
  ]);
});

test("every line takes the poem's align by default", () => {
  assert.deepEqual(parseStanzas("a\n\nb", "center"), [
    [{ text: "a", align: "center" }],
    [{ text: "b", align: "center" }],
  ]);
});

test("a tag opening a line sets that line only", () => {
  assert.deepEqual(parseStanzas("a\n{right} b\nc"), [
    [
      { text: "a", align: "left" },
      { text: "b", align: "right" },
      { text: "c", align: "left" },
    ],
  ]);
});

test("a tag alone sets the rest of the stanza, then resets", () => {
  assert.deepEqual(parseStanzas("a\n{right}\nb\nc\n–\nd", "center"), [
    [
      { text: "a", align: "center" },
      { text: "b", align: "right" },
      { text: "c", align: "right" },
    ],
    [{ text: "d", align: "center" }],
  ]);
});

test("a line tag inside a tagged stanza wins for its line", () => {
  assert.deepEqual(parseStanzas("{right}\na\n{center} b\nc"), [
    [
      { text: "a", align: "right" },
      { text: "b", align: "center" },
      { text: "c", align: "right" },
    ],
  ]);
});

test("one space after a tag is separator; the rest is kept", () => {
  assert.deepEqual(parseStanzas("{right}   b\n{left}c"), [
    [
      { text: "  b", align: "right" },
      { text: "c", align: "left" },
    ],
  ]);
});

test("a tag alone with trailing spaces is still a stanza tag", () => {
  assert.deepEqual(parseStanzas("{right}  \na"), [
    [{ text: "a", align: "right" }],
  ]);
});

test("braces around more than one word are verse", () => {
  assert.deepEqual(parseStanzas("{a whisper} said"), [
    [{ text: "{a whisper} said", align: "left" }],
  ]);
});

test("an unknown tag fails with its line", () => {
  assert.throws(
    () => parseStanzas("a\n{rigth} b"),
    /Unknown alignment tag \{rigth\}.* on line 2 of the poem body: "\{rigth\} b"/
  );
  assert.throws(() => parseStanzas("{Right}\na"), /Unknown alignment tag/);
});

test("a stanza tag that sets no lines fails", () => {
  const idle = /Alignment tag sets no lines on line 2/;
  // At the end of the poem.
  assert.throws(() => parseStanzas("a\n{right}"), idle);
  // Before a stanza break.
  assert.throws(() => parseStanzas("a\n{right}\n\nb"), idle);
  // Replaced by another before any line.
  assert.throws(() => parseStanzas("a\n{right}\n{center}\nb"), idle);
  // Only line-tagged lines follow it.
  assert.throws(() => parseStanzas("a\n{right}\n{center} b"), idle);
});

test("the poem's align accepts left, center and right", () => {
  assert.equal(poemAlign(undefined), "left");
  assert.equal(poemAlign(null), "left");
  assert.equal(poemAlign("center"), "center");
  assert.equal(poemAlign("right"), "right");
  assert.throws(() => poemAlign("centre"), /Unknown align "centre"/);
});
