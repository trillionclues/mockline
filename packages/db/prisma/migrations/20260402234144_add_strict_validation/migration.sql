-- AlterTable
ALTER TABLE "mock_servers" ADD COLUMN     "strictLevel" TEXT,
ADD COLUMN     "strictValidation" BOOLEAN NOT NULL DEFAULT false;
