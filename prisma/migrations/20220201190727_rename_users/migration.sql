/*
  Warnings:

  - You are about to rename the `CachedUser` table.

*/
-- DropForeignKey
ALTER TABLE "Usage" DROP CONSTRAINT "Usage_user_id_fkey";

-- DropIndex
DROP INDEX "CachedUser_id_key";

-- AlterTable
ALTER TABLE "CachedUser" RENAME TO "User";

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- AddForeignKey
ALTER TABLE "Usage" ADD CONSTRAINT "Usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
