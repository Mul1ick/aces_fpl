-- AlterTable
ALTER TABLE "users" ADD COLUMN     "full_name" TEXT;

-- CreateTable
CREATE TABLE "gameweek_player_stats" (
    "id" SERIAL NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "gameweek_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_gameweek_scores" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "gameweek_id" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL,

    CONSTRAINT "user_gameweek_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gameweek_player_stats_gameweek_id_player_id_key" ON "gameweek_player_stats"("gameweek_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_gameweek_scores_user_id_gameweek_id_key" ON "user_gameweek_scores"("user_id", "gameweek_id");

-- AddForeignKey
ALTER TABLE "gameweek_player_stats" ADD CONSTRAINT "gameweek_player_stats_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_player_stats" ADD CONSTRAINT "gameweek_player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_gameweek_scores" ADD CONSTRAINT "user_gameweek_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_gameweek_scores" ADD CONSTRAINT "user_gameweek_scores_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
