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
  isPublic: boolean;
  status: string;
  expiration: string | Date;
  options: PollOptionType[];
};

export type TabsType = {
  label: string;
  value: number;
  number: number;
}[];
