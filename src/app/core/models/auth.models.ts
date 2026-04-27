export interface AuthUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
  grade: number | null;
  section: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterStudentRequest {
  fullName: string;
  username: string;
  password: string;
  grade: number | null;
  section: string | null;
}
