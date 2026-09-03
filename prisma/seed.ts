/**
 * Crea el primer usuario ADMIN. Requiere:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD  (+ las vars de Supabase del .env.local)
 *
 * Uso:  SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
 */
import { PrismaClient } from "../src/generated/prisma";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const nombre = process.env.SEED_ADMIN_NOMBRE ?? "Administrador";

  if (!email || !password) {
    throw new Error("Definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    console.log(`Ya existe un usuario con ${email}. Nada que hacer.`);
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Reusar el auth user si ya existe en Supabase.
  const { data: lista } = await admin.auth.admin.listUsers();
  let authUser = lista.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!authUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (error || !data.user) throw error ?? new Error("No se pudo crear el usuario en Supabase.");
    authUser = data.user;
  }

  await prisma.usuario.create({
    data: { authUserId: authUser.id, nombre, email, rol: "ADMIN" },
  });

  console.log(`✅ ADMIN creado: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
