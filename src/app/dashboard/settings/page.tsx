import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/src/modules/photographers/settings.service";
import { PhotographerSettingsForm } from "@/src/components/PhotographerSettingsForm";
import Link from "next/link";
import { SignOutButton } from "@/src/components/SignOutButton";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/src/components/features/site-header";

async function SettingsContent() {
  await connection();
  const session = await auth();
  if (!session?.user.photographerId) redirect("/login");
  const [settings, banks] = await getSettings(session.user.photographerId);
  if (!settings) redirect("/login");
  return (
    <main className="page-shell narrow">
      <SiteHeader><Link href="/dashboard">Dashboard</Link><SignOutButton /></SiteHeader>
      <section className="hero compact">
        <p className="eyebrow">Photographer account</p>
        <h1>Settings</h1>
        <p className="muted">
          Manage where UPI payments go and where bank notices arrive.
        </p>
      </section>
      <PhotographerSettingsForm initial={settings} banks={banks} />
    </main>
  );
}

function SettingsFallback() {
  return <main className="page-shell narrow" aria-busy="true"><section className="hero compact"><p className="eyebrow">Photographer account</p><h1>Settings</h1><p className="muted">Loading your settings.</p></section></main>;
}

export default function SettingsPage() {
  return <Suspense fallback={<SettingsFallback />}><SettingsContent /></Suspense>;
}
