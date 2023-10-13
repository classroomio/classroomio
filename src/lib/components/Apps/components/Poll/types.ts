export type PollType = {
  id: string;
  question: string;
  author: {
    id: string;
    label: string;
    fullname: string;
    avatarUrl: string;
  };
  isPublic: boolean;
  status: string;
  expiration: string | Date;
  options:
    | {
        id: string;
        label: string;
        selectedBy: {
          id: string;
          label: string;
          fullname: string;
          avatarUrl: string;
        }[];
      }[];
};

export type TabsType = {
  label: string;
  value: number;
  number: number;
}[];
