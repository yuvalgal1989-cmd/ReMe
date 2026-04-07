export function buildCallLink(phone: string): string {
  return `tel:${phone}`;
}

export function buildWhatsAppLink(phone: string, message?: string): string {
  const clean = phone.replace(/\D/g, '');
  const base = `https://wa.me/${clean}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildEmailLink(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const qs = params.toString();
  return `mailto:${email}${qs ? '?' + qs : ''}`;
}
