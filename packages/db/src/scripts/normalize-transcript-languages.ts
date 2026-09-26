import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

/**
 * Whisper's `verbose_json` response returns the detected language as an English
 * name ("english"), not a BCP 47 tag. Those names were persisted verbatim and
 * rendered into `<track srclang>`, which requires a valid tag. This rewrites
 * the stored names to codes; anything unrecognised becomes `und`.
 */
const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  afrikaans: 'af',
  arabic: 'ar',
  bengali: 'bn',
  cantonese: 'yue',
  castilian: 'es',
  chinese: 'zh',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  finnish: 'fi',
  flemish: 'nl',
  french: 'fr',
  german: 'de',
  greek: 'el',
  hausa: 'ha',
  hebrew: 'he',
  hindi: 'hi',
  hungarian: 'hu',
  indonesian: 'id',
  italian: 'it',
  japanese: 'ja',
  korean: 'ko',
  malay: 'ms',
  moldavian: 'ro',
  moldovan: 'ro',
  norwegian: 'no',
  polish: 'pl',
  portuguese: 'pt',
  punjabi: 'pa',
  pushto: 'ps',
  romanian: 'ro',
  russian: 'ru',
  sinhalese: 'si',
  somali: 'so',
  spanish: 'es',
  swahili: 'sw',
  swedish: 'sv',
  tagalog: 'tl',
  tamil: 'ta',
  telugu: 'te',
  thai: 'th',
  turkish: 'tr',
  ukrainian: 'uk',
  urdu: 'ur',
  vietnamese: 'vi',
  yoruba: 'yo'
};

async function normalizeTranscriptLanguages() {
  try {
    let updated = 0;

    for (const [name, code] of Object.entries(LANGUAGE_NAME_TO_CODE)) {
      const result = await db.execute(sql`
        update media_transcript
        set language = ${code}
        where lower(language) = ${name}
      `);

      updated += result.count ?? 0;
    }

    const leftover = await db.execute(sql`
      update media_transcript
      set language = 'und'
      where language is not null
        and language <> 'und'
        and language !~ '^[a-z]{2,3}$'
    `);

    console.log('Transcript language normalization completed', {
      mappedRows: updated,
      unrecognisedRows: leftover.count ?? 0
    });
    process.exit(0);
  } catch (error) {
    console.error('Transcript language normalization failed', error);
    process.exit(1);
  }
}

normalizeTranscriptLanguages();
