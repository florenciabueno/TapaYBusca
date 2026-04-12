-- AlterTable
ALTER TABLE "equations" ADD COLUMN     "solutionValues" JSONB;

-- AlterTable
ALTER TABLE "user_equations" ADD COLUMN     "currentResolutionId" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selectionBifurcacion" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "resolutions" (
    "id" TEXT NOT NULL,
    "userEquationId" TEXT NOT NULL,
    "resolutionSessionId" INTEGER NOT NULL,
    "subEcuacion" TEXT NOT NULL,
    "resultadoPropuesto" TEXT NOT NULL,
    "valorResultado" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pasoSinSolucion" BOOLEAN NOT NULL DEFAULT false,
    "esCorrecto" BOOLEAN NOT NULL DEFAULT false,
    "esVariable" BOOLEAN NOT NULL DEFAULT false,
    "ladoResolucion" INTEGER NOT NULL,

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resolutions_userEquationId_resolutionSessionId_idx" ON "resolutions"("userEquationId", "resolutionSessionId");

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_userEquationId_fkey" FOREIGN KEY ("userEquationId") REFERENCES "user_equations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
