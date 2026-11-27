ALTER TABLE "Photographer"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "slug" TEXT;

UPDATE "Photographer"
SET "email" = 'legacy-' || lower("id") || '@invalid.example',
    "passwordHash" = 'disabled-account',
    "slug" = lower(regexp_replace("id", '[^a-zA-Z0-9]+', '-', 'g'));

ALTER TABLE "Photographer"
  ALTER COLUMN "email" SET NOT NULL,
  ALTER COLUMN "passwordHash" SET NOT NULL,
  ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Photographer_email_key" ON "Photographer"("email");
CREATE UNIQUE INDEX "Photographer_slug_key" ON "Photographer"("slug");

ALTER TABLE "Event"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "eventDate" TIMESTAMP(3);

UPDATE "Event"
SET "slug" = lower(regexp_replace("id", '[^a-zA-Z0-9]+', '-', 'g'));

ALTER TABLE "Event" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

ALTER TABLE "Photo"
  ADD COLUMN "originalPublicId" TEXT,
  ADD COLUMN "previewUrl" TEXT;

ALTER TABLE "Order" ALTER COLUMN "id" DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_amount
  ON "Order" ("photographerId", "amountPaise")
  WHERE status = 'PENDING';
