export interface Profile {
  id: string;
  fullname: string;
  username: string;
  email: string;
}

export interface Person {
  id: string;
  email?: string;
  role_id: number;
  profile?: Profile;
}
