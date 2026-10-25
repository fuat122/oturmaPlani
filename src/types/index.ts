export type Gender = 'female' | 'male';
export type AcademicLevel = 'high' | 'medium' | 'developing';

export interface Student {
  id: string;
  number: string; // Öğrenci Numarası
  name: string; // Adı Soyadı
  gender: Gender;
  academicLevel: AcademicLevel;
  specialNeeds: {
    frontRowRequired: boolean; // Görme, işitme, dikkat eksikliği
    notes?: string;
  };
  avoidWithStudentIds: string[]; // Yan yana oturmaması gereken öğrenciler
  observationNotes?: string; // Öğretmen gözlem ve rehberlik notları
}

export interface Desk {
  id: string;
  row: number; // 1-indexed (1 = Ön sıra)
  column: number; // 1-indexed (1 = Sol blok, 2 = Orta, 3 = Sağ)
  leftStudentId: string | null;
  rightStudentId: string | null;
}

export interface Classroom {
  id: string;
  name: string; // Örn: 9-A
  advisoryTeacher: string; // Danışman Öğretmen Adı
  academicYear: string; // Örn: 2025-2026
  rowsCount: number; // Varsayılan 4
  columnsCount: number; // Varsayılan 3 (her blokta 2'li sıra, toplam 6 öğrenci/satır)
  students: Student[];
  desks: Desk[];
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isTestUser?: boolean;
}
