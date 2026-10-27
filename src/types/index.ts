export type Gender = 'female' | 'male';
export type TeacherRole = 'advisory' | 'branch'; // advisory: Sınıf Rehber Öğretmeni, branch: Branş Öğretmeni

export interface StudentObservationLog {
  id: string;
  date: string; // ISO string
  teacherName?: string;
  note: string;
  tag?: 'katilim' | 'odev' | 'davranis' | 'tebrik' | 'diger';
}

export interface Student {
  id: string;
  number: string; // Öğrenci Numarası
  name: string; // Adı Soyadı
  gender: Gender;
  academicLevel?: 'high' | 'medium' | 'developing'; // Eski veri uyumluluğu için opsiyonel
  specialNeeds: {
    frontRowRequired: boolean; // Görme, işitme, dikkat önceliği
    notes?: string;
  };
  avoidWithStudentIds: string[]; // Yan yana oturmaması gereken öğrenciler
  observationNotes?: string; // Öğretmen gözlem ve rehberlik notları
  observations?: StudentObservationLog[]; // Ders içi tarihli bireysel yorumlar
}

export interface Desk {
  id: string;
  row: number; // 1-indexed (1 = Ön sıra)
  column: number; // 1-indexed (1 = Sol blok, 2 = Orta, 3 = Sağ)
  leftStudentId: string | null;
  rightStudentId: string | null;
}

export interface ClassroomLog {
  id: string;
  date: string; // ISO string
  teacherName?: string;
  lessonName?: string; // Örn: Matematik, Fizik, Rehberlik
  note: string;
}

export interface Classroom {
  id: string;
  name: string; // Örn: 9-A
  advisoryTeacher: string; // Danışman Öğretmen Adı
  creatorEmail?: string;
  creatorUid?: string;
  academicYear: string; // Örn: 2025-2026
  rowsCount: number; // Varsayılan 4
  columnsCount: number; // Varsayılan 3
  students: Student[];
  desks: Desk[];
  classroomLogs?: ClassroomLog[]; // Toplu sınıf yorumları ve ders günlüğü
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isTestUser?: boolean;
  role?: TeacherRole;
}
