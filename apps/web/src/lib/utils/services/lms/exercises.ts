import { supabase } from '$lib/utils/functions/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface LMSExercise {
  id: string;
  title: string;
  updated_at: string;
  questions: {
    points: number;
  }[];
  submission: {
    status_id: number;
    updated_at: string;
    total: number;
    groupmember: {
      id: string;
      profile: {
        id: string;
      }[];
    }[];
  }[];
  lesson: {
    id: string;
    title: string;
    order: number;
    course: {
      id: string;
      title: string;
      group: {
        organisation: {
          id: string;
        }[];
      }[];
      groupmember: {
        id: string;
        profile: {
          id: string;
        }[];
      }[];
    };
  };
}

interface FetchLMSExercisesResponse {
  exercises: LMSExercise[] | null;
  error: PostgrestError | null;
}

export async function fetchLMSExercises(
  profileId: string,
  orgId: string
): Promise<FetchLMSExercisesResponse> {
  const { data, error } = await supabase
    .from('exercise')
    .select(
      `
      id,
      title,
      updated_at,
      questions:question(points),
      submission (
        status_id,
        updated_at,
        total,
        groupmember:submitted_by!inner (
          id,
          profile:profile_id!inner (
            id
          )
        )
      ),
      lesson!inner (
        id,
        title,
        order,
        is_unlocked,
        course!inner (
          id,
          title,
          group:group_id!inner (
            organisation:organization_id!inner (
              id
            ),
            groupmember!inner(
              id,
              profile:profile_id!inner (
                id
              )
            )
          )
        )
      )
    `
    )
    .eq('lesson.is_unlocked', true)
    .eq('lesson.course.group.organisation.id', orgId)
    .eq('lesson.course.group.groupmember.profile.id', profileId)
    .eq('submission.groupmember.profile.id', profileId);

  return {
    exercises: data as LMSExercise[] | null,
    error
  };
}
