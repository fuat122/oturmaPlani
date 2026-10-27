import React from 'react';
import { Classroom, Student, TeacherRole } from '../types';
import {
  Sparkles,
  FileDown,
  Users,
  UserPlus,
  RotateCcw,
  Eye,
  MessageSquareQuote,
  FileSpreadsheet,
  Lock
} from 'lucide-react';

interface ClassroomToolbarProps {
  classroom: Classroom;
  userRole?: TeacherRole;
  isExportingPDF: boolean;
  onRunSmartSeating: () => void;
  onExportPDF: () => void;
  onOpenObservationModal: () => void;
  onOpenAddStudent: () => void;
  onOpenClassroomComment: () => void;
  onOpenStudentReport: () => void;
  onClearDesks: () => void;
}

export const ClassroomToolbar: React.FC<ClassroomToolbarProps> = ({
  classroom,
  userRole = 'advisory',
  isExportingPDF,
  onRunSmartSeating,
  onExportPDF,
  onOpenObservationModal,
  onOpenAddStudent,
  onOpenClassroomComment,
  onOpenStudentReport,
  onClearDesks
}) => {
  const isBranch = userRole === 'branch';
  const studentMap = new Map<string, Student>(classroom.students.map(s => [s.id, s]));

  // Calculate live statistics
  let totalSeated = 0;
  let frontRowReqMet = 0;
  let frontRowReqTotal = 0;
  let femaleCount = 0;
  let maleCount = 0;

  classroom.students.forEach(s => {
    if (s.specialNeeds.frontRowRequired) frontRowReqTotal++;
  });

  classroom.desks.forEach(desk => {
    const left = desk.leftStudentId ? studentMap.get(desk.leftStudentId) : null;
    const right = desk.rightStudentId ? studentMap.get(desk.rightStudentId) : null;

    if (left) {
      totalSeated++;
      if (left.gender === 'female') femaleCount++; else maleCount++;
      if (desk.row === 1 && left.specialNeeds.frontRowRequired) frontRowReqMet++;
    }
    if (right) {
      totalSeated++;
      if (right.gender === 'female') femaleCount++; else maleCount++;
      if (desk.row === 1 && right.specialNeeds.frontRowRequired) frontRowReqMet++;
    }
  });

  const totalSeats = classroom.desks.length * 2;
  const classroomCommentCount = classroom.classroomLogs?.length || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      
      {/* Üst Satır: Ana Eylemler */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Sol Eylem Grubu */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Akıllı Oturma Planı Çalıştır (Yalnızca Sınıf Öğretmeninde) */}
          {!isBranch && (
            <button
              onClick={onRunSmartSeating}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Akıllı Yerleştir</span>
            </button>
          )}

          {/* PDF İndir (A4 Yatay) - Yalnızca Sınıf Öğretmeni İndirebilir */}
          {!isBranch ? (
            <button
              onClick={onExportPDF}
              disabled={isExportingPDF}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isExportingPDF ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isExportingPDF ? 'PDF Hazırlanıyor...' : 'PDF İndir (A4 Yatay)'}</span>
            </button>
          ) : (
            <div
              title="Sınıf oturma planı PDF çıktısı yalnızca sınıf rehber öğretmeni tarafından indirilebilir."
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-medium cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>PDF İndir (Yalnızca Sınıf Öğretmeni)</span>
            </div>
          )}

          {/* Öğrenci Yorum Raporu Butonu (Her iki rol de geçmiş yorumları raporlayabilir) */}
          <button
            onClick={onOpenStudentReport}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Yorum Raporu Al</span>
          </button>
        </div>

        {/* Sağ Eylem Grubu: Hızlı Öğrenci Ekle, Toplu Sınıf Yorumu, Gözlem Paneli, Temizle */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Hızlı Öğrenci Ekle Butonu (Yalnızca Sınıf Öğretmeni) */}
          {!isBranch && (
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-blue-700" />
              <span>+ Öğrenci Ekle</span>
            </button>
          )}

          {/* Sınıf Genel Notu Butonu (Yalnızca Sınıf Öğretmeni) */}
          {!isBranch && (
            <button
              onClick={onOpenClassroomComment}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <MessageSquareQuote className="w-4 h-4 text-purple-700" />
              <span>Sınıf Notu ({classroomCommentCount})</span>
            </button>
          )}

          {/* Öğrenci Listesi / Gözlem Paneli */}
          <button
            onClick={onOpenObservationModal}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>Öğrenci Listesi ({classroom.students.length})</span>
          </button>

          {/* Sıraları Temizle (Yalnızca Sınıf Öğretmeni) */}
          {!isBranch && (
            <button
              onClick={onClearDesks}
              title="Sıraları Temizle"
              className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Alt Satır: Durum & Pedagojik Denge Metrikleri */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          
          {/* Doluluk */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Yerleşim:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {totalSeated} / {classroom.students.length}
            </span>
            <span className="text-[11px] text-slate-400">({totalSeats} Koltuk Kapasitesi)</span>
          </div>

          <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>

          {/* Cinsiyet Dağılımı */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Öğrenci Dağılımı:</span>
            <span className="font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
              {femaleCount} Kız
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {maleCount} Erkek
            </span>
          </div>

          <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>

          {/* Ön Sıra Gereksinimi */}
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-400 font-medium">Ön Sıra Başarısı:</span>
            <span
              className={`font-bold tabular-nums ${
                frontRowReqTotal === 0 || frontRowReqMet === frontRowReqTotal
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {frontRowReqTotal === 0
                ? 'İhtiyaç yok'
                : `%${Math.round((frontRowReqMet / frontRowReqTotal) * 100)} (${frontRowReqMet}/${frontRowReqTotal})`}
            </span>
          </div>

        </div>

        {/* Bilgilendirme */}
        <div className="text-[11px] text-slate-400 hidden md:block">
          {classroom.academicYear} · Danışman: <span className="font-semibold text-slate-600">{classroom.advisoryTeacher}</span>
        </div>

      </div>

    </div>
  );
};
