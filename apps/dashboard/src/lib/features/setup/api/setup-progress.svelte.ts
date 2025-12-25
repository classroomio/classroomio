import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

export interface SetupItem {
  id: string;
  title: string;
  desc: string;
  is_completed: boolean;
  button_label: string;
}

export interface SetupProgressData {
  setup: SetupItem[];
  courses: Array<{ id: string; [key: string]: unknown }>;
  lessons: Array<{ id: string; [key: string]: unknown }>;
  orgSiteName: string;
}

type TCreateSetupData = {
  orgHasAvatarUrl?: boolean;
  isCourseCreated?: boolean;
  isLessonCreated?: boolean;
  isExerciseCreated?: boolean;
  isCoursePublished?: boolean;
};

// Base setup data structure - created once
const createSetupData = ({
  orgHasAvatarUrl = false,
  isCourseCreated = false,
  isLessonCreated = false,
  isExerciseCreated = false,
  isCoursePublished = false
}: TCreateSetupData = {}): SetupItem[] => [
  {
    id: 'profile',
    title: 'setup.personal_profile.title',
    desc: 'setup.personal_profile.desc',
    is_completed: false,
    button_label: 'setup.personal_profile.button_label'
  },
  {
    id: 'organization',
    title: 'setup.organization_profile.title',
    desc: 'setup.organization_profile.desc',
    is_completed: orgHasAvatarUrl,
    button_label: 'setup.organization_profile.button_label'
  },
  {
    id: 'course',
    title: 'setup.course.title',
    desc: 'setup.course.desc',
    is_completed: isCourseCreated,
    button_label: 'setup.course.button_label'
  },
  {
    id: 'lesson',
    title: 'setup.lesson.title',
    desc: 'setup.lesson.desc',
    is_completed: isLessonCreated,
    button_label: 'setup.lesson.button_label'
  },
  {
    id: 'exercise',
    title: 'setup.exercise.title',
    desc: 'setup.exercise.desc',
    is_completed: isExerciseCreated,
    button_label: 'setup.exercise.button_label'
  },
  {
    id: 'publish',
    title: 'setup.publish_course.title',
    desc: 'setup.publish_course.desc',
    is_completed: isCoursePublished,
    button_label: 'setup.publish_course.button_label'
  }
];

/**
 * API class for setup progress operations
 */
class SetupProgressApi extends BaseApiWithErrors {
  progress = $state<SetupProgressData>({
    orgSiteName: '',
    setup: [],
    courses: [],
    lessons: []
  });

  constructor() {
    super();
    this.isLoading = true;
  }

  /**
   * Computed setup list with profile completion check
   * This computation is shared across components to avoid duplication
   * Note: Profile completion check should be done in components using $profile
   * This returns the base setup list, and components can derive the final list
   */
  get setupList(): SetupItem[] {
    return this.progress.setup || [];
  }
  /**
   * Fetches setup progress data for an organization
   * @param siteName Organization site name
   */
  async fetchSetupProgress(siteName: string) {
    await this.execute<typeof classroomio.organization.setup.$get>({
      requestFn: () =>
        classroomio.organization.setup.$get({
          query: { siteName }
        }),
      logContext: 'fetching setup progress',
      onSuccess: (response) => {
        if (!response.data) {
          // Set default empty state if no data
          const setup = createSetupData();
          this.progress = {
            orgSiteName: siteName,
            setup,
            courses: [],
            lessons: []
          };
          return;
        }

        const {
          isCourseCreated,
          isCoursePublished,
          orgHasAvatarUrl,
          courseData,
          lessonData,
          isLessonCreated,
          isExerciseCreated
        } = response.data;

        const setup = createSetupData({
          orgHasAvatarUrl,
          isCourseCreated,
          isLessonCreated,
          isExerciseCreated,
          isCoursePublished
        });

        this.progress = {
          orgSiteName: siteName,
          setup,
          courses: courseData || [],
          lessons: lessonData || []
        };
      },
      onError: (error) => {
        console.error('Error fetching setup progress:', error);
        // Set default empty state on error
        const setup = createSetupData();
        this.progress = {
          orgSiteName: siteName,
          setup,
          courses: [],
          lessons: []
        };
      }
    });
  }
}

export const setupProgressApi = new SetupProgressApi();

/**
 * Calculates progress percentage from setup items
 */
export function calculateProgress(setupItems: SetupItem[]): number {
  if (!setupItems || setupItems.length === 0) return 0;
  const completed = setupItems.filter((item) => item.is_completed).length;
  return Math.round((completed / setupItems.length) * 100);
}
