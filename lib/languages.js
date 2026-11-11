const LANGUAGES = [
  { id: 'en', short: 'EN', native: 'English', english: 'English' },
  { id: 'ru', short: 'RU', native: 'Русский', english: 'Russian' },
  { id: 'de', short: 'DE', native: 'Deutsch', english: 'German' },
  { id: 'fr', short: 'FR', native: 'Français', english: 'French' },
  { id: 'es', short: 'ES', native: 'Español', english: 'Spanish' },
  { id: 'it', short: 'IT', native: 'Italiano', english: 'Italian' },
  { id: 'pt', short: 'PT', native: 'Português', english: 'Portuguese' },
  { id: 'uk', short: 'UK', native: 'Українська', english: 'Ukrainian' },
  { id: 'tr', short: 'TR', native: 'Türkçe', english: 'Turkish' },
  { id: 'pl', short: 'PL', native: 'Polski', english: 'Polish' },
  { id: 'nl', short: 'NL', native: 'Nederlands', english: 'Dutch' },
  { id: 'zh-hans', short: 'ZH', native: '中文（简体）', english: 'Simplified Chinese' },
  { id: 'ja', short: 'JA', native: '日本語', english: 'Japanese' },
  { id: 'ko', short: 'KO', native: '한국어', english: 'Korean' },
  { id: 'hi', short: 'HI', native: 'हिन्दी', english: 'Hindi' },
  { id: 'ar', short: 'AR', native: 'العربية', english: 'Arabic' },
]

const AUTO_ID = 'auto'

const LANGUAGE_IDS = new Set([AUTO_ID, ...LANGUAGES.map((entry) => entry.id)])

function languageById(id) {
  return LANGUAGES.find((entry) => entry.id === id) || null
}

function isLanguageId(value) {
  return typeof value === 'string' && LANGUAGE_IDS.has(value)
}

export { LANGUAGES, AUTO_ID, LANGUAGE_IDS, languageById, isLanguageId }
