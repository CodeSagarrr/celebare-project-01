"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Photo = { id: string; storageKey: string };
type Event = { id: string; name: string; pricePaise: number; photos: Photo[] };
type Photographer = { id: string; name: string; events: Event[] };

// Lets a guest select photos and create a paise-priced order.
export function PhotoGrid({ photographers }: { photographers: Photographer[] }) {
  const router = useRouter();
  const [photographerId, setPhotographerId] = useState(photographers[0]?.id ?? "");
  const photographer = photographers.find((item) => item.id === photographerId);
  const [eventId, setEventId] = useState(photographer?.events[0]?.id ?? "");
  const event = photographer?.events.find((item) => item.id === eventId);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const totalPaise = (event?.pricePaise ?? 0) * selected.length;

  // Clears photo selections whenever the guest changes the event.
  function choosePhotographer(id: string) {
    setPhotographerId(id);
    const firstEvent = photographers.find((item) => item.id === id)?.events[0];
    setEventId(firstEvent?.id ?? "");
    setSelected([]);
  }

  // Toggles one photo in the order selection.
  function togglePhoto(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  // Creates the order on the server and opens its refresh-safe checkout URL.
  async function pay() {
    if (!event || selected.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId: event.id, photoIds: selected }),
      });
      const result = await response.json() as { orderId?: string; error?: string };
      if (!response.ok || !result.orderId) throw new Error(result.error ?? "Could not create order");
      router.push(`/pay/${result.orderId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create order");
      setBusy(false);
    }
  }

  if (!photographer) return <p>No photographers are set up. Run the seed command first.</p>;
  return (
    <div className="stack">
      <div className="controls">
        <label>Photographer<select value={photographerId} onChange={(event) => choosePhotographer(event.target.value)}>
          {photographers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label>Event<select value={event?.id ?? ""} onChange={(change) => { setEventId(change.target.value); setSelected([]); }}>
          {photographer.events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
      </div>
      {event && <>
        <div className="photo-grid">
          {event.photos.map((photo, index) => <button className={`photo-tile ${selected.includes(photo.id) ? "selected" : ""}`} key={photo.id} onClick={() => togglePhoto(photo.id)} type="button">
            <span className="photo-placeholder">{String(index + 1).padStart(2, "0")}</span>
            <span>{photo.storageKey}</span>
            <span>{selected.includes(photo.id) ? "Selected" : "Select photo"}</span>
          </button>)}
        </div>
        <div className="checkout-bar"><span>{selected.length} photos · ₹{Math.floor(totalPaise / 100)}.{String(totalPaise % 100).padStart(2, "0")}</span>
          <button className="button" disabled={!selected.length || busy} onClick={pay}>{busy ? "Creating…" : "Pay"}</button>
        </div>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
