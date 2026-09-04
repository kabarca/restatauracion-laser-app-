-- Cuentas autorregistradas quedan pendientes de aprobación de un admin.
ALTER TABLE "usuarios" ADD COLUMN "aprobado" BOOLEAN NOT NULL DEFAULT true;
