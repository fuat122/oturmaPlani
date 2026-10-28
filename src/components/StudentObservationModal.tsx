import React, { useState } from 'react';
import { Student, Gender, TeacherRole } from '../types';
import {
  X,
  Search,
  UserPlus,
  Users,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  BookOpen,
  Check,
  FileText,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

interface StudentObservationModalProps {
  students: Student[];
  classroomName: string;
  userRole?: TeacherRole;
  onClose: () => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
  initialMode?: 'view' | 'add';
}

export const StudentObservationModal: React.FC<StudentObservationModalProps> = ({
  students,
  classroomName,
  userRole = 'advisory',
  onClose,
  onUpdateStudents,
  initialMode = 'view'
}) => {
  const isBranch = userRole === 'branch';
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [needsFilter, setNeedsFilter] = useState<'all' | 'frontRow'>('all');

  // Mode: list, single, bulk
  const [activeTab, setActiveTab] = useState<'list' | 'single' | 'bulk'>(
    !isBranch && initialMode === 'add' ? 'single' : 'list'
  );
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single Form fields
  const [formNumber, setFormNumber] = useState(
    String(100 + students.length + 1)
  );
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<Gender>('female');
  const [formFrontRow, setFormFrontRow] = useState(false);
  const [formFrontRowNotes, setFormFrontRowNotes] = useState('');
  const [formAvoidIds, setFormAvoidIds] = useState<string[]>([]);
  const [formObservationNotes, setFormObservationNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Add Text & State
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultGender, setBulkDefaultGender] = useState<Gender>('female');
  const [bulkError, setBulkError] = useState<string | null>(null);

  const resetSingleForm = () => {
    setEditingStudent(null);
    setFormNumber(String(100 + students.length + 1));
    setFormName('');
    setFormGender('female');
    setFormFrontRow(false);
    setFormFrontRowNotes('');
    setFormAvoidIds([]);
    setFormObservationNotes('');
    setFormError(null);
  };

  const openAddSingle = () => {
    if (isBranch) return;
    resetSingleForm();
    setActiveTab('single');
  };

  const openEdit = (student: Student) => {
    if (isBranch) return;
    setEditingStudent(student);
    setFormNumber(student.number);
    setFormName(student.name);
    setFormGender(student.gender);
    setFormFrontRow(student.specialNeeds.frontRowRequired);
    setFormFrontRowNotes(student.specialNeeds.notes || '');
    setFormAvoidIds([...student.avoidWithStudentIds]);
    setFormObservationNotes(student.observationNotes || '');
    setFormError(null);
    setActiveTab('single');
  };

  const handleSaveSingleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBranch) return;
    setFormError(null);

    const trimmedName = formName.trim();
    const trimmedNumber = formNumber.trim();

    // Zorunlu alan kontrolü (Boş isim / numara engelleme)
    if (!trimmedName || !trimmedNumber) {
      setFormError('Lütfen öğrenci adını ve okul numarasını eksiksiz doldurunuz.');
      return;
    }

    // Numara benzersizliği kontrolü (kendi numarası hariç)
    const duplicate = students.find(
      (s) => s.number === trimmedNumber && (!editingStudent || s.id !== editingStudent.id)
    );
    if (duplicate) {
      setFormError(`"${trimmedNumber}" numaralı bir öğrenci (${duplicate.name}) bu sınıfta zaten kayıtlı.`);
      return;
    }

    if (editingStudent) {
      // Güncelleme
      const updatedList = students.map((s) => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            number: trimmedNumber,
            name: trimmedName,
            gender: formGender,
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
      onUpdateStudents(updatedList);
      resetSingleForm();
      setActiveTab('list');
    } else {
      // Yeni Ekleme
      const newStudent: Student = {
        id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        number: trimmedNumber,
        name: trimmedName,
        gender: formGender,
        specialNeeds: {
          frontRowRequired: formFrontRow,
          notes: formFrontRowNotes.trim() || undefined
        },
        avoidWithStudentIds: formAvoidIds,
        observationNotes: formObservationNotes.trim() || undefined
      };
      onUpdateStudents([...students, newStudent]);
      resetSingleForm();
      setActiveTab('list');
    }
  };

  // Toplu Öğrenci Ekleme Çözümleyicisi (Okul No - Ad Soyad - Cinsiyet)
  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBranch) return;
    setBulkError(null);

    if (!bulkText.trim()) {
      setBulkError('Lütfen eklenecek öğrenci listesini yapıştırınız.');
      return;
    }

    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedStudents: Student[] = [];
    let autoNumCounter = 100 + students.length + 1;

    for (const line of lines) {
      let num = '';
      let rawName = '';
      let gender: Gender = bulkDefaultGender;

      if (line.includes('\t')) {
        const parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          num = parts[0];
          rawName = parts[1];
          if (parts[2]) {
            const gLower = parts[2].toLowerCase();
            if (['kız', 'kiz', 'k', 'female'].includes(gLower)) gender = 'female';
            if (['erkek', 'e', 'male'].includes(gLower)) gender = 'male';
          }
        } else {
          rawName = parts.join(' ');
        }
      } else if (line.includes('-')) {
        const parts = line.split('-').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
          num = parts[0];
          rawName = parts[1];
          const gLower = parts[2].toLowerCase();
          if (['kız', 'kiz', 'k', 'female'].includes(gLower)) gender = 'female';
          if (['erkek', 'e', 'male'].includes(gLower)) gender = 'male';
        } else if (parts.length === 2 && /^\d+$/.test(parts[0])) {
          num = parts[0];
          rawName = parts[1];
        } else {
          rawName = parts.join(' ');
        }
      } else if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          num = parts[0];
          rawName = parts[1];
          if (parts[2]) {
            const gLower = parts[2].toLowerCase();
            if (['kız', 'kiz', 'k', 'female'].includes(gLower)) gender = 'female';
            if (['erkek', 'e', 'male'].includes(gLower)) gender = 'male';
          }
        } else {
          rawName = parts[0];
        }
      } else {
        const match = line.match(/^(\d+)[\s.:-]+(.+)$/);
        if (match) {
          num = match[1];
          rawName = match[2].trim();
        } else {
          rawName = line;
        }
      }

      // İsim sonundaki Erkek/Kız kelimesini ayıkla
      let cleanName = rawName.trim();
      const tokens = cleanName.split(/[\s,–—-]+/).filter(Boolean);
      if (tokens.length >= 2) {
        const lastToken = tokens[tokens.length - 1].toLowerCase();
        if (['erkek', 'e', 'male'].includes(lastToken)) {
          gender = 'male';
          cleanName = cleanName.replace(new RegExp(`[\\s,–—-]+${tokens[tokens.length - 1]}\\s*$`, 'i'), '').trim();
        } else if (['kız', 'kiz', 'k', 'female'].includes(lastToken)) {
          gender = 'female';
          cleanName = cleanName.replace(new RegExp(`[\\s,–—-]+${tokens[tokens.length - 1]}\\s*$`, 'i'), '').trim();
        }
      }
      cleanName = cleanName.replace(/[\s–—-]+(erkek|kız|kiz)$/i, '').trim();

      if (!num) {
        num = String(autoNumCounter++);
      }

      if (cleanName) {
        parsedStudents.push({
          id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          number: num,
          name: cleanName,
          gender,
          specialNeeds: { frontRowRequired: false },
          avoidWithStudentIds: []
        });
      }
    }

    if (parsedStudents.length === 0) {
      setBulkError('Geçerli bir öğrenci kaydı çözümlenemedi. Lütfen formatı kontrol ediniz.');
      return;
    }

    onUpdateStudents([...students, ...parsedStudents]);
    setBulkText('');
    setActiveTab('list');
  };

  const handleDelete = (id: string, name: string) => {
    if (isBranch) return;
    if (confirm(`"${name}" adlı öğrenciyi sınıftan silmek istediğinize emin misiniz? (Oturduğu sıra da boşaltılacaktır)`)) {
      const updated = students.filter((s) => s.id !== id);
      onUpdateStudents(updated);
    }
  };

  // Filtrelenmiş öğrenci listesi
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Üst Başlık */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {classroomName} Sınıfı Öğrenci & Gözlem Paneli
                </h2>
                <span className="text-xs bg-blue-100 text-blue-900 font-semibold px-2 py-0.5 rounded-full">
                  {students.length} Kayıtlı
                </span>
                {isBranch && (
                  <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    Salt Okunur
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Öğrenci listesi, pedagojik ön sıra ihtiyaçları ve gözlem kayıtları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sekmeler (Tabs): Sadece sınıf öğretmenine ekleme sekmeleri açık */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center gap-2">
          <button
            onClick={() => {
              resetSingleForm();
              setActiveTab('list');
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Öğrenci Listesi ({students.length})
          </button>

          {!isBranch && (
            <>
              <button
                onClick={openAddSingle}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'single'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {editingStudent ? `Düzenle: ${editingStudent.name}` : '+ Tekli Öğrenci Ekle'}
              </button>

              <button
                onClick={() => {
                  resetSingleForm();
                  setActiveTab('bulk');
                }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'bulk'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Toplu Öğrenci Ekle (Okul No - Ad Soyad)
              </button>
            </>
          )}
        </div>

        {/* Modal İçi Kaydırma Alanı: pb-28 eklenerek en alttaki öğrencilerin asla kesilmemesi sağlandı */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 bg-slate-50/50">

          {/* TAB 1: TEKLİ ÖĞRENCİ EKLEME VE DÜZENLEME FORMU */}
          {!isBranch && activeTab === 'single' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-in fade-in duration-150">
              <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-700" />
                    {editingStudent ? 'Öğrenci Bilgilerini Güncelle' : 'Yeni Öğrenci Kaydı'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Öğrenci adı, okul numarası ve cinsiyet bilgisi.
                  </p>
                </div>
                {editingStudent && (
                  <button
                    onClick={() => {
                      resetSingleForm();
                      setActiveTab('list');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                )}
              </div>

              {/* Hata Bildirimi */}
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSingleForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Öğrenci No *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      placeholder="Örn: 105"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Örn: Deniz Kaya"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cinsiyet *
                    </label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white focus:outline-hidden"
                    >
                      <option value="female">Kız (Pembe Sıra)</option>
                      <option value="male">Erkek (Mavi Sıra)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Özel Ön Sıra Gereksinimi
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="formFrontRow"
                      checked={formFrontRow}
                      onChange={(e) => setFormFrontRow(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="formFrontRow" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Ön Sırada Oturmalı (Görme / İşitme / Dikkat Gereksinimi)
                    </label>
                  </div>

                  {formFrontRow && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={formFrontRowNotes}
                        onChange={(e) => setFormFrontRowNotes(e.target.value)}
                        placeholder="Örn: Tahtayı önden daha net takip ediyor / Gözlük kullanıyor"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Birlikte Oturtulmaması Gereken Öğrenciler (Opsiyonel)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
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
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-red-100 text-red-800 border border-red-300 font-bold'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✕ ' : '+ '}
                            {other.name} (#{other.number})
                          </button>
                        );
                      })}
                    {students.length <= 1 && (
                      <span className="text-xs text-slate-400">Sınıfta henüz başka öğrenci yok.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Öğretmen Rehberlik & Gözlem Notu (Opsiyonel)
                  </label>
                  <textarea
                    rows={2}
                    value={formObservationNotes}
                    onChange={(e) => setFormObservationNotes(e.target.value)}
                    placeholder="Öğrencinin sınıf içi uyumu ve rehberlik takibine dair özel notlar..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {editingStudent ? 'Güncelle ve Kaydet' : 'Öğrenciyi Sınıfa Ekle'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: TOPLU ÖĞRENCİ EKLEME (BULK ADD) */}
          {!isBranch && activeTab === 'bulk' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-in fade-in duration-150">
              <div className="mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-700" />
                  Toplu Öğrenci Listesi Yapıştır
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Excel veya e-Okul formatında listeyi doğrudan yapıştırabilirsiniz. Format: <code>Okul No - Ad Soyad</code> veya <code>Okul No Ad Soyad</code>.
                </p>
              </div>

              {bulkError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              <form onSubmit={handleBulkAdd} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Öğrenci Listesi (Her satıra bir öğrenci)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Örnek: 101 - Ada Yılmaz
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"101 - Ada Yılmaz - Kız\n102 - Batuhan Kaya - Erkek\n103 - Ceren Demir - Kız\n104 - Deniz Şahin - Erkek"}
                    className="w-full px-3.5 py-2.5 font-mono text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">
                    Cinsiyet Belirtilmemişse Varsayılan:
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultGender"
                        checked={bulkDefaultGender === 'female'}
                        onChange={() => setBulkDefaultGender('female')}
                        className="text-pink-600"
                      />
                      Kız
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer ml-3">
                      <input
                        type="radio"
                        name="defaultGender"
                        checked={bulkDefaultGender === 'male'}
                        onChange={() => setBulkDefaultGender('male')}
                        className="text-sky-600"
                      />
                      Erkek
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Toplu Öğrencileri Ekle
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ÖĞRENCİ LİSTESİ VE FİLTRELEME */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {/* Filtre ve Arama Çubuğu */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center justify-between shadow-2xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="İsim veya numara ile ara..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
                    <button
                      onClick={() => setGenderFilter('all')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        genderFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Tümü
                    </button>
                    <button
                      onClick={() => setGenderFilter('female')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        genderFilter === 'female' ? 'bg-white text-pink-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Kız
                    </button>
                    <button
                      onClick={() => setGenderFilter('male')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        genderFilter === 'male' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Erkek
                    </button>
                  </div>

                  <button
                    onClick={() => setNeedsFilter(needsFilter === 'all' ? 'frontRow' : 'all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      needsFilter === 'frontRow'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ön Sıra</span>
                  </button>

                  {!isBranch && (
                    <button
                      onClick={openAddSingle}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Öğrenci Ekle
                    </button>
                  )}
                </div>
              </div>

              {/* Öğrenci Kartları */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {students.length === 0 ? 'Bu sınıfta henüz öğrenci bulunmamaktadır' : 'Aramaya uygun öğrenci bulunamadı'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {students.length === 0
                      ? 'Yukarıdaki "+ Tekli Öğrenci Ekle" veya "Toplu Ekle" butonlarını kullanarak hemen öğrenci ekleyebilirsiniz.'
                      : 'Farklı bir arama terimi deneyebilir veya filtreleri temizleyebilirsiniz.'}
                  </p>
                  {!isBranch && students.length === 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={openAddSingle}
                        className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors cursor-pointer"
                      >
                        Tekli Öğrenci Ekle
                      </button>
                      <button
                        onClick={() => setActiveTab('bulk')}
                        className="px-4 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Toplu Liste Yapıştır
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const avoidNames = student.avoidWithStudentIds
                    .map((id) => students.find((s) => s.id === id)?.name)
                    .filter(Boolean);

                  const isFemale = student.gender === 'female';

                  return (
                    <div
                      key={student.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isFemale
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            #{student.number}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isFemale
                                    ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                                }`}
                              >
                                {isFemale ? 'Kız' : 'Erkek'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              {student.specialNeeds.frontRowRequired && (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  Ön Sıra Önceliği
                                </span>
                              )}
                              {student.observations && student.observations.length > 0 && (
                                <>
                                  {student.specialNeeds.frontRowRequired && <span aria-hidden="true">·</span>}
                                  <span className="text-blue-700 font-medium">
                                    {student.observations.length} Ders İçi Not
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Düzenle / Sil Aksiyon Butonları (Yalnızca Sınıf Öğretmeninde) */}
                        {!isBranch && (
                          <div className="flex items-center gap-1 self-end sm:self-center">
                            <button
                              onClick={() => openEdit(student)}
                              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Düzenle</span>
                            </button>
                            <button
                              onClick={() => handleDelete(student.id, student.name)}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Sil</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {(student.specialNeeds.notes ||
                        avoidNames.length > 0 ||
                        student.observationNotes ||
                        (student.observations && student.observations.length > 0)) && (
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
                                <strong>Rehberlik Notu:</strong> {student.observationNotes}
                              </span>
                            </div>
                          )}

                          {student.observations && student.observations.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-blue-700" />
                                Ders İçi Yorumlar ({student.observations.length}):
                              </span>
                              <div className="space-y-1 max-h-28 overflow-y-auto">
                                {[...student.observations].reverse().map((obs) => (
                                  <div key={obs.id} className="text-xs bg-blue-50/50 border border-blue-100 p-2 rounded-lg text-slate-800">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                                      <span>{new Date(obs.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {obs.teacherName || 'Öğretmen'}</span>
                                    </div>
                                    <p className="font-medium text-[11px]">{obs.note}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Modal Alt Barı */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Toplam <strong>{students.length}</strong> öğrenci kayıtlı
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
