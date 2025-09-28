-- CreateEnum
CREATE TYPE "GameweekStatus" AS ENUM ('UPCOMING', 'LIVE', 'FINISHED');

-- AlterTable
ALTER TABLE "gameweeks" ADD COLUMN     "status" "GameweekStatus" NOT NULL DEFAULT 'UPCOMING';
