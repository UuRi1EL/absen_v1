export type Role = 'ADMIN' | 'TEACHER' | 'PRINCIPAL';

export interface UserProfile {
  id: string;
  nip: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  teacherProfile?: {
    school?: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      radiusMeters: number;
    };
    department?: string;
    position?: string;
    nuptk?: string;
    ukgId?: string;
    ptkDapodikId?: string;
    employmentStatus?: string;
    belajarId?: string;
    workShiftStart?: string;
    workShiftEnd?: string;
  };
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK';
  latitude: number;
  longitude: number;
  distanceMeters: number;
  selfieUrl: string;
  notes?: string;
}
