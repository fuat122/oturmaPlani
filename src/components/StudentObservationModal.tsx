import React, { useState } from 'react';
import { Student, Gender, AcademicLevel } from '../types';
import {
  X,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  FileText
} from 'lucide-react';

interface StudentObservationModalProps {
  students: Student[];
  onClose: () => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
}

export const StudentObservationModal: React.FC<StudentObservationModalProps> = ({
  students,
  onClose,
  onUpdateStudents
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [needsFilter, setNeedsFilter] = useState<'all' | 'frontRow'>('all');

  // Form states for Add/Edit
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form fields
  const [formNumber, setFormNumber] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<Gender>('female');
  const [formAcademicLevel, setFormAcademicLevel] = useState<AcademicLevel>('medium');
  const [formFrontRow, setFormFrontRow] = useState(false);
  const [formFrontRowNotes, setFormFrontRowNotes] = useState('');
  const [formAvoidIds, setFormAvoidIds] = useState<string[]>([]);
  const [formObservationNotes, setFormObservationNotes] = useState('');

  const openAddForm = () => {
    setEditingStudent(null);
    setFormNumber(String(100 + students.length + 1));
    setFormName('');
    setFormGender('female');
    setFormAcademicLevel('medium');
    setFormFrontRow(false);
    setFormFrontRowNotes('');
    setFormAvoidIds([]);
    setFormObservationNotes('');
    setIsAddingNew(true);
  };

  const openEditForm = (student: Student) => {
    setIsAddingNew(false);
    setEditingStudent(student);
    setFormNumber(student.number);
    setFormName(student.name);
    setFormGender(student.gender);
    setFormAcademicLevel(student.academicLevel);
    setFormFrontRow(student.specialNeeds.frontRowRequired);
    setFormFrontRowNotes(student.specialNeeds.notes || '');
    setFormAvoidIds([...student.avoidWithStudentIds]);
    setFormObservationNotes(student.observationNotes || '');
  };

  const closeForm = () => {
    setEditingStudent(null);
    setIsAddingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (isAddingNew) {
      const newStudent: Student = {
        id: 's_' + Date.now(),
        number: formNumber || String(Math.floor(100 + Math.random() * 900)),
        name: formName.trim(),
        gender: formGender,
        academicLevel: formAcademicLevel,
        specialNeeds: {
          frontRowRequired: formFrontRow,
          notes: formFrontRowNotes.trim() || undefined
        },
        avoidWithStudentIds: formAvoidIds,
        observationNotes: formObservationNotes.trim() || undefined
      };
      onUpdateStudents([...students, newStudent]);
    } else if (editingStudent) {
      const updated = students.map((s) => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            number: formNumber,
            name: formName.trim(),
            gender: formGender,
            academicLevel: formAcademicLevel,
            specialNeeds: {
              frontRowRequired: formFrontRow,
              notes: formFrontRowNotes.trim() || undefined
            },
            avoidWithStudentIds: formAvoidIds,
            observationNotes: formObservationNotes.trim() || undefined
          };
        }
        return s;
      });
      onUpdateStudents(updated);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu öğrenciyi sınıftan silmek istediğinize emin misiniz?')) {
      const updated = students.filter((s) => s.id !== id);
      onUpdateStudents(updated);
    }
  };

  // Filter list
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.number.includes(searchTerm);
    const matchesGender = genderFilter === 'all' || s.gender === genderFilter;
    const matchesNeeds =
      needsFilter === 'all' || (needsFilter === 'frontRow' && s.specialNeeds.frontRowRequired);
    return matchesSearch && matchesGender && matchesNeeds;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Üst Başlık */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Öğrenci Takip & Gözlem Paneli
              </h2>
              <p className="text-xs text-slate-500">
                Öğrenci profilleri, özel gereksinimler ve rehberlik gözlem notları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal İçi Kontroller / Filtreler */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Öğrenci adı veya numara ile ara..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Cinsiyet Filtresi */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  genderFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tümü ({students.length})
              </button>
              <button
                onClick={() => setGenderFilter('female')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  genderFilter === 'female' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Kız
              </button>
              <button
                onClick={() => setGenderFilter('male')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  genderFilter === 'male' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Erkek
              </button>
            </div>

            {/* Ön Sıra Filtresi */}
            <button
              onClick={() => setNeedsFilter(needsFilter === 'all' ? 'frontRow' : 'all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                needsFilter === 'frontRow'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Ön Sıra İhtiyacı</span>
            </button>
          </div>

          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Yeni Öğrenci Ekle
          </button>
        </div>

        {/* Modal İçi Kaydırma Alanı: pb-28 eklenerek en alttaki öğrencilerin asla kesilmemesi sağlandı */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 space-y-3 bg-slate-50/50">
          
          {/* Öğrenci Ekleme/Düzenleme Formu Açıkken */}
          {(isAddingNew || editingStudent) && (
            <div className="bg-white rounded-xl p-5 border-2 border-blue-600 shadow-sm mb-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  {isAddingNew ? 'Yeni Öğrenci Bilgileri' : `${editingStudent?.name} - Düzenle`}
                </h3>
                <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Öğrenci No *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Örn: Deniz Kaya"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cinsiyet
                    </label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as Gender)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="female">Kız Öğrenci</option>
                      <option value="male">Erkek Öğrenci</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Akademik Başarı / Katılım Seviyesi
                    </label>
                    <select
                      value={formAcademicLevel}
                      onChange={(e) => setFormAcademicLevel(e.target.value as AcademicLevel)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="high">İleri Düzey (Yüksek Katılım)</option>
                      <option value="medium">Orta Düzey (Standart)</option>
                      <option value="developing">Desteklenmeli (Akran Desteği Önerilir)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Özel Ön Sıra Gereksinimi
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="checkbox"
                        id="formFrontRow"
                        checked={formFrontRow}
                        onChange={(e) => setFormFrontRow(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <label htmlFor="formFrontRow" className="text-xs text-slate-700 font-medium">
                        Ön Sırada Oturmalı (Görme/İşitme/Dikkat)
                      </label>
                    </div>
                  </div>
                </div>

                {formFrontRow && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ön Sıra Gereksinim Nedeni / Detay
                    </label>
                    <input
                      type="text"
                      value={formFrontRowNotes}
                      onChange={(e) => setFormFrontRowNotes(e.target.value)}
                      placeholder="Örn: Tahtayı görmede zorlanıyor / Gözlük kullanıyor"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Birlikte Oturtulmaması Gereken Öğrenciler
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {students
                      .filter((s) => s.id !== (editingStudent ? editingStudent.id : ''))
                      .map((other) => {
                        const isSelected = formAvoidIds.includes(other.id);
                        return (
                          <button
                            type="button"
                            key={other.id}
                            onClick={() => {
                              if (isSelected) {
                                setFormAvoidIds(formAvoidIds.filter((id) => id !== other.id));
                              } else {
                                setFormAvoidIds([...formAvoidIds, other.id]);
                              }
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✕ ' : '+ '}
                            {other.name} (#{other.number})
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Öğretmen Gözlem ve Rehberlik Notu
                  </label>
                  <textarea
                    rows={2}
                    value={formObservationNotes}
                    onChange={(e) => setFormObservationNotes(e.target.value)}
                    placeholder="Ders içi davranış, sosyal uyum ve çalışma disiplinine dair notlar..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Öğrenci Kartları Listesi */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
              Arama kriterlerine uygun öğrenci bulunamadı.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const avoidNames = student.avoidWithStudentIds
                .map((id) => students.find((s) => s.id === id)?.name)
                .filter(Boolean);

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          student.gender === 'female'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        #{student.number}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              student.gender === 'female'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {student.gender === 'female' ? 'Kız' : 'Erkek'}
                          </span>
                        </div>

                        {/* Unboxed Metadata Discipline */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>
                            {student.academicLevel === 'high'
                              ? 'İleri Seviye'
                              : student.academicLevel === 'medium'
                              ? 'Orta Seviye'
                              : 'Desteklenmeli'}
                          </span>
                          {student.specialNeeds.frontRowRequired && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Ön Sıra Önceliği
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        onClick={() => openEditForm(student)}
                        className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Özel Notlar & Birlikte Oturmaması Gerekenler */}
                  {(student.specialNeeds.notes ||
                    avoidNames.length > 0 ||
                    student.observationNotes) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      {student.specialNeeds.notes && (
                        <div className="text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-100 flex items-start gap-1.5">
                          <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>Ön Sıra Nedeni:</strong> {student.specialNeeds.notes}
                          </span>
                        </div>
                      )}

                      {avoidNames.length > 0 && (
                        <div className="text-red-800 bg-red-50/70 p-2 rounded-lg border border-red-100 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>Ayrılmalı:</strong> {avoidNames.join(', ')} ile yan yana oturmamalı.
                          </span>
                        </div>
                      )}

                      {student.observationNotes && (
                        <div className="text-slate-600 bg-slate-50 p-2 rounded-lg flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Gözlem Notu:</strong> {student.observationNotes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Alt Barı */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Toplam <strong>{students.length}</strong> öğrenci kayıtlı
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
