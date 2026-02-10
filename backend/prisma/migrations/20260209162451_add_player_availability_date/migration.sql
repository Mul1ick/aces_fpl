-- AlterTable
ALTER TABLE "players" ADD COLUMN     "chance_of_playing" INTEGER,
ADD COLUMN     "news" TEXT,
ADD COLUMN     "return_date" TIMESTAMPTZ(6);
