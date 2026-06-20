export function formatPhone(phone, countryCode = '+52') {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `+${digits}`;
  throw new Error(`Invalid phone number: ${phone}`);
}
