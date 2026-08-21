export type UserRole = 'admin' | 'faculty' | 'student';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  profile_picture?: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string | null;
}

export interface UserRegister {
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  password: string;
}
