-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('UNRANKED', 'PLASTIC', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'LINUS');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "rank" "Rank" NOT NULL,
    "elo" BIGINT NOT NULL,
    "placementCompleted" BOOLEAN NOT NULL,
    "publicRepos" INTEGER NOT NULL DEFAULT 0,
    "totalStars" INTEGER NOT NULL DEFAULT 0,
    "totalForks" INTEGER NOT NULL DEFAULT 0,
    "topLanguage" TEXT,
    "location" TEXT,
    "company" TEXT,
    "website" TEXT,
    "accountCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "userId" BIGINT NOT NULL,
    "position" INTEGER NOT NULL,
    "commits" INTEGER NOT NULL,
    "issues" INTEGER NOT NULL,
    "prs" INTEGER NOT NULL,
    "seasonId" BIGINT NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("userId","seasonId")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" BIGSERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "challengeId" BIGINT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadges" (
    "userId" BIGINT NOT NULL,
    "badgeId" BIGINT NOT NULL,

    CONSTRAINT "UserBadges_pkey" PRIMARY KEY ("userId","badgeId")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_elo_idx" ON "User"("elo");

-- CreateIndex
CREATE INDEX "User_rank_idx" ON "User"("rank");

-- CreateIndex
CREATE INDEX "Leaderboard_seasonId_position_idx" ON "Leaderboard"("seasonId", "position");

-- CreateIndex
CREATE INDEX "Badge_challengeId_idx" ON "Badge"("challengeId");

-- CreateIndex
CREATE INDEX "UserBadges_badgeId_idx" ON "UserBadges"("badgeId");

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadges" ADD CONSTRAINT "UserBadges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadges" ADD CONSTRAINT "UserBadges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
