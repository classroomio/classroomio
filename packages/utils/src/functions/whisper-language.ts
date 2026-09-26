const WHISPER_LANGUAGE_CODES: Record<string, string> = {
  afrikaans: 'af',
  albanian: 'sq',
  amharic: 'am',
  arabic: 'ar',
  armenian: 'hy',
  assamese: 'as',
  azerbaijani: 'az',
  bashkir: 'ba',
  basque: 'eu',
  belarusian: 'be',
  bengali: 'bn',
  bosnian: 'bs',
  breton: 'br',
  bulgarian: 'bg',
  burmese: 'my',
  cantonese: 'yue',
  castilian: 'es',
  catalan: 'ca',
  chinese: 'zh',
  croatian: 'hr',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  estonian: 'et',
  faroese: 'fo',
  finnish: 'fi',
  flemish: 'nl',
  french: 'fr',
  galician: 'gl',
  georgian: 'ka',
  german: 'de',
  greek: 'el',
  gujarati: 'gu',
  haitian: 'ht',
  'haitian creole': 'ht',
  hausa: 'ha',
  hawaiian: 'haw',
  hebrew: 'he',
  hindi: 'hi',
  hungarian: 'hu',
  icelandic: 'is',
  indonesian: 'id',
  italian: 'it',
  japanese: 'ja',
  javanese: 'jv',
  kannada: 'kn',
  kazakh: 'kk',
  khmer: 'km',
  korean: 'ko',
  lao: 'lo',
  latin: 'la',
  latvian: 'lv',
  letzeburgesch: 'lb',
  lingala: 'ln',
  lithuanian: 'lt',
  luxembourgish: 'lb',
  macedonian: 'mk',
  malagasy: 'mg',
  malay: 'ms',
  malayalam: 'ml',
  maltese: 'mt',
  maori: 'mi',
  marathi: 'mr',
  moldavian: 'ro',
  moldovan: 'ro',
  mongolian: 'mn',
  myanmar: 'my',
  nepali: 'ne',
  norwegian: 'no',
  nynorsk: 'nn',
  occitan: 'oc',
  panjabi: 'pa',
  pashto: 'ps',
  persian: 'fa',
  polish: 'pl',
  portuguese: 'pt',
  punjabi: 'pa',
  pushto: 'ps',
  romanian: 'ro',
  russian: 'ru',
  sanskrit: 'sa',
  serbian: 'sr',
  shona: 'sn',
  sindhi: 'sd',
  sinhala: 'si',
  sinhalese: 'si',
  slovak: 'sk',
  slovenian: 'sl',
  somali: 'so',
  spanish: 'es',
  sundanese: 'su',
  swahili: 'sw',
  swedish: 'sv',
  tagalog: 'tl',
  tajik: 'tg',
  tamil: 'ta',
  tatar: 'tt',
  telugu: 'te',
  thai: 'th',
  tibetan: 'bo',
  turkish: 'tr',
  turkmen: 'tk',
  ukrainian: 'uk',
  urdu: 'ur',
  uzbek: 'uz',
  valencian: 'ca',
  vietnamese: 'vi',
  welsh: 'cy',
  yiddish: 'yi',
  yoruba: 'yo'
};

/** A primary language subtag, plus any script, region or variant subtags. */
const BCP_47_TAG = /^([A-Za-z]{2,3})((?:-[A-Za-z0-9]{2,8})*)$/;

/**
 * Normalizes a stored caption language to a BCP 47 tag, for `<track srclang>`.
 *
 * Two sources write `media_transcript.language` and they disagree in shape.
 * Whisper's `verbose_json` returns an English language *name* ("english"), which
 * is not a tag and is what this map exists to fix. The YouTube caption provider
 * returns real tags, often carrying a script or region subtag ("en-US",
 * "zh-Hans", "es-419").
 *
 * A value that is already tag-shaped is kept verbatim, including its subtags.
 * It is deliberately not checked against the name map above: that map covers
 * only the languages Whisper supports, and YouTube serves captions in many it
 * does not — Igbo, Zulu, Xhosa and Kinyarwanda among them. Rejecting anything
 * absent from the map would rewrite those to `und`, destroying a correct tag to
 * guard against an unassigned one like "zz" that neither source produces.
 */
export function normalizeWhisperLanguage(language: string | null | undefined): string {
  const value = language?.trim();
  if (!value) return 'und';

  const mappedName = WHISPER_LANGUAGE_CODES[value.toLowerCase()];
  if (mappedName) return mappedName;

  const tag = BCP_47_TAG.exec(value);
  if (!tag) return 'und';

  const [, primarySubtag, remainingSubtags] = tag;

  return `${primarySubtag.toLowerCase()}${remainingSubtags}`;
}
