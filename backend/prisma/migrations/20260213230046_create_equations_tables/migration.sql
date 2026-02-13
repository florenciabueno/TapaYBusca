-- CreateEnum
CREATE TYPE "EquationStatus" AS ENUM ('SIN_COMENZAR', 'EN_PROCESO', 'RESUELTA');

-- CreateEnum
CREATE TYPE "EquationOrigin" AS ENUM ('POR_DEFECTO', 'CREADA', 'DESCARGADA');

-- CreateTable
CREATE TABLE "ecuaciones" (
    "id" TEXT NOT NULL,
    "expresionPostfija" TEXT NOT NULL,
    "idCreador" TEXT,
    "porDefecto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecuaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecuacion_usuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ecuacionId" TEXT NOT NULL,
    "estado" "EquationStatus" NOT NULL DEFAULT 'SIN_COMENZAR',
    "origen" "EquationOrigin" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaAgregado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecuacion_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecuacion_publicada" (
    "id" TEXT NOT NULL,
    "ecuacionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecuacion_publicada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ecuacion_usuario_usuarioId_ecuacionId_key" ON "ecuacion_usuario"("usuarioId", "ecuacionId");

-- CreateIndex
CREATE UNIQUE INDEX "ecuacion_publicada_ecuacionId_usuarioId_key" ON "ecuacion_publicada"("ecuacionId", "usuarioId");

-- AddForeignKey
ALTER TABLE "ecuaciones" ADD CONSTRAINT "ecuaciones_idCreador_fkey" FOREIGN KEY ("idCreador") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecuacion_usuario" ADD CONSTRAINT "ecuacion_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecuacion_usuario" ADD CONSTRAINT "ecuacion_usuario_ecuacionId_fkey" FOREIGN KEY ("ecuacionId") REFERENCES "ecuaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecuacion_publicada" ADD CONSTRAINT "ecuacion_publicada_ecuacionId_fkey" FOREIGN KEY ("ecuacionId") REFERENCES "ecuaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecuacion_publicada" ADD CONSTRAINT "ecuacion_publicada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
