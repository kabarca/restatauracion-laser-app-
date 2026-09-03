/** Las 9 líneas de servicio de Restauración Láser (mismo orden que el sitio). */
export const SERVICIOS = [
  { slug: "remocion-de-oxido", nombre: "Remoción de óxido" },
  { slug: "remocion-de-pintura-y-recubrimientos", nombre: "Remoción de pintura y recubrimientos" },
  { slug: "remocion-de-grafiti", nombre: "Remoción de grafiti" },
  { slug: "remocion-de-moho-y-biofilm", nombre: "Remoción de moho y biofilm" },
  { slug: "remocion-de-grasa-y-aceite", nombre: "Remoción de grasa y aceite" },
  { slug: "limpieza-de-moldes-de-inyeccion", nombre: "Limpieza de moldes de inyección" },
  { slug: "restauracion-de-madera-y-teca", nombre: "Restauración de madera y teca" },
  { slug: "remocion-de-hollin", nombre: "Remoción de hollín" },
  { slug: "restauracion-patrimonial", nombre: "Restauración patrimonial" },
] as const;

export type ServicioSlug = (typeof SERVICIOS)[number]["slug"];

export const SERVICIO_SLUGS = SERVICIOS.map((s) => s.slug);

export function nombreServicio(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return SERVICIOS.find((s) => s.slug === slug)?.nombre ?? slug;
}
