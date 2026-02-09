/*
  Warnings:

  - The values [UNAVAILABLE] on the enum `PlayerStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlayerStatus_new" AS ENUM ('ACTIVE', 'INJURED', 'SUSPENDED');
ALTER TABLE "players" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "players" ALTER COLUMN "status" TYPE "PlayerStatus_new" USING ("status"::text::"PlayerStatus_new");
ALTER TYPE "PlayerStatus" RENAME TO "PlayerStatus_old";
ALTER TYPE "PlayerStatus_new" RENAME TO "PlayerStatus";
DROP TYPE "PlayerStatus_old";
ALTER TABLE "players" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;
