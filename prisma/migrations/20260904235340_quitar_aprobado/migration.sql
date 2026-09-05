-- Se revierte el autorregistro: ahora los miembros del equipo solo se crean
-- por invitación directa de un admin, así que ya no hace falta un estado de
-- "pendiente de aprobación".
ALTER TABLE "usuarios" DROP COLUMN "aprobado";
