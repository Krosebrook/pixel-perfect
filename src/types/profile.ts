export interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  environment_mode: string | null;
  created_at: string;
  updated_at: string;
}

export type EnvironmentMode = 'sandbox' | 'production';
