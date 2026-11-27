import { notFound } from "next/navigation";
import Link from "next/link";
import { EventGallery } from "@/src/components/features/EventGallery";
import { SiteHeader } from "@/src/components/features/site-header";
import { getPublicEvent } from "@/src/modules/photographers/photographer.service";

export const instant = false;

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();
  return <main className="page-shell">
    <SiteHeader><Link href="/">Search galleries</Link></SiteHeader>
    <EventGallery event={event} />
  </main>;
}
