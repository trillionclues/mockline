-- AlterTable
ALTER TABLE "mock_servers" ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "label" TEXT,
ADD COLUMN     "sharePageEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "sandbox_request_logs" (
    "id" TEXT NOT NULL,
    "mockServerId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sandbox_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spec_drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spec_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sandbox_request_logs_mockServerId_idx" ON "sandbox_request_logs"("mockServerId");

-- CreateIndex
CREATE INDEX "sandbox_request_logs_mockServerId_createdAt_idx" ON "sandbox_request_logs"("mockServerId", "createdAt");

-- CreateIndex
CREATE INDEX "sandbox_request_logs_createdAt_idx" ON "sandbox_request_logs"("createdAt");

-- CreateIndex
CREATE INDEX "spec_drafts_userId_idx" ON "spec_drafts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "spec_drafts_userId_specId_key" ON "spec_drafts"("userId", "specId");

-- CreateIndex
CREATE INDEX "mock_servers_expiresAt_idx" ON "mock_servers"("expiresAt");

-- AddForeignKey
ALTER TABLE "sandbox_request_logs" ADD CONSTRAINT "sandbox_request_logs_mockServerId_fkey" FOREIGN KEY ("mockServerId") REFERENCES "mock_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spec_drafts" ADD CONSTRAINT "spec_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spec_drafts" ADD CONSTRAINT "spec_drafts_specId_fkey" FOREIGN KEY ("specId") REFERENCES "specs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
