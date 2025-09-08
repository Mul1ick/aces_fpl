-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INJURED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ChipType" AS ENUM ('TRIPLE_CAPTAIN', 'WILDCARD');

-- AlterTable
ALTER TABLE "gameweek_player_stats" ADD COLUMN     "assists" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bonus_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "goals_scored" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "red_cards" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yellow_cards" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "points" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "free_transfers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "played_first_gameweek" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "fixtures" (
    "id" SERIAL NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "home_team_id" INTEGER NOT NULL,
    "away_team_id" INTEGER NOT NULL,
    "kickoff" TIMESTAMPTZ(6),
    "home_score" INTEGER,
    "away_score" INTEGER,
    "stats_entered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_log" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "out_player" INTEGER,
    "in_player" INTEGER,
    "gameweek_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_chips" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "chip" "ChipType" NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_chips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fixtures_gameweek_id_idx" ON "fixtures"("gameweek_id");

-- CreateIndex
CREATE INDEX "fixtures_home_team_id_idx" ON "fixtures"("home_team_id");

-- CreateIndex
CREATE INDEX "fixtures_away_team_id_idx" ON "fixtures"("away_team_id");

-- CreateIndex
CREATE INDEX "transfer_log_gameweek_id_idx" ON "transfer_log"("gameweek_id");

-- CreateIndex
CREATE INDEX "transfer_log_in_player_idx" ON "transfer_log"("in_player");

-- CreateIndex
CREATE INDEX "transfer_log_out_player_idx" ON "transfer_log"("out_player");

-- CreateIndex
CREATE INDEX "transfer_log_created_at_idx" ON "transfer_log"("created_at");

-- CreateIndex
CREATE INDEX "user_chips_gameweek_id_idx" ON "user_chips"("gameweek_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_chips_user_id_gameweek_id_key" ON "user_chips"("user_id", "gameweek_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_chips_user_id_chip_key" ON "user_chips"("user_id", "chip");

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_log" ADD CONSTRAINT "transfer_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_log" ADD CONSTRAINT "transfer_log_out_player_fkey" FOREIGN KEY ("out_player") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_log" ADD CONSTRAINT "transfer_log_in_player_fkey" FOREIGN KEY ("in_player") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_chips" ADD CONSTRAINT "user_chips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_chips" ADD CONSTRAINT "user_chips_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
