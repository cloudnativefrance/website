/**
 * A pre-filled `mailto:` link. RFC 6068: line breaks are `%0D%0A` and spaces
 * `%20` — never `+`, which mail clients print literally.
 */
export function buildMailto(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encode(subject)}&body=${encode(body)}`;
}

function encode(text: string): string {
  return encodeURIComponent(text.replace(/\r?\n/g, "\r\n"));
}
