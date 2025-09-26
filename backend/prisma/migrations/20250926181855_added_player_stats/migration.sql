-- AlterTable
ALTER TABLE "gameweek_player_stats" ADD COLUMN     "clean_sheets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "goals_conceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "own_goals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "penalties_missed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "played" BOOLEAN NOT NULL DEFAULT false;
