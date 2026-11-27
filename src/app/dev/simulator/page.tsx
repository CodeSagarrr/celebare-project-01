import { notFound } from "next/navigation";
import Link from "next/link";
import { DemoSimulator } from "@/src/components/features/DemoSimulator";
import { listDemoPhotographers } from "@/src/modules/ingest/demo-simulator.service";

export const instant = false;

export default async function SimulatorPage() {
  if (process.env.DEMO_MODE !== "true") notFound();
  const photographers = await listDemoPhotographers();
  return <main className="page-shell narrow">
    <header className="site-header"><Link className="brand" href="/">frame<span>pay</span></Link><Link href="/dashboard">Dashboard</Link></header>
    <section className="hero compact"><p className="eyebrow">Local demo only</p><h1>Payment simulator</h1><p className="muted">Send signed sample bank emails through the real verification and matching flow.</p></section>
    <DemoSimulator photographers={photographers} />
  </main>;
}
