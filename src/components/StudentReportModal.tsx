import React, { useState } from 'react';
import { Classroom, Student, StudentObservationLog } from '../types';
import {
  X,
  FileSpreadsheet,
  Search,
  Printer,
  Calendar,
  User,
  Tag,
  BookOpen,
  Filter,
  CheckCircle2,
  Users
} from 'lucide-react';

interface StudentReportModalProps {
  classroom: Classroom;
  onClose: () => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({
  classroom,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<'all' | 'katilim' | 'odev' | 'davranis' | 'tebrik' | 'diger'>('all');
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);

  const studentsWithObservations = classroom.students.filter(
    (s) => s.observations && s.observations.length > 0
  );

  const totalObservationCount = classroom.students.reduce(
    (acc, s) => acc + (s.observations?.length || 0),
    0
  );

  // Filter students based on search and selected options
  const filteredStudents = classroom.students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.number.includes(searchTerm);

    if (!matchesSearch) return false;

    if (onlyWithNotes && (!student.observations || student.observations.length === 0)) {
      return false;
    }

    if (tagFilter !== 'all') {
      const hasTag = student.observations?.some((o) => o.tag === tagFilter);
      if (!hasTag) return false;
    }

    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Başlığı */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {classroom.name} Sınıfı Öğrenci Yorum ve Gözlem Raporu
                </h2>
                <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded-full">
                  {totalObservationCount} Not Kayıtlı
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Danışman Öğretmen: <span className="font-semibold text-slate-700">{classroom.advisoryTeacher}</span> · {classroom.academicYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Yazdır / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtre ve Arama Çubuğu (Print esnasında gizlenir) */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap gap-3 items-center justify-between print:hidden">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Öğrenci adı veya numarası ile ara..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tag Filtresi */}
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value as any)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="katilim">Ders Katılımı</option>
              <option value="odev">Ödev & Görev Takibi</option>
              <option value="davranis">Sınıf İçi Davranış</option>
              <option value="tebrik">Tebrik & Başarı</option>
              <option value="diger">Genel / Diğer</option>
            </select>

            <button
              onClick={() => setOnlyWithNotes(!onlyWithNotes)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                onlyWithNotes
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Yalnızca Notu Olanlar ({studentsWithObservations.length})</span>
            </button>
          </div>
        </div>

        {/* Rapor İçerik Listesi */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 space-y-4 bg-slate-50/60 print:bg-white print:p-0">
          
          {/* Özet Bilgi Kartı */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Sınıf Mevcudu</span>
              <p className="text-lg font-extrabold text-blue-950 mt-0.5">{classroom.students.length} Öğrenci</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Not Yazılan Öğrenci</span>
              <p className="text-lg font-extrabold text-purple-900 mt-0.5">
                {studentsWithObservations.length} Öğrenci (%{Math.round((studentsWithObservations.length / (classroom.students.length || 1)) * 100)})
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Toplam Kayıtlı Gözlem</span>
              <p className="text-lg font-extrabold text-emerald-900 mt-0.5">{totalObservationCount} Yorum</p>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Kayıt Bulunamadı</h4>
              <p className="text-xs text-slate-500 mt-1">Arama kriterlerine uygun öğrenci veya gözlem notu bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const observations = student.observations || [];
                const filteredObs =
                  tagFilter === 'all'
                    ? observations
                    : observations.filter((o) => o.tag === tagFilter);

                const isFemale = student.gender === 'female';

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs print:border-slate-300 print:shadow-none"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            isFemale ? 'bg-pink-100 text-pink-800' : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          #{student.number}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
                        <span className="text-[11px] text-slate-400">({isFemale ? 'Kız' : 'Erkek'})</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {observations.length} Not Kayıtlı
                      </span>
                    </div>

                    {filteredObs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">
                        Bu öğrenci için henüz ders içi gözlem notu girilmemiştir.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredObs.map((obs) => {
                          const tagLabel =
                            obs.tag === 'katilim'
                              ? 'Ders Katılımı'
                              : obs.tag === 'odev'
                              ? 'Ödev & Görev'
                              : obs.tag === 'davranis'
                              ? 'Sınıf İçi Davranış'
                              : obs.tag === 'tebrik'
                              ? 'Tebrik & Başarı'
                              : 'Genel Gözlem';

                          const tagBg =
                            obs.tag === 'katilim'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : obs.tag === 'odev'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : obs.tag === 'davranis'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : obs.tag === 'tebrik'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200';

                          return (
                            <div
                              key={obs.id}
                              className="text-xs bg-slate-50/70 border border-slate-200/80 rounded-xl p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md font-semibold border ${tagBg}`}>
                                    {tagLabel}
                                  </span>
                                  <span className="text-slate-600 font-semibold">{obs.teacherName || 'Öğretmen'}</span>
                                </div>
                                <span className="text-slate-400">
                                  {new Date(obs.date).toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed mt-1">
                                {obs.note}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Alt Kapat Butonu */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            {classroom.name} · ALKEV Özel Okulları
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
