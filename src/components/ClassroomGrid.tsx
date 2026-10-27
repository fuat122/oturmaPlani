import React, { useState } from 'react';
import { Classroom, Student, Desk } from '../types';
import {
  Eye,
  AlertTriangle,
  ArrowRightLeft,
  X,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Sparkles,
  UserPlus,
  Users
} from 'lucide-react';

interface ClassroomGridProps {
  classroom: Classroom;
  onUpdateDesks: (desks: Desk[]) => void;
  onSelectStudentToEdit?: (student: Student) => void;
  onOpenAddStudent?: () => void;
}

export const ClassroomGrid: React.FC<ClassroomGridProps> = ({
  classroom,
  onUpdateDesks,
  onSelectStudentToEdit,
  onOpenAddStudent
}) => {
  // Selected slot for swapping / moving
  const [selectedSeat, setSelectedSeat] = useState<{
    type: 'desk';
    deskId: string;
    position: 'left' | 'right';
    studentId: string | null;
  } | {
    type: 'unseated';
    studentId: string;
  } | null>(null);

  const studentMap = new Map<string, Student>(classroom.students.map(s => [s.id, s]));

  // Find unseated students
  const seatedStudentIds = new Set<string>();
  classroom.desks.forEach(d => {
    if (d.leftStudentId) seatedStudentIds.add(d.leftStudentId);
    if (d.rightStudentId) seatedStudentIds.add(d.rightStudentId);
  });
  const unseatedStudents = classroom.students.filter(s => !seatedStudentIds.has(s.id));

  const handleSeatClick = (deskId: string, position: 'left' | 'right', currentStudentId: string | null) => {
    if (!selectedSeat) {
      // Nothing selected yet. If seat has a student, select it!
      if (currentStudentId) {
        setSelectedSeat({ type: 'desk', deskId, position, studentId: currentStudentId });
      }
      return;
    }

    // A seat was already selected
    if (selectedSeat.type === 'unseated') {
      // Move unseated student to this desk slot
      const studentToPlace = selectedSeat.studentId;
      const updatedDesks = classroom.desks.map(desk => {
        if (desk.id === deskId) {
          return {
            ...desk,
            [position === 'left' ? 'leftStudentId' : 'rightStudentId']: studentToPlace
          };
        }
        return desk;
      });
      onUpdateDesks(updatedDesks);
      setSelectedSeat(null);
      return;
    }

    if (selectedSeat.type === 'desk') {
      // Deselect if clicking the exact same seat
      if (selectedSeat.deskId === deskId && selectedSeat.position === position) {
        setSelectedSeat(null);
        return;
      }

      // Swap between selected desk seat and this desk seat
      const sourceDeskId = selectedSeat.deskId;
      const sourcePosition = selectedSeat.position;
      const sourceStudentId = selectedSeat.studentId;

      const targetStudentId = currentStudentId;

      const updatedDesks = classroom.desks.map(desk => {
        let newDesk = { ...desk };
        if (desk.id === sourceDeskId) {
          if (sourcePosition === 'left') {
            newDesk.leftStudentId = targetStudentId;
          } else {
            newDesk.rightStudentId = targetStudentId;
          }
        }
        if (desk.id === deskId) {
          if (position === 'left') {
            newDesk.leftStudentId = sourceStudentId;
          } else {
            newDesk.rightStudentId = sourceStudentId;
          }
        }
        return newDesk;
      });

      onUpdateDesks(updatedDesks);
      setSelectedSeat(null);
    }
  };

  const handleRemoveFromSeat = (deskId: string, position: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedDesks = classroom.desks.map(desk => {
      if (desk.id === deskId) {
        return {
          ...desk,
          [position === 'left' ? 'leftStudentId' : 'rightStudentId']: null
        };
      }
      return desk;
    });
    onUpdateDesks(updatedDesks);
    if (selectedSeat?.type === 'desk' && selectedSeat.deskId === deskId && selectedSeat.position === position) {
      setSelectedSeat(null);
    }
  };

  // Group desks by row
  const rows = classroom.rowsCount || 4;
  const cols = classroom.columnsCount || 3;

  const deskByCoords: { [key: string]: Desk } = {};
  classroom.desks.forEach(desk => {
    deskByCoords[`${desk.row}-${desk.column}`] = desk;
  });

  return (
    <div className="space-y-6">
      
      {/* Sınıfta Öğrenci Yoksa Uyarı Alanı */}
      {classroom.students.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            "{classroom.name}" Sınıfında Henüz Öğrenci Yok
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Oturma planını oluşturmaya başlamak için tekli öğrenci ekleyebilir veya toplu liste (Excel / e-Okul) yapıştırabilirsiniz.
          </p>
          {onOpenAddStudent && (
            <button
              onClick={onOpenAddStudent}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Öğrenci Ekle
            </button>
          )}
        </div>
      )}

      {/* Tahta & Öğretmen Kürsüsü Bölgesi */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm text-center relative overflow-hidden border border-slate-800">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hidden sm:block uppercase tracking-wider">
          [ Kapı Tarafı ]
        </div>
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-100">
            ÖĞRETMEN KÜRSÜSÜ & AKILLI TAHTA (ÖN CEPHE)
          </span>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hidden sm:block uppercase tracking-wider">
          [ Pencere Tarafı ]
        </div>
      </div>

      {/* Yer Değiştirme / Seçim İpucu */}
      {selectedSeat && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
            <ArrowRightLeft className="w-4 h-4 text-blue-600 animate-bounce" />
            <span>
              <strong>Seçilen:</strong>{' '}
              {selectedSeat.studentId
                ? studentMap.get(selectedSeat.studentId)?.name
                : 'Öğrenci'}
              . Yer değiştirmek veya oturtmak için hedef koltuğa tıklayınız.
            </span>
          </div>
          <button
            onClick={() => setSelectedSeat(null)}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 px-2 py-1 bg-white rounded border border-blue-200 cursor-pointer"
          >
            Vazgeç
          </button>
        </div>
      )}

      {/* Sınıf Sıraları Matrisi */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rIdx) => {
          const rowNum = rIdx + 1;
          const isFrontRow = rowNum === 1;

          return (
            <div key={`row-${rowNum}`} className="flex flex-col lg:flex-row gap-3 items-stretch">
              
              {/* Sıra Numarası Rozeti */}
              <div className="lg:w-20 shrink-0 flex lg:flex-col items-center justify-between lg:justify-center p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-xs font-bold text-slate-800">{rowNum}. Sıra</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isFrontRow ? 'Ön Sıra' : rowNum === rows ? 'Arka Sıra' : 'Orta'}
                </span>
              </div>

              {/* Çiftli Sıra Blokları (Grid) */}
              <div
                className="flex-1 grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: cols }).map((_, cIdx) => {
                  const colNum = cIdx + 1;
                  const desk = deskByCoords[`${rowNum}-${colNum}`];
                  if (!desk) return null;

                  const leftStudent = desk.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
                  const rightStudent = desk.rightStudentId ? studentMap.get(desk.rightStudentId) : null;

                  // Çatışma kontrolü (aynı sırada birbirini sevmeyenler oturuyor mu?)
                  const hasConflict =
                    leftStudent &&
                    rightStudent &&
                    (leftStudent.avoidWithStudentIds.includes(rightStudent.id) ||
                      rightStudent.avoidWithStudentIds.includes(leftStudent.id));

                  const colLabel =
                    colNum === 1 ? 'Sol Blok' : colNum === 2 ? 'Orta Blok' : 'Sağ Blok';

                  return (
                    <div
                      key={desk.id}
                      className={`bg-white rounded-xl border p-3 shadow-xs transition-all ${
                        hasConflict
                          ? 'border-red-400 bg-red-50/20 ring-1 ring-red-400'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Sıra Başlığı */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2 pb-1.5 border-b border-slate-100">
                        <span>{colLabel}</span>
                        {hasConflict && (
                          <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Ayrılmalı
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">2'li Sıra</span>
                      </div>

                      {/* 2'li Koltuklar (Sol - Sağ) */}
                      <div className="grid grid-cols-2 gap-2">
                        
                        {/* Sol Koltuk */}
                        <SeatSlot
                          student={leftStudent}
                          isSelected={
                            selectedSeat?.type === 'desk' &&
                            selectedSeat.deskId === desk.id &&
                            selectedSeat.position === 'left'
                          }
                          isFrontRow={isFrontRow}
                          onClick={() => handleSeatClick(desk.id, 'left', desk.leftStudentId)}
                          onRemove={(e) => handleRemoveFromSeat(desk.id, 'left', e)}
                        />

                        {/* Sağ Koltuk */}
                        <SeatSlot
                          student={rightStudent}
                          isSelected={
                            selectedSeat?.type === 'desk' &&
                            selectedSeat.deskId === desk.id &&
                            selectedSeat.position === 'right'
                          }
                          isFrontRow={isFrontRow}
                          onClick={() => handleSeatClick(desk.id, 'right', desk.rightStudentId)}
                          onRemove={(e) => handleRemoveFromSeat(desk.id, 'right', e)}
                        />

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      {/* Yerleşmemiş Öğrenci Havuzu (Eğer varsa) */}
      {unseatedStudents.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Henüz Sıraya Yerleşmemiş Öğrenciler ({unseatedStudents.length})
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-amber-800 hidden sm:inline">
                Öğrenciye, ardından boş sıraya tıklayarak koltuğa atayınız.
              </span>
              {onOpenAddStudent && (
                <button
                  onClick={onOpenAddStudent}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Yeni Ekle
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {unseatedStudents.map(student => {
              const isSelected =
                selectedSeat?.type === 'unseated' && selectedSeat.studentId === student.id;

              return (
                <button
                  key={student.id}
                  onClick={() =>
                    setSelectedSeat(
                      isSelected ? null : { type: 'unseated', studentId: student.id }
                    )
                  }
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 font-bold'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 hover:shadow-2xs'
                  }`}
                >
                  <span
                    className={`font-bold ${
                      isSelected
                        ? 'text-white'
                        : student.gender === 'female'
                        ? 'text-purple-600'
                        : 'text-blue-600'
                    }`}
                  >
                    #{student.number}
                  </span>
                  <span>{student.name}</span>
                  {student.specialNeeds.frontRowRequired && (
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

interface SeatSlotProps {
  student: Student | null | undefined;
  isSelected: boolean;
  isFrontRow: boolean;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

const SeatSlot: React.FC<SeatSlotProps> = ({
  student,
  isSelected,
  isFrontRow,
  onClick,
  onRemove
}) => {
  if (!student) {
    return (
      <button
        onClick={onClick}
        className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all p-2 text-center group cursor-pointer ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium">
          + Boş Koltuk
        </span>
        <span className="text-[10px] text-slate-300 mt-0.5">Yerleştir</span>
      </button>
    );
  }

  const isFemale = student.gender === 'female';

  return (
    <div
      onClick={onClick}
      className={`h-24 rounded-lg border p-2 flex flex-col justify-between transition-all relative cursor-pointer group ${
        isSelected
          ? 'ring-2 ring-blue-600 bg-blue-50/80 border-blue-400 shadow-sm'
          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
      }`}
    >
      {/* Üst Satır: No & Rozetler */}
      <div className="flex items-center justify-between gap-1">
        <span
          className={`text-[11px] font-bold ${
            isFemale ? 'text-purple-700' : 'text-blue-700'
          }`}
        >
          #{student.number}
        </span>

        <div className="flex items-center gap-1">
          {student.specialNeeds.frontRowRequired && (
            <span
              title="Ön Sıra Gereksinimi"
              className={`p-0.5 rounded ${
                isFrontRow ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
              }`}
            >
              <Eye className="w-3 h-3" />
            </span>
          )}

          <button
            onClick={onRemove}
            title="Koltuktan Kaldır"
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600 rounded transition-opacity cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Orta Satır: İsim */}
      <div className="my-auto">
        <p className="text-xs font-bold text-slate-900 truncate leading-snug">
          {student.name}
        </p>
      </div>

      {/* Alt Satır: Cinsiyet & Seviye */}
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{isFemale ? 'Kız' : 'Erkek'}</span>
        <span className="font-medium text-slate-400">
          {student.academicLevel === 'high'
            ? 'İleri'
            : student.academicLevel === 'medium'
            ? 'Orta'
            : 'Destek'}
        </span>
      </div>
    </div>
  );
};
