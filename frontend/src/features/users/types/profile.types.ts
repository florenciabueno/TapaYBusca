export interface Profile {
  id: string;
  email: string;
  name: string;
}

export interface UpdateProfileData {
  name?: string;
  currentPassword?: string;
  password?: string;
}
