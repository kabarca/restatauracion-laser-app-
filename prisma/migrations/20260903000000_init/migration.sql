-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('AGENDADA', 'RECORDADA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "TipoMensaje" AS ENUM ('CONFIRMACION', 'RECORDATORIO', 'RECORDATORIO_DIA', 'REPROGRAMACION', 'CANCELACION', 'ENCUESTA');

-- CreateEnum
CREATE TYPE "EstadoMensaje" AS ENUM ('ENVIADO', 'FALLIDO', 'SIMULADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'STAFF',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "servicio" TEXT,
    "nota" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'AGENDADA',
    "creadaPorId" TEXT NOT NULL,
    "diasRecordatorio" INTEGER NOT NULL DEFAULT 2,
    "recordatorioMismoDia" BOOLEAN NOT NULL DEFAULT false,
    "confirmacionEnviadaEn" TIMESTAMP(3),
    "recordatorioEnviadoEn" TIMESTAMP(3),
    "recordatorioDiaEnviadoEn" TIMESTAMP(3),
    "canceladaEn" TIMESTAMP(3),
    "motivoCancelacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encuestas" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "enviadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidaEn" TIMESTAMP(3),
    "puntaje" INTEGER,
    "comentario" TEXT,

    CONSTRAINT "encuestas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_log" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "canal" "Canal" NOT NULL,
    "tipo" "TipoMensaje" NOT NULL,
    "estado" "EstadoMensaje" NOT NULL,
    "destino" TEXT NOT NULL,
    "proveedorId" TEXT,
    "error" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB,
    "enviadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajustes_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_authUserId_key" ON "usuarios"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "clientes_telefono_idx" ON "clientes"("telefono");

-- CreateIndex
CREATE INDEX "clientes_email_idx" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "citas_fechaHora_idx" ON "citas"("fechaHora");

-- CreateIndex
CREATE INDEX "citas_estado_idx" ON "citas"("estado");

-- CreateIndex
CREATE INDEX "citas_recordatorioEnviadoEn_idx" ON "citas"("recordatorioEnviadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "encuestas_citaId_key" ON "encuestas"("citaId");

-- CreateIndex
CREATE UNIQUE INDEX "encuestas_token_key" ON "encuestas"("token");

-- CreateIndex
CREATE INDEX "encuestas_respondidaEn_idx" ON "encuestas"("respondidaEn");

-- CreateIndex
CREATE INDEX "mensajes_log_citaId_idx" ON "mensajes_log"("citaId");

-- CreateIndex
CREATE INDEX "mensajes_log_tipo_estado_idx" ON "mensajes_log"("tipo", "estado");

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encuestas" ADD CONSTRAINT "encuestas_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_log" ADD CONSTRAINT "mensajes_log_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

