import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { TSkillCreate, TSkillUpdate } from '@cio/utils/validation/skill';
import { ZSkillCreate, ZSkillUpdate } from '@cio/utils/validation/skill';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

import type {
  CreateSkillRequest,
  DeleteSkillRequest,
  ExerciseMastery,
  ExerciseMasteryRequest,
  ImportSkillsRequest,
  ImportSkillsResult,
  ListSkillsRequest,
  QuestionSkillTag,
  QuestionSkillsRequest,
  SetQuestionSkillsRequest,
  Skill,
  StudentMasteryRequest,
  StudentSkillMastery,
  SuggestSkillsRequest,
  SuggestedSkill,
  UpdateSkillRequest
} from '../utils/types';

class SkillsApi extends BaseApiWithErrors {
  skills = $state<Skill[]>([]);
  hasLoaded = $state(false);

  async list() {
    await this.execute<ListSkillsRequest>({
      requestFn: () => classroomio.skill.$get({ query: {} }),
      logContext: 'listing skills',
      onSuccess: (response) => {
        this.skills = response.data;
        this.hasLoaded = true;
      },
      onError: () => {
        snackbar.error('skills.snackbar.fetch_failed');
      }
    });
  }

  async create(fields: TSkillCreate): Promise<boolean> {
    const parsed = ZSkillCreate.safeParse(fields);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return false;
    }

    let created = false;
    await this.execute<CreateSkillRequest>({
      requestFn: () => classroomio.skill.$post({ json: parsed.data }),
      logContext: 'creating skill',
      onSuccess: () => {
        created = true;
        snackbar.success('skills.snackbar.created');
      },
      onError: (error) => {
        if (error.field) this.errors[error.field] = error.message;
        else snackbar.error(error.message);
      }
    });

    if (created) await this.list();

    return created;
  }

  async update(skillId: string, fields: TSkillUpdate): Promise<boolean> {
    const parsed = ZSkillUpdate.safeParse(fields);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return false;
    }

    let updated = false;
    await this.execute<UpdateSkillRequest>({
      requestFn: () => classroomio.skill[':skillId'].$put({ param: { skillId }, json: parsed.data }),
      logContext: 'updating skill',
      onSuccess: () => {
        updated = true;
        snackbar.success('skills.snackbar.updated');
      },
      onError: (error) => {
        if (error.field) this.errors[error.field] = error.message;
        else snackbar.error(error.message);
      }
    });

    if (updated) await this.list();

    return updated;
  }

  async remove(skillId: string): Promise<boolean> {
    let removed = false;
    await this.execute<DeleteSkillRequest>({
      requestFn: () => classroomio.skill[':skillId'].$delete({ param: { skillId } }),
      logContext: 'deleting skill',
      onSuccess: () => {
        removed = true;
        snackbar.success('skills.snackbar.deleted');
      },
      onError: (error) => {
        snackbar.error(error.message);
      }
    });

    if (removed) await this.list();

    return removed;
  }

  async importCsv(csv: string, dryRun: boolean): Promise<ImportSkillsResult | null> {
    let result: ImportSkillsResult | null = null;
    await this.execute<ImportSkillsRequest>({
      requestFn: () => classroomio.skill.import.$post({ json: { csv, dryRun } }),
      logContext: dryRun ? 'checking skills CSV' : 'importing skills CSV',
      onSuccess: (response) => {
        result = response.data;
      },
      onError: (error) => {
        snackbar.error(error.message);
      }
    });

    if (result && !dryRun) await this.list();

    return result;
  }

  async suggest(
    courseId: string,
    question: { title: string; description?: string; options?: string[] }
  ): Promise<SuggestedSkill[] | null> {
    let suggestions: SuggestedSkill[] | null = null;
    await this.execute<SuggestSkillsRequest>({
      requestFn: () => classroomio.skill.suggest.$post({ json: { courseId, ...question, limit: 5 } }),
      logContext: 'suggesting skills',
      onSuccess: (response) => {
        suggestions = response.data;
      },
      onError: (error) => {
        snackbar.error(error.message || t.get('skills.picker.suggest_failed'));
      }
    });

    return suggestions;
  }

  async getExerciseQuestionSkills(courseId: string, exerciseId: string): Promise<QuestionSkillTag[]> {
    let tags: QuestionSkillTag[] = [];
    await this.execute<QuestionSkillsRequest>({
      requestFn: () => classroomio.course[':courseId'].skill.exercise[':exerciseId'].$get({ param: { courseId, exerciseId } }),
      logContext: 'loading question skills',
      onSuccess: (response) => {
        tags = response.data;
      }
    });

    return tags;
  }

  async setQuestionSkills(courseId: string, exerciseId: string, questionId: number, skillIds: string[]) {
    let saved = false;
    await this.execute<SetQuestionSkillsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].skill.exercise[':exerciseId'].question[':questionId'].$put({
          param: { courseId, exerciseId, questionId: String(questionId) },
          json: { skillIds }
        }),
      logContext: 'setting question skills',
      onSuccess: () => {
        saved = true;
      },
      onError: (error) => {
        snackbar.error(error.message);
      }
    });

    return saved;
  }

  async getExerciseMastery(courseId: string, exerciseId: string): Promise<ExerciseMastery | null> {
    let mastery: ExerciseMastery | null = null;
    await this.execute<ExerciseMasteryRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].skill.mastery.exercise[':exerciseId'].$get({ param: { courseId, exerciseId } }),
      logContext: 'loading exercise skill mastery',
      onSuccess: (response) => {
        mastery = response.data;
      }
    });

    return mastery;
  }

  async getStudentMastery(courseId: string, profileId: string): Promise<StudentSkillMastery[]> {
    let mastery: StudentSkillMastery[] = [];
    await this.execute<StudentMasteryRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].skill.mastery.student[':profileId'].$get({ param: { courseId, profileId } }),
      logContext: 'loading student skill mastery',
      onSuccess: (response) => {
        mastery = response.data;
      }
    });

    return mastery;
  }
}

export const skillsApi = new SkillsApi();
