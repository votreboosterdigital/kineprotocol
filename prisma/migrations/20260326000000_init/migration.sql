-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('MOBILITY', 'STRENGTH', 'PLYOMETRIC', 'MOTOR_CONTROL', 'STRETCHING', 'PROPRIOCEPTION', 'CARDIO');

-- CreateEnum
CREATE TYPE "ExerciseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "pathologies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "sport" TEXT,
    "icd10Code" TEXT,
    "tags" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pathologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "criteria" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "level" "ExerciseLevel" NOT NULL,
    "equipment" TEXT[],
    "description" TEXT NOT NULL,
    "cues" TEXT[],
    "commonErrors" TEXT[],
    "variants" TEXT[],
    "videoUrl" TEXT,
    "tags" TEXT[],
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocols" (
    "id" TEXT NOT NULL,
    "pathologyId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientSport" TEXT,
    "patientLevel" TEXT,
    "sessionDuration" INTEGER,
    "sessionsPerWeek" INTEGER,
    "constraints" TEXT[],
    "objectives" TEXT[],
    "progression" TEXT[],
    "sessionStructure" JSONB NOT NULL,
    "rawAgentOutput" JSONB NOT NULL,
    "patientVersion" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_exercises" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER,
    "reps" TEXT,
    "rest" TEXT,
    "notes" TEXT,

    CONSTRAINT "protocol_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pathologies_name_key" ON "pathologies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_exercises_protocolId_order_key" ON "protocol_exercises"("protocolId", "order");

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_pathologyId_fkey" FOREIGN KEY ("pathologyId") REFERENCES "pathologies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_exercises" ADD CONSTRAINT "protocol_exercises_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_exercises" ADD CONSTRAINT "protocol_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
