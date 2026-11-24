import PostalMime from "postal-mime";

export interface Env {
  INGEST_URL: string;
  INGEST_SECRET: string;
}

type EmailMessage = {
  to: string;
  raw: ReadableStream<Uint8Array>;
};

// Parses for the recipient and forwards the original bank message for verification.
async function handleEmail(message: EmailMessage, env: Env): Promise<void> {
  const rawEmail = await new Response(message.raw).text();
  const parsedEmail = await PostalMime.parse(rawEmail);
  const inboxAddress = message.to || parsedEmail.to?.[0]?.address || "";
  if (!inboxAddress) throw new Error("Email has no recipient address");
  const response = await fetch(env.INGEST_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": env.INGEST_SECRET,
    },
    body: JSON.stringify({ rawEmail, to: inboxAddress }),
  });
  if (response.status !== 200)
    throw new Error(`Ingest endpoint returned ${response.status}`);
}

export default { email: handleEmail };
