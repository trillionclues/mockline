/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `mock_servers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "mock_servers" ADD COLUMN     "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mock_servers_customDomain_key" ON "mock_servers"("customDomain");
