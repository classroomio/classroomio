export type IPoll = {
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

export type ITabs = {
  label: string;
  value: number;
  number: number;
}[];
