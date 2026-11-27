import { LoginForm } from "@/src/components/LoginForm";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/src/components/features/site-header";

async function LoginContent() {
  await connection();
  const session = await auth();
  if (session?.user.photographerId) redirect("/dashboard");
  return (
    <>
      <LoginForm />
      <p className="muted">
        Demo accounts: asha@example.test / AshaDemo123! and rohan@example.test /
        RohanDemo123!
      </p>
    </>
  );
}

function LoginFallback() {
  return <section className="card" aria-busy="true" aria-live="polite"><p className="muted">Loading sign-in…</p></section>;
}

export default function LoginPage() {
  return (
    <main className="page-shell narrow">
      <SiteHeader><Link href="/">Browse galleries</Link></SiteHeader>
      <section className="hero compact">
        <p className="eyebrow">Photographer account</p>
        <h1>Log in or sign up</h1>
      </section>
      <Suspense fallback={<LoginFallback />}><LoginContent /></Suspense>
    </main>
  );
}
