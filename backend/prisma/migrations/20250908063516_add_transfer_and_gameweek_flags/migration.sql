-- CreateEnum
CREATE TYPE "public"."PlayerStatus" AS ENUM ('ACTIVE', 'INJURED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ChipType" AS ENUM ('TRIPLE_CAPTAIN', 'WILDCARD');

-- AlterTable
ALTER TABLE "public"."players" ADD COLUMN     "status" "public"."PlayerStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "free_transfers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "played_first_gameweek" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."fixtures" (
    "id" SERIAL NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "home_team_id" INTEGER NOT NULL,
    "away_team_id" INTEGER NOT NULL,
    "kickoff" TIMESTAMPTZ(6),
    "home_score" INTEGER,
    "away_score" INTEGER,

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transfer_log" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "out_player" INTEGER,
    "in_player" INTEGER,
    "gameweek_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_chips" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "chip" "public"."ChipType" NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_chips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fixtures_gameweek_id_idx" ON "public"."fixtures"("gameweek_id");

-- CreateIndex
CREATE INDEX "fixtures_home_team_id_idx" ON "public"."fixtures"("home_team_id");

-- CreateIndex
CREATE INDEX "fixtures_away_team_id_idx" ON "public"."fixtures"("away_team_id");

-- CreateIndex
CREATE INDEX "transfer_log_gameweek_id_idx" ON "public"."transfer_log"("gameweek_id");

-- CreateIndex
CREATE INDEX "transfer_log_in_player_idx" ON "public"."transfer_log"("in_player");

-- CreateIndex
CREATE INDEX "transfer_log_out_player_idx" ON "public"."transfer_log"("out_player");

-- CreateIndex
CREATE INDEX "transfer_log_created_at_idx" ON "public"."transfer_log"("created_at");

-- CreateIndex
CREATE INDEX "user_chips_gameweek_id_idx" ON "public"."user_chips"("gameweek_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_chips_user_id_gameweek_id_key" ON "public"."user_chips"("user_id", "gameweek_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_chips_user_id_chip_key" ON "public"."user_chips"("user_id", "chip");

-- AddForeignKey
ALTER TABLE "public"."fixtures" ADD CONSTRAINT "fixtures_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixtures" ADD CONSTRAINT "fixtures_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixtures" ADD CONSTRAINT "fixtures_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfer_log" ADD CONSTRAINT "transfer_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfer_log" ADD CONSTRAINT "transfer_log_out_player_fkey" FOREIGN KEY ("out_player") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfer_log" ADD CONSTRAINT "transfer_log_in_player_fkey" FOREIGN KEY ("in_player") REFERENCES "public"."players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_chips" ADD CONSTRAINT "user_chips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_chips" ADD CONSTRAINT "user_chips_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
