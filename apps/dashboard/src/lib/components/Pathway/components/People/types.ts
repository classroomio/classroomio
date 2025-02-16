export interface Profile {
  id: string;
  fullname: string;
  username: string;
  email: string;
  avatar_url?: string;
}

export interface Person {
  id: string;
  email?: string;
  role_id: number;
  profile?: Profile;
  profile_id?: string;
  assigned_student_id: string;
}

export interface ProfileRole {
  label: string;
  value: string | number;
}
