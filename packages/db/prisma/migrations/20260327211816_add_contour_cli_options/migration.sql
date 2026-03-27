-- AlterTable
ALTER TABLE "mock_servers" ADD COLUMN     "delay" TEXT,
ADD COLUMN     "errorRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isDeterministic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isStateful" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireAuth" BOOLEAN NOT NULL DEFAULT false;
