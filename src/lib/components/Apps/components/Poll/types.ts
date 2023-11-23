export type PollOptionType = {
  id: string;
  label: string;
  selectedBy: {
    id: string;
    username: string;
    fullname: string;
    avatarUrl: string;
  }[];
};

export type PollType = {
  courseId: string;
  id: string;
  question: string;
  author: {
    id: string;
    username: string;
    fullname: string;
    avatarUrl: string;
  };
  status: string;
  isPublic: boolean;
  expiration: string | Date;
  options: PollOptionType[];
};

export type TabsType = {
  label: string;
  value: number;
  number: number;
}[];

export type PollOptionsSubmissionType = {
  poll_id: string;
  poll_option_id: string;
  selected_by_id: string;
};

export type FetchPollsResponse = {
  id: string;
  courseId: string;
  expiration: string;
  authorId: string;
  status: string;
  question: string;
  created_at: string;
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
}[];
