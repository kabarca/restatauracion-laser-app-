/**
 * Envía UN mensaje de prueba (WhatsApp + correo) al contacto de prueba, sin tocar
 * la base de datos. Sirve para verificar credenciales.
 *
 *   npm run enviar:prueba
 *
 * Sin credenciales en .env.local devuelve "SIMULADO" (no manda nada).
 * Con credenciales, manda de verdad a:
 *   TEL_PRUEBA   (default +50673001338)
 *   EMAIL_PRUEBA (default sanchezthomas023@gmail.com)
 */
void (async () => {
  const { env } = await import("../src/lib/env");
  const { enviarPlantillaWhatsapp } = await import("../src/lib/whatsapp");
  const { enviarEmail } = await import("../src/lib/email");
  const { whatsappParams, emailConfirmacion } = await import("../src/lib/plantillas");

  const tel = process.env.TEL_PRUEBA || "+50673001338";
  const correo = process.env.EMAIL_PRUEBA || "sanchezthomas023@gmail.com";
  const datos = {
    nombreCliente: "Prueba",
    fechaHora: new Date(Date.now() + 2 * 86400000),
    servicio: "remocion-de-oxido",
  };

  console.log(`WhatsApp → ${tel} (plantilla "${env.WHATSAPP_TEMPLATE_CONFIRMACION}")`);
  const wa = await enviarPlantillaWhatsapp({
    to: tel,
    template: env.WHATSAPP_TEMPLATE_CONFIRMACION,
    locale: env.WHATSAPP_TEMPLATE_LOCALE,
    bodyParams: whatsappParams(datos),
  });
  console.log("  →", wa.estado, wa.proveedorId ?? wa.error ?? "");

  const email = emailConfirmacion(datos);
  console.log(`Correo → ${correo}`);
  const em = await enviarEmail({
    to: correo,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  console.log("  →", em.estado, em.proveedorId ?? em.error ?? "");

  if (wa.estado === "SIMULADO" || em.estado === "SIMULADO") {
    console.log(
      "\nℹ️  SIMULADO = faltan credenciales. Completá WHATSAPP_* / RESEND_API_KEY en .env.local.",
    );
  }
  process.exit(0);
})();
