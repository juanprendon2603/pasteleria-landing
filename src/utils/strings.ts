/** Slug para clases */
export const slugify = (s?: string) =>
  (s || 'sin-cat')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Normaliza etiquetas: trim, sin acentos, sin punto final, minúsculas */
export const normalizeTag = (s: string) =>
  s
    .trim()
    .replace(/[.]+$/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Etiqueta “bonita” para mostrar */
export const prettyTag = (s: string) => {
  const t = s.trim().replace(/[.]+$/g, '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}
