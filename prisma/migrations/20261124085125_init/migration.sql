-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('MATCHED', 'REJECTED', 'DUPLICATE', 'LATE', 'UNMATCHED');

-- CreateTable
CREATE TABLE "Bank" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "senderDomain" TEXT NOT NULL,
    "parserKey" TEXT NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Photographer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "inboxAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photographer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePaise" INTEGER NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "photographerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPhoto" (
    "orderId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,

    CONSTRAINT "OrderPhoto_pkey" PRIMARY KEY ("orderId","photoId")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "utr" TEXT,
    "photographerId" TEXT,
    "orderId" TEXT,
    "amountPaise" INTEGER,
    "txnTime" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL,
    "reason" TEXT,
    "rawEmail" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Photographer_id_key" ON "Photographer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Photographer_inboxAddress_key" ON "Photographer"("inboxAddress");

-- CreateIndex
CREATE INDEX "Order_photographerId_status_amountPaise_idx" ON "Order"("photographerId", "status", "amountPaise");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_utr_key" ON "Payment"("utr");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
-- Why: two PENDING orders of one photographer can never share an amount
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_amount ON "Order" ("photographerId", "amountPaise")
WHERE status = 'PENDING';
-- AddForeignKey
ALTER TABLE "Photographer" ADD CONSTRAINT "Photographer_bankCode_fkey" FOREIGN KEY ("bankCode") REFERENCES "Bank"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "Photographer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "Photographer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPhoto" ADD CONSTRAINT "OrderPhoto_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPhoto" ADD CONSTRAINT "OrderPhoto_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "Photographer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
