import { Student, Desk } from '../types';

export interface SeatingResult {
  desks: Desk[];
  unseatedStudents: Student[];
  metrics: {
    frontRowSuccessRate: number; // Yüzde (%)
    genderBalanceScore: number; // Yüzde (%)
    conflictCount: number; // Sıfır olmalı
    totalSeated: number;
    totalSeats: number;
  };
}

/**
 * Akıllı Sınıf Oturma Algoritması (ALKEV Pedagojik Denge Motoru):
 * - Kural 1: Ön sıra gereksinimi (Görme, işitme, dikkat) olan öğrenciler öncelikle 1. sıraya yerleştirilir.
 * - Kural 2: Birbirleriyle oturmaması gereken öğrenciler (avoidWithStudentIds) asla aynı sıraya konmaz.
 * - Kural 3: Sıra arkadaşı cinsiyet çeşitliliği gözetilerek eşleştirilir (Kız-Erkek dengesi).
 * - Kural 4: Monte Carlo / Skorlama ile en dengeli düzeni seçer.
 * Not: Başarı düzeyi etiketlemesi kaldırılmıştır, tüm öğrencilere eşit pedagojik yaklaşım esastır.
 */
export const runSmartSeating = (
  students: Student[],
  baseDesks: Desk[]
): SeatingResult => {
  if (students.length === 0) {
    return {
      desks: baseDesks.map(d => ({ ...d, leftStudentId: null, rightStudentId: null })),
      unseatedStudents: [],
      metrics: {
        frontRowSuccessRate: 100,
        genderBalanceScore: 100,
        conflictCount: 0,
        totalSeated: 0,
        totalSeats: baseDesks.length * 2
      }
    };
  }

  const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));
  const totalSeats = baseDesks.length * 2;

  // Sıraları ön sıradan arka sıraya doğru sıralayalım
  const sortedDesks = [...baseDesks].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.column - b.column;
  });

  // En iyi düzeni bulmak için çoklu iterasyon simülasyonu
  let bestDesks: Desk[] = [];
  let bestScore = -Infinity;
  let bestMetrics = {
    frontRowSuccessRate: 100,
    genderBalanceScore: 100,
    conflictCount: 0,
    totalSeated: 0,
    totalSeats
  };

  const ITERATIONS = 40;

  for (let it = 0; it < ITERATIONS; it++) {
    // Klonlanmış sıra şablonu
    const trialDesks: Desk[] = sortedDesks.map(d => ({
      ...d,
      leftStudentId: null,
      rightStudentId: null
    }));

    // Öğrencileri kategorize edelim (Ön sıra gereksinimi olanlar öncelikli)
    const frontRowReqStudents = students.filter(s => s.specialNeeds.frontRowRequired);
    const standardStudents = students.filter(s => !s.specialNeeds.frontRowRequired);

    // Rastgele karıştır (shuffle)
    const shuffledFront = [...frontRowReqStudents].sort(() => Math.random() - 0.5);
    const shuffledStandard = [...standardStudents].sort(() => Math.random() - 0.5);

    const remainingToSeat = [...shuffledFront, ...shuffledStandard];

    // Koltukları doldururken akıllı seçim
    for (const desk of trialDesks) {
      if (remainingToSeat.length === 0) break;

      // Sol koltuk için öğrenci seç:
      // Eğer sıra 1 ise ve hala ön sıra isteyen varsa öncelik ver
      let leftStudentIdx = -1;
      if (desk.row === 1) {
        leftStudentIdx = remainingToSeat.findIndex(s => s.specialNeeds.frontRowRequired);
      }
      if (leftStudentIdx === -1) {
        leftStudentIdx = 0;
      }
      const leftStudent = remainingToSeat.splice(leftStudentIdx, 1)[0];
      desk.leftStudentId = leftStudent.id;

      if (remainingToSeat.length === 0) break;

      // Sağ koltuk için öğrenci seç:
      // leftStudent ile çatışmayan, cinsiyet dengesi kuracak en iyi adayı bul
      let bestPartnerIdx = 0;
      let highestPartnerScore = -999;

      for (let i = 0; i < Math.min(remainingToSeat.length, 8); i++) {
        const candidate = remainingToSeat[i];
        let pScore = 0;

        // Çatışma kontrolü (Kesinlikle yan yana oturmamalı)
        const hasConflict =
          leftStudent.avoidWithStudentIds.includes(candidate.id) ||
          candidate.avoidWithStudentIds.includes(leftStudent.id);
        if (hasConflict) {
          pScore -= 500;
        }

        // Ön sıra tercihi kontrolü
        if (desk.row === 1 && candidate.specialNeeds.frontRowRequired) {
          pScore += 100;
        } else if (desk.row > 1 && candidate.specialNeeds.frontRowRequired) {
          pScore -= 80;
        }

        // Cinsiyet dengesi: Kız-Erkek eşleşmesi
        if (candidate.gender !== leftStudent.gender) {
          pScore += 40;
        }

        if (pScore > highestPartnerScore) {
          highestPartnerScore = pScore;
          bestPartnerIdx = i;
        }
      }

      const rightStudent = remainingToSeat.splice(bestPartnerIdx, 1)[0];
      desk.rightStudentId = rightStudent.id;
    }

    // Bu iterasyonun puanını hesapla
    let iterationScore = 0;
    let conflicts = 0;
    let frontRowMet = 0;
    let totalFrontReq = frontRowReqStudents.length;
    let genderBalancedPairs = 0;
    let filledPairs = 0;
    let totalSeated = 0;

    for (const desk of trialDesks) {
      const left = desk.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
      const right = desk.rightStudentId ? studentMap.get(desk.rightStudentId) : null;

      if (left) totalSeated++;
      if (right) totalSeated++;

      // Ön sıra kontrolü
      if (desk.row === 1) {
        if (left?.specialNeeds.frontRowRequired) frontRowMet++;
        if (right?.specialNeeds.frontRowRequired) frontRowMet++;
      }

      if (left && right) {
        filledPairs++;

        // Çatışma
        if (
          left.avoidWithStudentIds.includes(right.id) ||
          right.avoidWithStudentIds.includes(left.id)
        ) {
          conflicts++;
          iterationScore -= 1000;
        }

        // Cinsiyet dengesi
        if (left.gender !== right.gender) {
          genderBalancedPairs++;
          iterationScore += 50;
        }
      }
    }

    const frontRowRate = totalFrontReq > 0 ? (frontRowMet / totalFrontReq) * 100 : 100;
    iterationScore += frontRowRate * 20;

    if (iterationScore > bestScore || bestDesks.length === 0) {
      bestScore = iterationScore;
      bestDesks = trialDesks;
      bestMetrics = {
        frontRowSuccessRate: Math.round(frontRowRate),
        genderBalanceScore: filledPairs > 0 ? Math.round((genderBalancedPairs / filledPairs) * 100) : 100,
        conflictCount: conflicts,
        totalSeated,
        totalSeats
      };
    }
  }

  // Yerleşemeyen öğrencileri belirle
  const seatedIds = new Set<string>();
  for (const desk of bestDesks) {
    if (desk.leftStudentId) seatedIds.add(desk.leftStudentId);
    if (desk.rightStudentId) seatedIds.add(desk.rightStudentId);
  }
  const unseatedStudents = students.filter(s => !seatedIds.has(s.id));

  return {
    desks: bestDesks,
    unseatedStudents,
    metrics: bestMetrics
  };
};
