/**
 * Transforme un titre en slug URL-friendly.
 * Ex: "Mon Super Article !" → "mon-super-article"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Supprime les accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Espaces → tirets
    .replace(/-+/g, '-') // Tirets multiples → un seul
    .replace(/^-|-$/g, ''); // Tirets en début/fin
}
