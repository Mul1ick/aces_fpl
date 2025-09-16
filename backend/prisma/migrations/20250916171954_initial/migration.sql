-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INJURED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ChipType" AS ENUM ('TRIPLE_CAPTAIN', 'WILDCARD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "full_name" TEXT,
    "free_transfers" INTEGER NOT NULL DEFAULT 0,
    "played_first_gameweek" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" VARCHAR(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "price" DECIMAL(5,2) NOT NULL,
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "team_id" INTEGER NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameweeks" (
    "id" SERIAL NOT NULL,
    "gw_number" INTEGER NOT NULL,
    "deadline" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "gameweeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fantasy_teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "fantasy_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_teams" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "is_vice_captain" BOOLEAN NOT NULL DEFAULT false,
    "is_benched" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameweek_player_stats" (
    "id" SERIAL NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "goals_scored" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellow_cards" INTEGER NOT NULL DEFAULT 0,
    "red_cards" INTEGER NOT NULL DEFAULT 0,
    "bonus_points" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gameweek_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_gameweek_scores" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "transfer_hits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_gameweek_scores_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_short_name_key" ON "teams"("short_name");

-- CreateIndex
CREATE UNIQUE INDEX "gameweeks_gw_number_key" ON "gameweeks"("gw_number");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_teams_user_id_key" ON "fantasy_teams"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_teams_user_id_gameweek_id_player_id_key" ON "user_teams"("user_id", "gameweek_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "gameweek_player_stats_gameweek_id_player_id_key" ON "gameweek_player_stats"("gameweek_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_gameweek_scores_user_id_gameweek_id_key" ON "user_gameweek_scores"("user_id", "gameweek_id");

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
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fantasy_teams" ADD CONSTRAINT "fantasy_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_player_stats" ADD CONSTRAINT "gameweek_player_stats_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_player_stats" ADD CONSTRAINT "gameweek_player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_gameweek_scores" ADD CONSTRAINT "user_gameweek_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_gameweek_scores" ADD CONSTRAINT "user_gameweek_scores_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
