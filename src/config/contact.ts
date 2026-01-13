export const CONTACT = {
  address: process.env.NEXT_PUBLIC_ADDRESS ?? "",
  phone: process.env.NEXT_PUBLIC_PHONE ?? "",
  mapEmbedUrl: process.env.NEXT_PUBLIC_MAP_EMBED_URL ?? "",
} as const;

export function getMapEmbedUrl() {
  // Prefer explicit embed URL if provided, else build from address
  if (CONTACT.mapEmbedUrl) return CONTACT.mapEmbedUrl;
  if (!CONTACT.address) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.address)}&z=16&output=embed`;
}

export function phoneToTel(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
