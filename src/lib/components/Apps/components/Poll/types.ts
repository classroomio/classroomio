export type Poll = {
  question: string;
  authorId: string; // groupmember_id
  isPublic: boolean;
  expiration: string | Date;
  options: {
    label: string;
    selectedBy: {
      id: string;
      fullname: string;
      avatarUrl: string;
    }[];
  }[];
};
