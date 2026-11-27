export type PublicPhoto = { id: string; previewUrl: string | null };
export type PublicEvent = {
  id: string;
  slug: string;
  name: string;
  pricePaise: number;
  photos: PublicPhoto[];
};
export type PublicPhotographer = { id: string; name: string; events: PublicEvent[] };

export function searchPublicCatalog(catalog: PublicPhotographer[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return catalog;
  return catalog.flatMap((photographer) => {
    if (photographer.name.toLowerCase().includes(term)) return [photographer];
    const events = photographer.events.filter((event) => event.name.toLowerCase().includes(term));
    return events.length ? [{ ...photographer, events }] : [];
  });
}

export function selectedTotalPaise(pricePaise: number, selectedCount: number) {
  return pricePaise * selectedCount;
}
