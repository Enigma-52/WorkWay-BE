/*
  Warnings:

  - You are about to drop the column `updatedAtDb` on the `Job` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[job_id]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "updatedAtDb";

-- CreateIndex
CREATE UNIQUE INDEX "Job_job_id_key" ON "Job"("job_id");

-- CreateIndex
CREATE INDEX "Job_updatedAt_id_idx" ON "Job"("updatedAt", "id");
