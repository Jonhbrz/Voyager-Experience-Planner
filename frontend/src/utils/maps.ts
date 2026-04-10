/** Enlace de búsqueda en Google Maps (sin API key). */
export function googleMapsSearchUrl(query: string): string {
  const q = encodeURIComponent(query.trim())
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}
