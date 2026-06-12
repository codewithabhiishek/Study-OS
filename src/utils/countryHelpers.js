export const COUNTRIES = [
  { name: 'Austria', flag: '🇦🇹' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Luxembourg', flag: '🇱🇺' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Finland', flag: '🇫🇮' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Australia', flag: '🇦🇺' },
];

export function getCountryFlag(countryName) {
  if (!countryName) return '';
  const cleanName = countryName.trim().toLowerCase();
  
  if (cleanName === 'uk') return '🇬🇧';
  if (cleanName === 'us' || cleanName === 'usa') return '🇺🇸';

  const country = COUNTRIES.find(c => c.name.toLowerCase() === cleanName);
  return country ? country.flag : '🌍';
}
