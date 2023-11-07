import { snackbar } from '$lib/components/Snackbar/store';
import type { PollType, PollOptionType, FetchPollsResponse } from './types';
import { getSupabase } from '$lib/utils/functions/supabase';
import { polls } from './store';

const supabase = getSupabase();

export async function fetchPolls(courseId: string) {
  return await supabase
    .from('apps_poll')
    .select(
      `
      *,
      created_at,
      author:groupmember(
        profile(
          username,
          fullname,
          avatar_url
        )
      ),
      options: apps_poll_option (
        id,
        label,
        submissions:apps_poll_submission(
          selectedBy:groupmember(
            id,
            profile(
              username,
              fullname,
              avatar_url
            )
          )
        )
      )
    `
    )
    .match({ courseId })
    .order('created_at', { ascending: false })
    .returns<FetchPollsResponse>();
}

export const updatePollStatus = async (pollId: string, status: PollType['status']) => {
  const { error } = await supabase.from('apps_poll').update({ status }).match({ id: pollId });

  if (error) {
    console.log(error);
    snackbar.error('An error occurred while updating poll status');
    return;
  }
};

export const togglePollSubmission = async (
  pollId: PollType['id'],
  pollOptionId: PollOptionType['id'],
  groupmemberId: string,
  add: boolean
) => {
  if (add) {
    const { error } = await supabase.from('apps_poll_submission').insert({
      poll_id: pollId,
      poll_option_id: pollOptionId,
      selected_by_id: groupmemberId
    });
    if (error) {
      console.log(error);
      snackbar.error('An error occurred while submitting poll');
      return;
    }
  } else {
    const { error } = await supabase.from('apps_poll_submission').delete().match({
      poll_id: pollId,
      poll_option_id: pollOptionId,
      selected_by_id: groupmemberId
    });

    if (error) {
      console.log(error);
      snackbar.error('An error occurred while submitting poll');
      return;
    }
  }
};

function isOptionSelectedByCurrentUser(option: PollOptionType, groupmemberId: string) {
  return option.selectedBy.some((gmember) => gmember.id === groupmemberId);
}

export function handleVote(pollId: string, groupmemberId: string, author: PollType['author']) {
  return (optionId: string) => {
    // we have the pollId and the optionId
    polls.update((_polls) => {
      return [
        ..._polls.map((poll) => {
          // Prevent user from voting on their own poll
          // if (poll.author.id === currentGroupMember?.id) return poll;

          // Prevent user from voting on a poll that has expired
          if (poll.expiration && new Date(poll.expiration) < new Date()) return poll;

          if (poll.id === pollId) {
            // Prevent user from voting on a poll that the status is not published
            if (poll.status !== 'published') {
              snackbar.info('Poll is not published yet');
              return poll;
            }

            // Prevent user from voting twice
            if (
              poll.options.some((option) => isOptionSelectedByCurrentUser(option, groupmemberId))
            ) {
              snackbar.info('You can only vote once');
              return poll;
            }

            poll.options = poll.options.map((option) => {
              const isSelected = isOptionSelectedByCurrentUser(option, groupmemberId);

              // If user has not voted on this option, add their vote
              if (option.id === optionId && !isSelected) {
                option.selectedBy = [...option.selectedBy, author];

                togglePollSubmission(pollId, optionId, groupmemberId, true);
              }
              // else if (isSelected) {
              //   // If user has voted on this option, remove their vote
              //   option.selectedBy = option.selectedBy.filter(
              //     (gmember) => gmember.id !== groupmemberId
              //   );
              // }

              return option;
            });
          }

          return poll;
        })
      ];
    });
  };
}
