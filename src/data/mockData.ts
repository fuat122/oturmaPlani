import { Classroom, Student, Desk } from '../types';

export const initialStudents: Student[] = [
  {
    id: 's1',
    number: '101',
    name: 'Ada Yılmaz',
    gender: 'female',
    academicLevel: 'high',
    specialNeeds: { frontRowRequired: true, notes: 'Hafif miyop gözlük kullanımı, ön sıra önerildi' },
    avoidWithStudentIds: ['s4'],
    observationNotes: 'Derse katılımı yüksek, grup çalışmalarında liderlik vasfı var.'
  },
  {
    id: 's2',
    number: '104',
    name: 'Batuhan Kaya',
    gender: 'male',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Görsel ders materyallerine daha iyi odaklanıyor.'
  },
  {
    id: 's3',
    number: '112',
    name: 'Ceren Demir',
    gender: 'female',
    academicLevel: 'high',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Ödev sorumluluğu tam, sakin ve düzenli.'
  },
  {
    id: 's4',
    number: '118',
    name: 'Deniz Şahin',
    gender: 'male',
    academicLevel: 'developing',
    specialNeeds: { frontRowRequired: true, notes: 'Dikkat dağınıklığı, ön sıralarda tahtaya yakın olmalı' },
    avoidWithStudentIds: ['s1', 's9'],
    observationNotes: 'Bireysel yönlendirme yapıldığında motivasyonu çok yükseliyor.'
  },
  {
    id: 's5',
    number: '125',
    name: 'Ece Koç',
    gender: 'female',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Almanca ve İngilizce etkinliklerinde istekli.'
  },
  {
    id: 's6',
    number: '130',
    name: 'Emir Arslan',
    gender: 'male',
    academicLevel: 'high',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Matematik ve fen projelerinde başarılı.'
  },
  {
    id: 's7',
    number: '137',
    name: 'Gizem Çelik',
    gender: 'female',
    academicLevel: 'developing',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Akran desteği ile çalışma performansı artıyor.'
  },
  {
    id: 's8',
    number: '142',
    name: 'Hasan Aksoy',
    gender: 'male',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Beden eğitimi ve spor kulübü temsilcisi.'
  },
  {
    id: 's9',
    number: '149',
    name: 'İpek Kurt',
    gender: 'female',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: ['s4'],
    observationNotes: 'Arkadaşlarıyla iletişimi kuvvetli, aktif dinleyici.'
  },
  {
    id: 's10',
    number: '155',
    name: 'Kerem Öztürk',
    gender: 'male',
    academicLevel: 'high',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Robotik kodlama meraklısı, analitik düşünme becerisi iyi.'
  },
  {
    id: 's11',
    number: '162',
    name: 'Lara Aydın',
    gender: 'female',
    academicLevel: 'high',
    specialNeeds: { frontRowRequired: true, notes: 'İşitme cihazı kullanıyor, öğretmen sesini net duymalı' },
    avoidWithStudentIds: [],
    observationNotes: 'Yazılı ifadeleri çok güçlü, sanatsal yönü gelişmiş.'
  },
  {
    id: 's12',
    number: '168',
    name: 'Mert Yıldız',
    gender: 'male',
    academicLevel: 'developing',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Destekleyici çalışma arkadaşıyla daha verimli çalışıyor.'
  },
  {
    id: 's13',
    number: '174',
    name: 'Nehir Bulut',
    gender: 'female',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Okuma saatlerinde çok verimli.'
  },
  {
    id: 's14',
    number: '181',
    name: 'Oğuzhan Tekin',
    gender: 'male',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Tarih ve sosyal bilgiler derslerinde ilgili.'
  },
  {
    id: 's15',
    number: '188',
    name: 'Pelin Güler',
    gender: 'female',
    academicLevel: 'high',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Örnek sınıf başkanı yardımcısı.'
  },
  {
    id: 's16',
    number: '193',
    name: 'Rüzgar Can',
    gender: 'male',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Laboratuvar deneylerine çok hevesli.'
  },
  {
    id: 's17',
    number: '202',
    name: 'Selin Doğan',
    gender: 'female',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Düzenli tekrar alışkanlığı var.'
  },
  {
    id: 's18',
    number: '209',
    name: 'Tolga Polat',
    gender: 'male',
    academicLevel: 'developing',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Soru sormaktan çekinmiyor, adım adım ilerliyor.'
  },
  {
    id: 's19',
    number: '215',
    name: 'Yağmur Eren',
    gender: 'female',
    academicLevel: 'high',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'TÜBİTAK projesine hazırlanıyor.'
  },
  {
    id: 's20',
    number: '221',
    name: 'Yiğit Korkmaz',
    gender: 'male',
    academicLevel: 'medium',
    specialNeeds: { frontRowRequired: false },
    avoidWithStudentIds: [],
    observationNotes: 'Basketbol okul takımında yer alıyor.'
  }
];

export const generateDefaultDesks = (rows: number = 4, cols: number = 3): Desk[] => {
  const desks: Desk[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      desks.push({
        id: `desk-r${r}-c${c}`,
        row: r,
        column: c,
        leftStudentId: null,
        rightStudentId: null
      });
    }
  }
  return desks;
};

// Default classrooms list
export const defaultClassrooms: Classroom[] = [
  {
    id: 'class-9a',
    name: '9-A',
    advisoryTeacher: 'Zeynep Kaya',
    academicYear: '2026-2027',
    rowsCount: 4,
    columnsCount: 3,
    students: [...initialStudents],
    desks: generateDefaultDesks(4, 3),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'class-10b',
    name: '10-B',
    advisoryTeacher: 'Murat Şen',
    academicYear: '2026-2027',
    rowsCount: 4,
    columnsCount: 3,
    students: initialStudents.slice(0, 16),
    desks: generateDefaultDesks(4, 3),
    updatedAt: new Date().toISOString()
  }
];
