const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SOCIAL_URL_REGEX = /https?:\/\/(?:www\.)?(?:instagram|facebook|twitter|tiktok|linkedin|snapchat|youtube|telegram|discord|m\.me|wa\.me|chat\.whatsapp|whatsapp|fb)\.[^\s]+/gi;
const PLAIN_SOCIAL_REGEX = /(?:www\.)?(?:instagram|facebook|twitter|tiktok|linkedin|snapchat|youtube|telegram|discord|m\.me|wa\.me|chat\.whatsapp|whatsapp|fb)\.[^\s]+/gi;
const HANDLE_REGEX = /(^|\s)@([A-Za-z0-9._]{2,30})/g;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{6,}\d)/g;

export const sanitizeChatContent = (text = '') => {
  const original = String(text || '');
  if (!original.trim()) return original;

  let sanitized = original;

  sanitized = sanitized.replace(EMAIL_REGEX, '[hidden email]');
  sanitized = sanitized.replace(SOCIAL_URL_REGEX, '[hidden social link]');
  sanitized = sanitized.replace(PLAIN_SOCIAL_REGEX, '[hidden social link]');

  sanitized = sanitized.replace(PHONE_REGEX, (match) => {
    const digits = match.replace(/\D/g, '');
    return digits.length >= 8 ? '[hidden phone]' : match;
  });

  sanitized = sanitized.replace(HANDLE_REGEX, '$1[hidden handle]');

  return sanitized;
};
