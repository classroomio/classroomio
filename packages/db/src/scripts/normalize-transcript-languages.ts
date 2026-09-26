import { normalizeWhisperLanguage } from '@cio/utils/functions';

import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

/**
 * Whisper's `verbose_json` response returns the detected language as an English
 * name ("english"), not a BCP 47 tag. Those names were persisted verbatim and
 * rendered into `<track srclang>`, which requires a valid tag.
 *
 * Normalization reuses `normalizeWhisperLanguage` so this script and the worker
 * can never disagree about a mapping. Reports what it would change and exits
 * without writing unless `--execute` is passed.
 */
async function normalizeTranscriptLanguages() {
  const shouldExecute = process.argv.includes('--execute');

  try {
    const rows = await db.execute(sql`
      select distinct language
      from media_transcript
      where language is not null
        and language <> ''
    `);

    const changes = (rows as unknown as { language: string }[])
      .map(({ language }) => ({ from: language, to: normalizeWhisperLanguage(language) }))
      .filter(({ from, to }) => from !== to);

    if (changes.length === 0) {
      console.log('Transcript language normalization: nothing to do');
      process.exit(0);
    }

    const unrecognised = changes.filter(({ to }) => to === 'und');

    if (!shouldExecute) {
      console.log('Transcript language normalization (dry run)', {
        distinctValuesToRewrite: changes.length,
        mappings: changes,
        valuesFallingBackToUnd: unrecognised.map(({ from }) => from),
        hint: 'Re-run with --execute to apply.'
      });
      process.exit(0);
    }

    let updatedRows = 0;

    for (const { from, to } of changes) {
      const result = await db.execute(sql`
        update media_transcript
        set language = ${to}
        where language = ${from}
      `);

      updatedRows += result.count ?? 0;
    }

    console.log('Transcript language normalization completed', {
      distinctValuesRewritten: changes.length,
      rowsUpdated: updatedRows,
      valuesFellBackToUnd: unrecognised.map(({ from }) => from)
    });
    process.exit(0);
  } catch (error) {
    console.error('Transcript language normalization failed', error);
    process.exit(1);
  }
}

normalizeTranscriptLanguages();
