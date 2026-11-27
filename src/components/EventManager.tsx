"use client";

import { useState } from "react";

type Photo = { id: string; previewUrl: string | null };
type EventRow = {
  id: string;
  name: string;
  pricePaise: number;
  photos: Photo[];
};

function parseJson<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

export function EventManager({ initialEvents }: { initialEvents: EventRow[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [eventId, setEventId] = useState(initialEvents[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createEvent(form: FormData) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/photographer/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        pricePaise: Number(form.get("pricePaise")),
      }),
    });
    const result = await response.json();
    if (!response.ok) setMessage(result.error ?? "Could not create event.");
    else {
      setEvents((current) => [result, ...current]);
      setEventId(result.id);
      setMessage("Event created.");
    }
    setBusy(false);
  }

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const files = form
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);
    if (!eventId || !files.length) {
      setMessage("Choose an event and at least one photo.");
      return;
    }
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    setBusy(true);
    setProgress(0);
    setMessage("");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/photographer/events/${eventId}/photos`);
    xhr.upload.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable)
        setProgress(
          Math.round((progressEvent.loaded / progressEvent.total) * 100),
        );
    };
    xhr.onload = async () => {
      const result = parseJson<{ error?: string; photos?: Photo[] }>(xhr.responseText);
      if (!result) {
        setMessage(`Upload failed: server returned an unreadable response (HTTP ${xhr.status}).`);
      } else if (xhr.status < 200 || xhr.status >= 300) {
        setMessage(result.error ?? `Upload failed (HTTP ${xhr.status}).`);
      } else if (!Array.isArray(result.photos)) {
        setMessage("Upload completed, but the server response was incomplete.");
      } else {
        try {
          const response = await fetch("/api/photographer/events");
          const updated = parseJson<EventRow[]>(await response.text());
          if (!response.ok || !updated) {
            setMessage("Photos uploaded, but the event list could not be refreshed.");
          } else {
            setEvents(updated);
            setMessage(`${result.photos.length} photo(s) uploaded.`);
          }
        } catch {
          setMessage("Photos uploaded, but the event list could not be refreshed.");
        }
      }
      setBusy(false);
    };
    xhr.onerror = () => {
      setMessage("Upload failed. Check your connection and try again.");
      setBusy(false);
    };
    xhr.send(body);
  }

  return (
    <div className="stack">
      <form className="card stack" action={createEvent}>
        <h2>Create event</h2>
        <label>
          Event name
          <input name="name" required />
        </label>
        <label>
          Price per photo (paise)
          <input name="pricePaise" type="number" min="1" step="1" required />
        </label>
        <button className="button" disabled={busy}>
          Create event
        </button>
      </form>
      <form className="card stack" onSubmit={upload}>
        <h2>Upload event photos</h2>
        <label>
          Event
          <select
            value={eventId}
            onChange={(change) => setEventId(change.target.value)}
            required
          >
            <option value="">Choose event</option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Photo files
          <input
            name="files"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
          />
        </label>
        {busy && (
          <progress max="100" value={progress} aria-label="Upload progress" />
        )}
        <button className="button" disabled={busy || !events.length}>
          {busy ? `Uploading ${progress}%` : "Upload photos"}
        </button>
      </form>
      {events.map((item) => (
        <section className="card" key={item.id}>
          <h2>{item.name}</h2>
          <p>{item.photos.length} photos</p>
        </section>
      ))}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
