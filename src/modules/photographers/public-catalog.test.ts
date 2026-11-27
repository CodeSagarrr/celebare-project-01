import assert from "node:assert/strict";
import { test } from "node:test";
import { searchPublicCatalog, selectedTotalPaise, type PublicPhotographer } from "./public-catalog";

const catalog: PublicPhotographer[] = [
  { id: "p1", name: "Asha Rao", events: [
    { id: "e1", slug: "beach-day", name: "Beach Day", pricePaise: 500, photos: [{ id: "f1", previewUrl: "https://preview.test/a.webp" }] },
    { id: "e2", slug: "city-night", name: "City Night", pricePaise: 600, photos: [] },
  ] },
  { id: "p2", name: "Rohan Das", events: [
    { id: "e3", slug: "garden", name: "Garden", pricePaise: 700, photos: [] },
  ] },
];

test("public search filters events and photographers without exposing asset identifiers", () => {
  assert.deepEqual(searchPublicCatalog(catalog, "  CITY ").map(({ events }) => events.map(({ slug }) => slug)), [["city-night"]]);
  assert.equal(searchPublicCatalog(catalog, "asha")[0]?.events.length, 2);
  assert.equal(JSON.stringify(catalog).includes("originalPublicId"), false);
  assert.equal(selectedTotalPaise(501, 3), 1503);
});
