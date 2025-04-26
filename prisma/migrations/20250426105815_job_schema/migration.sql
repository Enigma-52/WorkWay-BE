/*
  Warnings:

  - You are about to drop the `Sample` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Sample";

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "company_img" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "absolute_url" TEXT NOT NULL,
    "location" TEXT,
    "source" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "applicants" INTEGER NOT NULL DEFAULT 0,
    "additional" JSONB,
    "lists" JSONB,
    "salaryRange" TEXT,
    "workplaceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAtDb" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
