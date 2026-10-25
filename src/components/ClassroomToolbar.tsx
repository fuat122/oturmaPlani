import React from 'react';
import { Classroom, Student } from '../types';
import {
  Sparkles,
  FileDown,
  Users,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle,
  Eye,
  Activity
} from 'lucide-react';

interface ClassroomToolbarProps {
  classroom: Classroom;
  isExportingPDF: boolean;
  onRunSmartSeating: () => void;
  onExportPDF: () => void;
  onOpenObservationModal: () => void;
  onClearDesks: () => void;
}

export const ClassroomToolbar: React.FC<ClassroomToolbarProps> = ({
  classroom,
  isExportingPDF,
  onRunSmartSeating,
  onExportPDF,
  onOpenObservationModal,
  onClearDesks
}) => {
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
  const isAllSeated = totalSeated === classroom.students.length && classroom.students.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      
      {/* Üst Satır: Ana Eylemler */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Sol Eylem Grubu */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Akıllı Oturma Planı Çalıştır */}
          <button
            onClick={onRunSmartSeating}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Akıllı Yerleştir</span>
          </button>

          {/* PDF İndir (A4 Yatay) */}
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
        </div>

        {/* Sağ Eylem Grubu */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenObservationModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <span>Öğrenci Gözlem Paneli ({classroom.students.length})</span>
          </button>

          <button
            onClick={onClearDesks}
            title="Sıraları Temizle"
            className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
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
            <span className="text-slate-400 font-medium">Dağılım:</span>
            <span className="font-semibold text-purple-700">{femaleCount} Kız</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-blue-700">{maleCount} Erkek</span>
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

        {/* Hızlı Bilgilendirme */}
        <div className="text-[11px] text-slate-400 hidden md:block">
          {classroom.academicYear} Eğitim Yılı · {classroom.advisoryTeacher}
        </div>

      </div>

    </div>
  );
};
