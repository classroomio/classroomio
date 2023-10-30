import { supabase } from '$lib/utils/functions/supabase';

export async function fetchPolls(courseId: string) {
  return await supabase
    .from('apps_poll')
    .select(
      `
      *,
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
    .returns<
      {
        id: string;
        courseId: string;
        expiration: string;
        authorId: string;
        status: string;
        question: string;
        isPublic: boolean;
        author: {
          profile: {
            username: string;
            fullname: string;
            avatar_url: string;
          };
        };
        options: {
          id: string;
          label: string;
          submissions: {
            selectedBy: {
              id: string;
              profile: {
                username: string;
                fullname: string;
                avatar_url: string;
              };
            };
          }[];
        }[];
      }[]
    >();
}
