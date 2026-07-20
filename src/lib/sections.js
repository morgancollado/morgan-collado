// Short newspaper-style section names for display (chips, datelines,
// title cards). Frontmatter, RSS, and JSON-LD keep the full category names.
const SECTION_LABELS = {
  "Engineering Practice": "Practice",
  "Collado CodeWorks": "CodeWorks",
  "Healthcare Compliance Platform": "Compliance",
  "Medical Diagnostics Company": "Diagnostics",
  "Popular Fitness App": "Fitness",
};

export function sectionLabel(category) {
  return SECTION_LABELS[category] ?? category ?? "";
}
