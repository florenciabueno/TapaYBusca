export interface UpdateProfileDto {
  name?: string;
  currentPassword?: string;
  password?: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
}
