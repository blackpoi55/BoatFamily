-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('PRIVATE', 'SHARED', 'TAGGED');

-- CreateEnum
CREATE TYPE "ReminderFrequency" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BillFrequency" AS ENUM ('ONCE', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "phoneNumber" TEXT,
    "birthDate" DATE,
    "bloodType" TEXT,
    "allergies" TEXT,
    "emergencyContact" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'th',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "replyToId" UUID,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE',
    "color" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_tags" (
    "noteId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "note_tags_pkey" PRIMARY KEY ("noteId","userId")
);

-- CreateTable
CREATE TABLE "note_comments" (
    "id" UUID NOT NULL,
    "noteId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "ReminderFrequency" NOT NULL DEFAULT 'ONCE',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "cronExpr" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "nextFireAt" TIMESTAMP(3),
    "lastFiredAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_recipients" (
    "reminderId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "reminder_recipients_pkey" PRIMARY KEY ("reminderId","userId")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "frequency" "BillFrequency" NOT NULL DEFAULT 'MONTHLY',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "notifyDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "iconKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_participants" (
    "billId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "shareAmount" DECIMAL(12,2),
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "bill_participants_pkey" PRIMARY KEY ("billId","userId")
);

-- CreateTable
CREATE TABLE "payment_slips" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "category" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "color" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rsvp" TEXT,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "shopping_items" (
    "id" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "category" TEXT,
    "note" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedById" UUID,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_albums" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" UUID NOT NULL,
    "albumId" UUID NOT NULL,
    "uploaderId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT,
    "caption" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "notes_authorId_idx" ON "notes"("authorId");

-- CreateIndex
CREATE INDEX "notes_visibility_idx" ON "notes"("visibility");

-- CreateIndex
CREATE INDEX "note_comments_noteId_idx" ON "note_comments"("noteId");

-- CreateIndex
CREATE INDEX "reminders_nextFireAt_enabled_idx" ON "reminders"("nextFireAt", "enabled");

-- CreateIndex
CREATE INDEX "bills_dueDate_status_idx" ON "bills"("dueDate", "status");

-- CreateIndex
CREATE INDEX "payment_slips_billId_idx" ON "payment_slips"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "calendar_events_startAt_idx" ON "calendar_events"("startAt");

-- CreateIndex
CREATE INDEX "shopping_items_checked_idx" ON "shopping_items"("checked");

-- CreateIndex
CREATE INDEX "photos_albumId_idx" ON "photos"("albumId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_comments" ADD CONSTRAINT "note_comments_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_comments" ADD CONSTRAINT "note_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_recipients" ADD CONSTRAINT "reminder_recipients_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_recipients" ADD CONSTRAINT "reminder_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_participants" ADD CONSTRAINT "bill_participants_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_participants" ADD CONSTRAINT "bill_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_slips" ADD CONSTRAINT "payment_slips_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_slips" ADD CONSTRAINT "payment_slips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_albums" ADD CONSTRAINT "photo_albums_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "photo_albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
