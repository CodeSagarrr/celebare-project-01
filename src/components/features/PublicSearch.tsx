"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import Image from "next/image";
import { searchPublicCatalog, type PublicPhotographer } from "@/src/modules/photographers/public-catalog";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

export function PublicSearch({ photographers }: { photographers: PublicPhotographer[] }) {
  const [query, setQuery] = useState("");
  const results = searchPublicCatalog(photographers, query);
  const eventCount = results.reduce((count, photographer) => count + photographer.events.length, 0);

  return <section className="catalog-section" aria-label="Search event photos">
    <label className="search-field">
      <Search aria-hidden="true" size={19} />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search photographer or event" aria-label="Search photographer or event" />
    </label>
    <div className="catalog-heading"><div><p className="eyebrow">The moments</p><h2>Find your gallery</h2></div><span>{eventCount} {eventCount === 1 ? "event" : "events"}</span></div>
    {eventCount === 0 ? <Card className="empty-state"><CardContent>No events match that search. Try another name.</CardContent></Card> :
      <div className="catalog-grid">{results.flatMap((photographer) => photographer.events.map((event) =>
        <Card className="event-card" key={event.id}>
          <div className="event-preview">
            {event.photos.slice(0, 3).map((photo) => photo.previewUrl && <Image key={photo.id} src={photo.previewUrl} width={300} height={145} unoptimized alt="" />)}
            {!event.photos.length && <div className="preview-empty">Gallery coming soon</div>}
          </div>
          <CardHeader><CardDescription>{photographer.name}</CardDescription><CardTitle>{event.name}</CardTitle></CardHeader>
          <CardContent><span className="event-price">₹{(event.pricePaise / 100).toFixed(2)} per photo</span>
            <Button asChild variant="outline"><Link href={`/e/${event.slug}`}>Open gallery <ArrowUpRight aria-hidden="true" /></Link></Button>
          </CardContent>
        </Card>))}</div>}
  </section>;
}
