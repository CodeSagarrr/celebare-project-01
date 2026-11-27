import { notFound } from "next/navigation";
import Link from "next/link";
import { EventGallery } from "@/src/components/features/EventGallery";
import { getPublicEvent } from "@/src/modules/photographers/photographer.service";

export const instant = false;

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();
  return <main className="page-shell">
    <header className="site-header"><Link className="brand" href="/">frame<span>pay</span></Link><Link href="/">Search galleries</Link></header>
    <EventGallery event={event} />
  </main>;
}
