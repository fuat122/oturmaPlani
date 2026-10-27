import React, { useState } from 'react';
import { Classroom, Student } from '../types';
import { generateDefaultDesks } from '../data/mockData';
import {
  X,
  School,
  Check,
  Users,
  UserPlus,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';

interface ClassModalProps {
  classroomToEdit?: Classroom | null;
  onClose: () => void;
  onSaveClassroom: (classroom: Classroom) => void;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  classroomToEdit,
  onClose,
  onSaveClassroom
}) => {
  const isEditing = Boolean(classroomToEdit);
  const [activeTab, setActiveTab] = useState<'info' | 'students'>('info');

  // Classroom fields
  const [name, setName] = useState(classroomToEdit?.name || '10-A');
  const [advisoryTeacher, setAdvisoryTeacher] = useState(
    classroomToEdit?.advisoryTeacher || 'Öğretmen Adı'
  );
  const [academicYear, setAcademicYear] = useState(
    classroomToEdit?.academicYear || '2025-2026'
  );
  const [rowsCount, setRowsCount] = useState<number>(classroomToEdit?.rowsCount || 4);
  const [columnsCount, setColumnsCount] = useState<number>(classroomToEdit?.columnsCount || 3);

  // Student management inside ClassModal
  const [studentList, setStudentList] = useState<Student[]>(
    classroomToEdit?.students ? [...classroomToEdit.students] : []
  );

  // Quick single add fields
  const [singleNo, setSingleNo] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleGender, setSingleGender] = useState<'female' | 'male'>('female');

  // Bulk add state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Selection for bulk delete
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Hızlı Tekli Öğrenci Ekleme
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const trimmedNo = singleNo.trim();
    const trimmedName = singleName.trim();

    if (!trimmedNo || !trimmedName) {
      setGeneralError('Lütfen okul numarası ve ad-soyad bilgisini eksiksiz giriniz.');
      return;
    }

    if (studentList.some((s) => s.number === trimmedNo)) {
      setGeneralError(`"${trimmedNo}" numaralı bir öğrenci bu sınıfta zaten ekli.`);
      return;
    }

    const newStudent: Student = {
      id: 's_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      number: trimmedNo,
      name: trimmedName,
      gender: singleGender,
      academicLevel: 'medium',
      specialNeeds: { frontRowRequired: false },
      avoidWithStudentIds: []
    };

    setStudentList([...studentList, newStudent]);
    setSingleNo('');
    setSingleName('');
  };

  // Toplu Öğrenci İçe Aktarma (Okul No - Ad Soyad formatı)
  const handleBulkImport = () => {
    setBulkError(null);
    setBulkSuccessMsg(null);

    if (!bulkInput.trim()) {
      setBulkError('Lütfen içe aktarmak için öğrenci listesi metnini yapıştırınız.');
      return;
    }

    const lines = bulkInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const existingNumbers = new Set(studentList.map((s) => s.number));
    const newStudents: Student[] = [];
    let skippedCount = 0;

    for (const line of lines) {
      let num = '';
      let studentName = '';
      let gender: 'female' | 'male' = 'female';

      // 1. "101 - Ahmet Yılmaz" veya "101-Ahmet Yılmaz" formatı
      if (line.includes('-')) {
        const parts = line.split('-');
        num = parts[0].trim();
        studentName = parts.slice(1).join('-').trim();
      }
      // 2. Tab veya virgül ayrımı
      else if (line.includes('\t')) {
        const parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
        num = parts[0] || '';
        studentName = parts.slice(1).join(' ');
      } else if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
        num = parts[0] || '';
        studentName = parts[1] || '';
      }
      // 3. "101 Ahmet Yılmaz" (boşluklu format)
      else {
        const match = line.match(/^(\d+)[\s.:]+(.+)$/);
        if (match) {
          num = match[1].trim();
          studentName = match[2].trim();
        } else {
          studentName = line;
          num = String(100 + studentList.length + newStudents.length + 1);
        }
      }

      if (studentName) {
        if (existingNumbers.has(num)) {
          skippedCount++;
        } else {
          existingNumbers.add(num);
          newStudents.push({
            id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            number: num,
            name: studentName,
            gender,
            academicLevel: 'medium',
            specialNeeds: { frontRowRequired: false },
            avoidWithStudentIds: []
          });
        }
      }
    }

    if (newStudents.length === 0) {
      setBulkError(
        skippedCount > 0
          ? 'Girilen tüm öğrenciler numaralarıyla zaten listede mevcut.'
          : 'Geçerli bir "Okul No - Ad Soyad" formatı çözümlenemedi.'
      );
      return;
    }

    setStudentList([...studentList, ...newStudents]);
    setBulkInput('');
    setBulkSuccessMsg(
      `${newStudents.length} öğrenci başarıyla listeye eklendi.${
        skippedCount > 0 ? ` (${skippedCount} mükerrer numara atlandı)` : ''
      }`
    );
  };

  // Tek Öğrenci Çıkar
  const handleRemoveStudent = (id: string) => {
    setStudentList(studentList.filter((s) => s.id !== id));
    setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
  };

  // Toplu Seçilenleri Çıkar (Sil)
  const handleBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    if (
      confirm(
        `Seçili ${selectedStudentIds.length} öğrenciyi sınıftan çıkarmak istediğinize emin misiniz?`
      )
    ) {
      const remaining = studentList.filter((s) => !selectedStudentIds.includes(s.id));
      setStudentList(remaining);
      setSelectedStudentIds([]);
    }
  };

  // Tümünü Seç / Kaldır
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // Filtreleme
  const filteredStudents = studentList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.number.includes(searchTerm)
  );

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setGeneralError('Lütfen sınıf adını giriniz.');
      return;
    }

    if (isEditing && classroomToEdit) {
      let updatedDesks = classroomToEdit.desks;
      if (
        rowsCount !== classroomToEdit.rowsCount ||
        columnsCount !== classroomToEdit.columnsCount
      ) {
        updatedDesks = generateDefaultDesks(rowsCount, columnsCount);
      }

      // Sınıftan çıkarılan öğrencilerin masalardaki yerlerini temizle
      const remainingStudentIds = new Set(studentList.map((s) => s.id));
      const cleanedDesks = updatedDesks.map((d) => ({
        ...d,
        leftStudentId:
          d.leftStudentId && remainingStudentIds.has(d.leftStudentId)
            ? d.leftStudentId
            : null,
        rightStudentId:
          d.rightStudentId && remainingStudentIds.has(d.rightStudentId)
            ? d.rightStudentId
            : null
      }));

      onSaveClassroom({
        ...classroomToEdit,
        name: name.trim(),
        advisoryTeacher: advisoryTeacher.trim(),
        academicYear: academicYear.trim(),
        rowsCount,
        columnsCount,
        students: studentList,
        desks: cleanedDesks,
        updatedAt: new Date().toISOString()
      });
    } else {
      const newClass: Classroom = {
        id: 'class-' + Date.now(),
        name: name.trim(),
        advisoryTeacher: advisoryTeacher.trim(),
        academicYear: academicYear.trim(),
        rowsCount,
        columnsCount,
        students: studentList,
        desks: generateDefaultDesks(rowsCount, columnsCount),
        classroomLogs: [],
        updatedAt: new Date().toISOString()
      };
      onSaveClassroom(newClass);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Üst Başlık */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-xs">
              <School className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Sınıf Bilgilerini Düzenle' : 'Yeni Sınıf Oluştur'}
              </h3>
              <p className="text-xs text-slate-500">
                Sınıf ayarları, oturma sırası ve öğrenci kadrosu yönetimi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sekmeler (Sınıf Bilgileri | Öğrenciler Ekle/Çıkar) */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'info'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <School className="w-4 h-4" />
            Sınıf Bilgileri & Sıra Düzeni
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'students'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Öğrencileri Yönet ({studentList.length})
          </button>
        </div>

        {/* Hata Bildirimi */}
        {generalError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Sekme İçerikleri (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sınıf / Şube Adı *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: 10-A, 11-Fen, 9-B"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Danışman / Sınıf Rehber Öğretmeni *
                </label>
                <input
                  type="text"
                  required
                  value={advisoryTeacher}
                  onChange={(e) => setAdvisoryTeacher(e.target.value)}
                  placeholder="Örn: Zeynep Kaya"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eğitim-Öğretim Yılı
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2025-2026"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sıra Derinliği (Satır)
                  </label>
                  <select
                    value={rowsCount}
                    onChange={(e) => setRowsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white focus:outline-hidden"
                  >
                    <option value={3}>3 Sıra (Derinlik)</option>
                    <option value={4}>4 Sıra (Standart - 24 Koltuk)</option>
                    <option value={5}>5 Sıra (Büyük Sınıf - 30 Koltuk)</option>
                    <option value={6}>6 Sıra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sıra Blokları (Sütun)
                  </label>
                  <select
                    value={columnsCount}
                    onChange={(e) => setColumnsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white focus:outline-hidden"
                  >
                    <option value={2}>2 Blok (Sol - Sağ)</option>
                    <option value={3}>3 Blok (Sol - Orta - Sağ)</option>
                    <option value={4}>4 Blok</option>
                  </select>
                </div>
              </div>

              {/* Hızlı Bilgilendirme Kartı */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Kayıtlı Öğrenci Sayısı:</span> {studentList.length} öğrenci
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className="font-bold text-blue-700 hover:text-blue-950 underline cursor-pointer"
                >
                  Öğrencileri Yönet &rarr;
                </button>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
              
              {/* 1. TOPLU ÖĞRENCİ EKLEME (OKUL NO - AD SOYAD) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-900" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Toplu Öğrenci Ekle (Okul No - Ad Soyad)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Örnek: <code className="bg-white px-1.5 py-0.5 rounded border text-blue-900">101 - Ada Yılmaz</code>
                  </span>
                </div>

                {bulkError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{bulkError}</span>
                  </div>
                )}

                {bulkSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{bulkSuccessMsg}</span>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={"101 - Ada Yılmaz\n102 - Batuhan Kaya\n103 - Ceren Demir\n104 - Deniz Şahin"}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Listeyi İçe Aktar ve Ekle
                  </button>
                </div>
              </div>

              {/* 2. TEKLİ ÖĞRENCİ EKLEME */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hızlı Tekli Öğrenci Ekle
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <input
                      type="text"
                      value={singleNo}
                      onChange={(e) => setSingleNo(e.target.value)}
                      placeholder="Okul No (Örn: 105)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="Öğrenci Adı Soyadı"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddSingleStudent}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Ekle
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. MEVCUT ÖĞRENCİLER LİSTESİ VE TOPLU ÇIKARMA (SİLME) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      Sınıftaki Öğrenciler ({studentList.length})
                    </h4>
                    {selectedStudentIds.length > 0 && (
                      <span className="text-[11px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                        {selectedStudentIds.length} seçildi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ara..."
                        className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-hidden"
                      />
                    </div>

                    {selectedStudentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Seçilenleri Çıkar ({selectedStudentIds.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Öğrenci Tablosu / Listesi */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                  {studentList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Henüz sınıfa öğrenci eklenmedi. Yukarıdaki toplu alandan "Okul No - Ad Soyad" şeklinde ekleyebilirsiniz.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-2.5 w-10 text-center">
                            <button
                              type="button"
                              onClick={handleToggleSelectAll}
                              className="text-slate-600 hover:text-blue-900 cursor-pointer"
                            >
                              {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-blue-900" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="p-2.5 font-bold w-24">Okul No</th>
                          <th className="p-2.5 font-bold">Adı Soyadı</th>
                          <th className="p-2.5 font-bold w-20 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((st) => {
                          const isSelected = selectedStudentIds.includes(st.id);
                          return (
                            <tr
                              key={st.id}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                isSelected ? 'bg-red-50/30' : ''
                              }`}
                            >
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelect(st.id)}
                                  className="text-slate-500 hover:text-blue-900 cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-red-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-blue-950">
                                #{st.number}
                              </td>
                              <td className="p-2.5 font-semibold text-slate-800">
                                {st.name}
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(st.id)}
                                  title="Öğrenciyi Çıkar"
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Modal Alt Aksiyon Barı */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'students' ? (
              <span>Toplam <strong>{studentList.length}</strong> öğrenci kaydedilecek</span>
            ) : (
              <span>Sınıf: <strong>{name || '-'}</strong> · {rowsCount}x{columnsCount} sıra</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Sınıfı ve Öğrencileri Güncelle' : 'Sınıfı ve Öğrencileri Oluştur'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
