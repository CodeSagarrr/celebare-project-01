# Framepay demo

Framepay is a local demo of UPI order creation, bank-email verification, and paid photo access. It uses fake photographers, fake bank emails, and local DKIM test keys.

## App setup

1. Install dependencies with `npm install`.
2. Configure `.env` with `DATABASE_URL`, `AUTH_SECRET`, `INGEST_SECRET`, and the Cloudinary settings `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. Apply migrations and seed the two demo photographers and their events/photos:

   ```powershell
   npx prisma migrate deploy
   npm run seed
   ```

   Seeding uploads photos to Cloudinary, so valid upload credentials and permissions are required.
4. Set `DEMO_MODE=true` and the app's `INGEST_SECRET` in `.env`, then start Next.js:

   ```powershell
   npm run dev
   ```

   The demo logins are `asha@example.test` / `AshaDemo123!` and `rohan@example.test` / `RohanDemo123!`. The simulator is at <http://localhost:3000/dev/simulator> and is hidden unless `DEMO_MODE=true`.

## Six payment cases

Choose either photographer on the simulator page and run each case. Each run creates a fresh order and submits a fake email through the same verification and matching services as the ingest route.

| Case | Expected order | Expected payment | Detail |
| --- | --- | --- | --- |
| `success` | `PAID` | `MATCHED` | Signed email, correct amount and UPI ID |
| `fake-sender` | `PENDING` | `REJECTED` | Sender is not allowlisted and email is unsigned |
| `duplicate` | `PAID` | `DUPLICATE` | The same signed UTR is submitted twice; first payment is `MATCHED` |
| `late` | `EXPIRED` | `LATE` | Transaction timestamp is beyond the expiry buffer |
| `wrong-amount` | `PENDING` | `UNMATCHED` | Signed amount does not match a pending order |
| `wrong-receiver` | `PENDING` | `REJECTED` | Signed email credits a different UPI ID |

The simulator's result includes the order and final payment status. The `duplicate` result also includes the first payment status.

The same cases can run from the repository root without starting Next.js or logging in:

```powershell
npm run demo -- success
npm run demo -- fake-sender
npm run demo -- duplicate
npm run demo -- late
npm run demo -- wrong-amount
npm run demo -- wrong-receiver
```

The CLI uses the simulator service directly and requires the database and seeded demo photos.

## Cloudflare Email Worker

The Worker takes `INGEST_URL` and `INGEST_SECRET` from its environment. It forwards the original email text as `rawEmail` with the destination inbox address; it does not replace the message with parsed fields.

For local development, create `worker/.dev.vars` (do not commit it):

```dotenv
INGEST_URL=http://localhost:3000/api/ingest
INGEST_SECRET=the-same-value-as-the-app-INGEST_SECRET
```

In a second terminal:

```powershell
Set-Location worker
npx wrangler dev
```

With Wrangler running at `http://localhost:8787`, create a raw test message from the repository root and send it to the local email-routing endpoint:

```powershell
@"
From: alerts@bank-a.example.test
To: asha@photos.example.test
Subject: Local Worker forwarding check
Date: Fri, 27 Nov 2026 12:00:00 +0530
Message-ID: <local-worker-check@example.test>
Content-Type: text/plain; charset=utf-8

This unsigned message should be saved and rejected by verification.
"@ | Set-Content -Path worker-test.eml -Encoding utf8
curl.exe --request POST "http://localhost:8787/cdn-cgi/local/email?from=alerts%40bank-a.example.test&to=asha%40photos.example.test" --data-binary "@worker-test.eml"
Remove-Item worker-test.eml
```

The Worker should receive HTTP 200 from `/api/ingest`; the app saves the raw message, then rejects it because the message is unsigned. Local email-routing simulation requires the `Message-ID` header. See [Cloudflare's local email-routing guide](https://developers.cloudflare.com/email-service/observability/local-development/routing/) for the endpoint behavior.

For a Cloudflare deployment, from `worker/` configure the ingest endpoint and secret, then deploy:

```powershell
npx wrangler secret put INGEST_URL
npx wrangler secret put INGEST_SECRET
npx wrangler deploy
```

Connect Cloudflare Email Routing to the deployed Worker after deployment. The Worker throws when ingest does not return HTTP 200 so a failed delivery is not treated as successful.

## Checks

Run unit tests, lint, and TypeScript checks:

```powershell
npm test
npm run lint
npx tsc --noEmit
```

For the end-to-end suite, keep the app running with `DEMO_MODE=true`, migrations applied, and seed photos available. From the repository root in PowerShell:

```powershell
$env:E2E_BASE_URL = "http://localhost:3000"
npm run test:e2e
Remove-Item Env:E2E_BASE_URL
```

The suite submits all six cases for both photographers concurrently. It is skipped when `E2E_BASE_URL` is unset.
