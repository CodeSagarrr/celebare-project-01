"use client";

import { useState } from "react";

type Settings = {
  name: string;
  upiId: string;
  bankCode: string;
  inboxAddress: string;
};
type Bank = { code: string; name: string };

export function PhotographerSettingsForm({
  initial,
  banks,
}: {
  initial: Settings;
  banks: Bank[];
}) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/photographer/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMessage(
      response.ok
        ? "Settings saved."
        : ((await response.json()).error ?? "Could not save settings."),
    );
    setBusy(false);
  }
  async function testEmail() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/photographer/settings/test-email", {
      method: "POST",
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? `Test message accepted for ${result.sentTo}.`
        : (result.error ?? "Test failed."),
    );
    setBusy(false);
  }
  return (
    <form className="card stack" onSubmit={save}>
      <label>
        Photographer name
        <input
          value={settings.name}
          onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          required
        />
      </label>
      <label>
        UPI ID
        <input
          value={settings.upiId}
          onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
          required
        />
      </label>
      <label>
        Bank
        <select
          value={settings.bankCode}
          onChange={(e) =>
            setSettings({ ...settings, bankCode: e.target.value })
          }
        >
          {banks.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Inbox address
        <input
          type="email"
          value={settings.inboxAddress}
          onChange={(e) =>
            setSettings({ ...settings, inboxAddress: e.target.value })
          }
          required
        />
      </label>
      <div className="controls">
        <button className="button" disabled={busy}>
          Save settings
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={busy}
          onClick={testEmail}
        >
          Send test email
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
