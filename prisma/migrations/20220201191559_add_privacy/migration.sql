-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privacy_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "private_name" TEXT;
