export interface CurrentSessionType {
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

export interface UserType {
  openAuthModal: boolean;
  fetchingUser: boolean | null;
  isLoggedIn: boolean;
  currentSession: CurrentSessionType | null;
  expiresAt: number;
}

export interface ProfileType {}
