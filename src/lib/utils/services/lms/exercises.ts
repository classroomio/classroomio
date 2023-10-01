import { supabase } from '$lib/utils/functions/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export interface LMSExercise {
  id: string;
  title: string;
  updated_at: string;
  submission: {
    status_id: number;
    updated_at: string;
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
      submission (
        status_id,
        updated_at,
        groupmember:submitted_by!inner (
          id,
          profile!inner (
            id
          )
        )
      ),
      lesson!inner (
        id,
        title,
        order,
        course!inner (
          id,
          title,
          group:group_id!inner (
            organisation:organization_id!inner (
              id
            )
          ),
          groupmember:group_id!inner(
            id,
            profile!inner (
              id
            )
          )
        )
      )
    `
    )
    .eq('lesson.course.group.organisation.id', orgId)
    .eq('lesson.course.groupmember.profile.id', profileId)
    .eq('submission.groupmember.profile.id', profileId);

  return {
    exercises: data,
    error
  };
}
