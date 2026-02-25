-- CreateEnum
CREATE TYPE "EquationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SOLVED');

-- CreateEnum
CREATE TYPE "EquationOrigin" AS ENUM ('DEFAULT', 'CREATED', 'DOWNLOADED');

-- CreateTable
CREATE TABLE "equations" (
    "id" TEXT NOT NULL,
    "postfixExpression" TEXT NOT NULL,
    "creatorId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_equations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "equationId" TEXT NOT NULL,
    "status" "EquationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "origin" "EquationOrigin" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_equations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "published_equations" (
    "id" TEXT NOT NULL,
    "equationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "published_equations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_equations_userId_equationId_key" ON "user_equations"("userId", "equationId");

-- CreateIndex
CREATE UNIQUE INDEX "published_equations_equationId_userId_key" ON "published_equations"("equationId", "userId");

-- AddForeignKey
ALTER TABLE "equations" ADD CONSTRAINT "equations_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_equations" ADD CONSTRAINT "user_equations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_equations" ADD CONSTRAINT "user_equations_equationId_fkey" FOREIGN KEY ("equationId") REFERENCES "equations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_equations" ADD CONSTRAINT "published_equations_equationId_fkey" FOREIGN KEY ("equationId") REFERENCES "equations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_equations" ADD CONSTRAINT "published_equations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
