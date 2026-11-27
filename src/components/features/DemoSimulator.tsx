"use client";

import { useState } from "react";

const cases = ["success", "fake-sender", "duplicate", "late", "wrong-amount", "wrong-receiver"] as const;
type DemoCase = (typeof cases)[number];
type Result = { case: DemoCase; photographerId: string; orderStatus: string | null; paymentStatus: string | null; previousPaymentStatus: string | null };

export function DemoSimulator({ photographers }: { photographers: Array<{ id: string; name: string }> }) {
  const [photographerId, setPhotographerId] = useState(photographers[0]?.id ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<DemoCase | null>(null);

  async function run(demoCase: DemoCase) {
    setBusy(demoCase);
    setError("");
    try {
      const response = await fetch("/api/dev/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photographerId, case: demoCase }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Simulation failed");
      setResult(data as Result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Simulation failed");
    } finally {
      setBusy(null);
    }
  }

  return <section className="card stack">
    <label>Photographer<select value={photographerId} onChange={(event) => setPhotographerId(event.target.value)}>
      {photographers.map((photographer) => <option key={photographer.id} value={photographer.id}>{photographer.name}</option>)}
    </select></label>
    <div className="simulator-cases">{cases.map((demoCase) => <button className="button secondary" key={demoCase} disabled={!photographerId || busy !== null} onClick={() => void run(demoCase)}>
      {busy === demoCase ? "Running…" : demoCase.replaceAll("-", " ")}
    </button>)}</div>
    {error && <p role="alert">{error}</p>}
    {result && <pre aria-live="polite">{JSON.stringify(result, null, 2)}</pre>}
  </section>;
}
