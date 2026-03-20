-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lemonSqueezyCustomerId" TEXT,
ADD COLUMN     "lemonSqueezySubscriptionId" TEXT,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionRenewsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT;
