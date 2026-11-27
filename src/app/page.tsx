import { PublicSearch } from "@/src/components/features/PublicSearch";
import { listPhotographerCatalog } from "@/src/modules/photographers/photographer.service";
import Link from "next/link";

export const instant = false;

// Shows the seeded photographer and event catalog from the server database.
export default async function HomePage() {
  const photographers = await listPhotographerCatalog();
  return <main className="page-shell">
    <header className="site-header"><Link className="brand" href="/">frame<span>pay</span></Link><nav><Link href="/login">Photographer login</Link></nav></header>
    <section className="hero"><p className="eyebrow">Event photos · direct UPI</p><h1>Find your moment.</h1><p className="muted">Choose the photos you love, then pay directly to the photographer.</p></section>
    <PublicSearch photographers={photographers} />
  </main>;
}
