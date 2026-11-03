export function formatCop(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'GRATIS';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .trim()
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove non-word chars
    .replace(/\-\-+/g, '-'); // replace multiple - with single -

  const shortCode = Math.random().toString(36).substring(2, 7);
  return `${base || 'articulo'}-${shortCode}`;
}

export function getShortCode(slugOrId: string): string {
  // Extract trailing code or last 6 characters
  const parts = slugOrId.split('-');
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase();
  }
  return slugOrId.substring(0, 6).toUpperCase();
}
