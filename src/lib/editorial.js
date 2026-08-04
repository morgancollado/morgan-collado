/**
 * Shared editorial surface tokens.
 *
 * The site's colors are currently written as inline `t.palette.mode === ...`
 * ternaries at each use site. This file is the seam for consolidating them —
 * new code imports from here so it doesn't add more copies. Existing pages are
 * deliberately left alone; migrating them is its own change.
 *
 * Each helper has the shape `sx` already expects for a theme callback.
 */

export const SERIF_BODY =
  "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

export const paper = (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14");
export const ink = (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8");
export const muted = (t) => (t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d");
export const dim = (t) => (t.palette.mode === "light" ? "#7a6c5e" : "#9e958a");
export const plate = (t) => (t.palette.mode === "light" ? "#f0ebe2" : "#1a1620");

/** Page ground: background + body text, the pairing every page opens with. */
export const surfaceSx = { bgcolor: paper, color: ink };

/**
 * Focus ring used across the poetry section. Matches the treatment already in
 * navbar.js so keyboard focus looks the same everywhere on the site.
 */
export const focusRingSx = {
  "&:focus-visible": {
    outline: "2px solid",
    outlineColor: "poetry.main",
    outlineOffset: "3px",
  },
};
