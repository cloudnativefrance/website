/**
 * Pre-filled `mailto:` links for the requests the ticketing team handles by
 * hand: group quotes, inclusion and students, the Strategy & Leadership
 * waiting list. The address comes from CONTACT_EMAILS, the words from i18n.
 *
 * RFC 6068: every line break in a body is `%0D%0A`, and spaces are `%20`
 * (never `+`, which mail clients print literally).
 */
export function buildMailto(to: string, subject: string, body?: string): string {
  const params = [`subject=${encode(subject)}`];
  if (body) params.push(`body=${encode(body)}`);
  return `mailto:${to}?${params.join("&")}`;
}

function encode(text: string): string {
  return encodeURIComponent(text.replace(/\r?\n/g, "\r\n"));
}
