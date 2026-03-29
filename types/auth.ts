export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  role: 'User' | 'Instructor' | 'Admin';
}
