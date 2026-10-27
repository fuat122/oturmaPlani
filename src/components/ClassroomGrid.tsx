import React, { useState } from 'react';
import { Classroom, Student, Desk, TeacherRole } from '../types';
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
  Users,
  MessageSquarePlus,
  MessageSquare,
  Lock,
  Shield
} from 'lucide-react';

interface ClassroomGridProps {
  classroom: Classroom;
  userRole?: TeacherRole;
  onUpdateDesks: (desks: Desk[]) => void;
  onSelectStudentToEdit?: (student: Student) => void;
  onOpenAddStudent?: () => void;
  onOpenStudentComment?: (student: Student) => void;
}

export const ClassroomGrid: React.FC<ClassroomGridProps> = ({
  classroom,
  userRole = 'advisory',
  onUpdateDesks,
  onSelectStudentToEdit,
  onOpenAddStudent,
  onOpenStudentComment
}) => {
  const isBranch = userRole === 'branch';

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
    // Branş öğretmeni yer değişikliği yapamaz
    if (isBranch) return;

    if (!selectedSeat) {
      if (currentStudentId) {
        setSelectedSeat({ type: 'desk', deskId, position, studentId: currentStudentId });
      }
      return;
    }

    if (selectedSeat.type === 'unseated') {
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
      if (selectedSeat.deskId === deskId && selectedSeat.position === position) {
        setSelectedSeat(null);
        return;
      }

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
    if (isBranch) return;

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

  const rows = classroom.rowsCount || 4;
  const cols = classroom.columnsCount || 3;

  const deskByCoords: { [key: string]: Desk } = {};
  classroom.desks.forEach(desk => {
    deskByCoords[`${desk.row}-${desk.column}`] = desk;
  });

  return (
    <div className="space-y-6">
      
      {/* Branş Öğretmeni Bilgilendirme Rozeti */}
      {isBranch && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <span className="font-bold">Branş Öğretmeni Modu (Salt Okunur):</span> Sınıfın oturma düzeni ve öğrencileri danışman öğretmen tarafından kilitlenmiştir. Branş öğretmenleri yer değişikliği, yorum ekleme ve PDF indirme yetkisine sahip değildir.
          </div>
        </div>
      )}

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
            Oturma planını oluşturmaya başlamak için öğrenci ekleyebilir veya toplu liste (Okul No - Ad Soyad) yapıştırabilirsiniz.
          </p>
          {!isBranch && onOpenAddStudent && (
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

      {/* Yer Değiştirme / Seçim İpucu (Sadece Sınıf Öğretmeninde) */}
      {!isBranch && selectedSeat && (
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

                  // Çatışma kontrolü
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
                          isBranch={isBranch}
                          isSelected={
                            selectedSeat?.type === 'desk' &&
                            selectedSeat.deskId === desk.id &&
                            selectedSeat.position === 'left'
                          }
                          isFrontRow={isFrontRow}
                          onClick={() => handleSeatClick(desk.id, 'left', desk.leftStudentId)}
                          onRemove={(e) => handleRemoveFromSeat(desk.id, 'left', e)}
                          onOpenComment={onOpenStudentComment}
                        />

                        {/* Sağ Koltuk */}
                        <SeatSlot
                          student={rightStudent}
                          isBranch={isBranch}
                          isSelected={
                            selectedSeat?.type === 'desk' &&
                            selectedSeat.deskId === desk.id &&
                            selectedSeat.position === 'right'
                          }
                          isFrontRow={isFrontRow}
                          onClick={() => handleSeatClick(desk.id, 'right', desk.rightStudentId)}
                          onRemove={(e) => handleRemoveFromSeat(desk.id, 'right', e)}
                          onOpenComment={onOpenStudentComment}
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
              {!isBranch && (
                <span className="text-[11px] text-amber-800 hidden sm:inline">
                  Öğrenciye, ardından boş sıraya tıklayarak koltuğa atayınız.
                </span>
              )}
              {!isBranch && onOpenAddStudent && (
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

              const isFemale = student.gender === 'female';

              return (
                <div
                  key={student.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 font-bold'
                      : isFemale
                      ? 'bg-pink-50/90 text-pink-950 border-pink-200'
                      : 'bg-sky-50/90 text-sky-950 border-sky-200'
                  }`}
                >
                  <button
                    disabled={isBranch}
                    onClick={() =>
                      !isBranch &&
                      setSelectedSeat(
                        isSelected ? null : { type: 'unseated', studentId: student.id }
                      )
                    }
                    className={`flex items-center gap-1.5 ${isBranch ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`font-bold ${
                        isSelected
                          ? 'text-white'
                          : isFemale
                          ? 'text-pink-700'
                          : 'text-sky-700'
                      }`}
                    >
                      #{student.number}
                    </span>
                    <span>{student.name}</span>
                    <span className="text-[10px] opacity-70">
                      ({isFemale ? 'Kız' : 'Erkek'})
                    </span>
                  </button>

                  {student.specialNeeds.frontRowRequired && (
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                  )}

                  {!isBranch && onOpenStudentComment && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStudentComment(student);
                      }}
                      title="Ders İçi Yorum Ekle"
                      className="text-slate-400 hover:text-blue-900 p-0.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
  isBranch: boolean;
  isSelected: boolean;
  isFrontRow: boolean;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  onOpenComment?: (student: Student) => void;
}

const SeatSlot: React.FC<SeatSlotProps> = ({
  student,
  isBranch,
  isSelected,
  isFrontRow,
  onClick,
  onRemove,
  onOpenComment
}) => {
  if (!student) {
    return (
      <button
        onClick={onClick}
        disabled={isBranch}
        className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all p-2 text-center group ${
          isBranch
            ? 'border-slate-200 bg-slate-50/50 cursor-default opacity-60'
            : isSelected
            ? 'border-blue-500 bg-blue-50 cursor-pointer'
            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
        }`}
      >
        <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium">
          {isBranch ? 'Boş Koltuk' : '+ Boş Koltuk'}
        </span>
        {!isBranch && <span className="text-[10px] text-slate-300 mt-0.5">Yerleştir</span>}
      </button>
    );
  }

  const isFemale = student.gender === 'female';
  const commentCount = student.observations?.length || 0;

  // Açık pastel tonları: Kızlar pembe (#FDF2F8 / border #FBCFE8), Erkekler mavi (#EFF6FF / border #BFDBFE)
  const pastelStyles = isFemale
    ? 'bg-pink-50/70 border-pink-200 text-pink-950 hover:border-pink-300'
    : 'bg-sky-50/70 border-sky-200 text-sky-950 hover:border-sky-300';

  return (
    <div
      onClick={isBranch ? undefined : onClick}
      className={`h-24 rounded-lg border p-2 flex flex-col justify-between transition-all relative group ${
        isBranch ? 'cursor-default' : 'cursor-pointer'
      } ${
        isSelected
          ? 'ring-2 ring-blue-600 bg-blue-50/90 border-blue-400 shadow-sm'
          : `${pastelStyles} shadow-2xs`
      }`}
    >
      {/* Üst Satır: No & Ön Sıra Rozeti & Yorum Butonu & Kaldır */}
      <div className="flex items-center justify-between gap-1">
        <span
          className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
            isFemale ? 'bg-pink-100 text-pink-800' : 'bg-sky-100 text-sky-800'
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

          {/* Ders İçi Yorum Butonu (Branş öğretmeni yorum yapamaz) */}
          {!isBranch && onOpenComment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenComment(student);
              }}
              title="Ders İçi Bireysel Yorum Ekle / Oku"
              className={`p-0.5 rounded transition-colors cursor-pointer flex items-center gap-0.5 ${
                commentCount > 0
                  ? isFemale
                    ? 'text-pink-700 bg-pink-100 font-bold px-1'
                    : 'text-sky-700 bg-sky-100 font-bold px-1'
                  : 'text-slate-400 hover:text-blue-900 opacity-60 group-hover:opacity-100'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              {commentCount > 0 && <span className="text-[9px]">{commentCount}</span>}
            </button>
          )}

          {/* Koltuktan Kaldır Butonu (Sadece Sınıf Öğretmeninde) */}
          {!isBranch && (
            <button
              onClick={onRemove}
              title="Koltuktan Kaldır"
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600 rounded transition-opacity cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Orta Satır: İsim */}
      <div className="my-auto">
        <p className="text-xs font-bold text-slate-900 truncate leading-snug">
          {student.name}
        </p>
      </div>

      {/* Alt Satır: Cinsiyet Göstergesi (Başarı düzeyi etiketi kaldırılmıştır) */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-black/5">
        <span className={`font-semibold ${isFemale ? 'text-pink-600' : 'text-sky-600'}`}>
          {isFemale ? 'Kız Öğrenci' : 'Erkek Öğrenci'}
        </span>
        {commentCount > 0 && (
          <span className="text-[9px] text-slate-400 font-medium">
            {commentCount} Not
          </span>
        )}
      </div>
    </div>
  );
};
