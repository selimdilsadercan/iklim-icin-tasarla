export const convertTurkishToEnglish = (text: string): string => {
  const turkishMap: { [key: string]: string } = {
    // Standard Turkish characters
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    // Additional characters with diacritics that might appear in Turkish names
    'â': 'a', 'Â': 'A',
    'ê': 'e', 'Ê': 'E',
    'î': 'i', 'Î': 'I',
    'ô': 'o', 'Ô': 'O',
    'û': 'u', 'Û': 'U',
    'ș': 's', 'Ș': 'S',
    'ț': 't', 'Ț': 'T',
    'ă': 'a', 'Ă': 'A',
  };

  // First apply the specific character mapping
  let result = text.split('').map(char => turkishMap[char] || char).join('');
  
  // Then normalize any remaining diacritics using Unicode normalization
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return result;
};

export const cleanClassName = (className: string): string => {
  // Remove only dots and special characters for password, keep school code
  // e.g., "e.6a" → "e6a"
  return className.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

export const getOriginalClassName = (className: string): string => {
  // Return original class name for database matching (e.g., "e.6a")
  return className.trim();
};

export const padStudentNo = (no: string): string => {
  const numStr = no.toString().replace(/\D/g, '');
  return numStr.padStart(2, '0');
};

export const toProperCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

