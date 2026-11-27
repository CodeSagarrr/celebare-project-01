export function toEventResponse<T extends { id: string; name: string; slug: string; pricePaise: number; photos?: Array<{ id: string; previewUrl: string | null }> }>(event: T) {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    pricePaise: event.pricePaise,
    photos: event.photos ?? [],
  };
}
