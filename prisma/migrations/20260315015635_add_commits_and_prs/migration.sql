/*
  Warnings:

  - You are about to drop the column `totalForks` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalStars` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "totalForks",
DROP COLUMN "totalStars",
ADD COLUMN     "totalCommits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPrs" INTEGER NOT NULL DEFAULT 0;
