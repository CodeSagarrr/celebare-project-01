"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    const mode = String(formData.get("mode"));
    const values = Object.fromEntries(formData.entries());
    if (mode === "signup") {
      if (!values.name || !values.upiId || !values.inboxAddress) {
        setError("Enter your name, UPI ID, and inbox address to create an account."); setBusy(false); return;
      }
      const response = await fetch("/api/photographers", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
      });
      if (!response.ok) { setError((await response.json()).error ?? "Signup failed"); setBusy(false); return; }
    }
    const result = await signIn("credentials", {
      email: values.email, password: values.password, redirect: false,
    });
    if (result?.error) { setError("Email or password is incorrect"); setBusy(false); return; }
    router.push("/dashboard");
  }
  return <form className="card stack" action={submit}>
    <label>Name (for signup)<input name="name" autoComplete="name" /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
    <label>UPI ID (for signup)<input name="upiId" /></label>
    <label>Bank<select name="bankCode"><option value="DEMO_A">Demo Bank A</option><option value="DEMO_B">Demo Bank B</option></select></label>
    <label>Inbox address (for signup)<input name="inboxAddress" type="email" /></label>
    {error && <p role="alert">{error}</p>}
    <div className="controls"><button className="button" name="mode" value="login" disabled={busy}>Log in</button><button className="button secondary" name="mode" value="signup" disabled={busy}>Create account</button></div>
  </form>;
}
