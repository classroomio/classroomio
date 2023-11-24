export type UserLessonDataType = {
  call_url: string;
  course_id: string;
  course_title: string;
  lesson_at: string;
  lesson_id: string;
  lesson_title: string;
  is_unlocked: boolean;
};

type LessonByDayType = {
  [dayIndex: number]: UserLessonDataType[];
};

export type LessonsByMonthIndexType = {
  [monthIndex: number]: LessonByDayType;
};
