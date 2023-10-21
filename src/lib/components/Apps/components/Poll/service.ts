import { snackbar } from '$lib/components/Snackbar/store';
import type { PollType } from './types';
import { getSupabase } from '$lib/utils/functions/supabase';
import type { GroupPerson } from '$lib/utils/types';

const supabase = getSupabase();

export async function createPoll(poll: PollType, groupmember: GroupPerson, courseId: string) {
  if (!groupmember) return;

  const { data: newPolls, error } = await supabase
    .from('apps_poll')
    .insert({
      question: poll.question,
      authorId: groupmember.id,
      isPublic: poll.isPublic,
      status: poll.question,
      expiration: poll.expiration,
      courseId
    })
    .select();

  if (!newPolls || error) {
    snackbar.error('Error creating poll');
    console.error(error);
    return;
  }

  const [newPoll] = newPolls;

  if (!newPoll.id) return;
  poll = {
    poll,
    ...newPoll
  };

  poll.options = await Promise.all(
    poll.options.map(async (option) => {
      const { data: newPollOptions, error: newPollOptionsError } = await supabase
        .from('apps_poll_option')
        .insert({
          poll_id: newPoll.id,
          label: option.label
        })
        .select();

      if (!newPollOptions || newPollOptionsError) {
        return option;
      }

      const [newPollOption] = newPollOptions;
      option.id = newPollOption.id;

      return option;
    })
  );

  return poll;
}

export async function fetchPolls(courseId: string) {
  const {} = await supabase
    .from('app_poll')
    .select(
      `
      id,
      question,
      isPublic,
      status,
      expiration
      groupmember:authorId(
        profile!inner(
          id,
          fullname,
          avatar_url
        )
      )
      apps_poll_option!inner(
        id,
        label,
      )
    `
    )
    .match({
      courseId
    });
}
