-- Habilita Row-Level Security (RLS) en todas las tablas del esquema public.
--
-- A propósito NO se agregan políticas: esta app accede a la base únicamente
-- por Prisma (rol "postgres", que ignora RLS), nunca por la API REST de
-- Supabase. Con RLS activo y sin políticas, la API pública (llave anon que
-- viaja en el JS del panel) queda completamente bloqueada.
--
-- Resuelve las alertas del Security Advisor de Supabase:
--   - "RLS Disabled in Public" (todas las tablas)
--   - "Sensitive Columns Exposed" (public.encuestas)
--
-- ENABLE ROW LEVEL SECURITY es idempotente en Postgres: si una tabla ya lo
-- tenía activado (p. ej. se corrió antes en el SQL Editor), no falla.

ALTER TABLE "usuarios"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clientes"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "citas"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "encuestas"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mensajes_log"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ajustes"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
