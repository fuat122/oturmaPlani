import React, { useState } from 'react';
import { Classroom } from '../types';
import { generateDefaultDesks } from '../data/mockData';
import { X, School, Check } from 'lucide-react';

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
  const [name, setName] = useState(classroomToEdit?.name || '10-A');
  const [advisoryTeacher, setAdvisoryTeacher] = useState(
    classroomToEdit?.advisoryTeacher || 'Öğretmen Adı'
  );
  const [academicYear, setAcademicYear] = useState(
    classroomToEdit?.academicYear || '2025-2026'
  );
  const [rowsCount, setRowsCount] = useState<number>(classroomToEdit?.rowsCount || 4);
  const [columnsCount, setColumnsCount] = useState<number>(classroomToEdit?.columnsCount || 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && classroomToEdit) {
      // Re-generate desks if dimensions changed, preserving existing students where possible
      let updatedDesks = classroomToEdit.desks;
      if (rowsCount !== classroomToEdit.rowsCount || columnsCount !== classroomToEdit.columnsCount) {
        updatedDesks = generateDefaultDesks(rowsCount, columnsCount);
      }

      onSaveClassroom({
        ...classroomToEdit,
        name: name.trim(),
        advisoryTeacher: advisoryTeacher.trim(),
        academicYear: academicYear.trim(),
        rowsCount,
        columnsCount,
        desks: updatedDesks,
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
        students: [],
        desks: generateDefaultDesks(rowsCount, columnsCount),
        updatedAt: new Date().toISOString()
      };
      onSaveClassroom(newClass);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-blue-900" />
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Sınıf Bilgilerini Düzenle' : 'Yeni Sınıf Oluştur'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sınıf / Şube Adı *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: 9-A, 10-Fen, 11-B"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Danışman / Sınıf Rehber Öğretmeni *
            </label>
            <input
              type="text"
              required
              value={advisoryTeacher}
              onChange={(e) => setAdvisoryTeacher(e.target.value)}
              placeholder="Örn: Zeynep Kaya"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Eğitim-Öğretim Yılı
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sıra Derinliği (Satır)
              </label>
              <select
                value={rowsCount}
                onChange={(e) => setRowsCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value={3}>3 Sıra (Derinlik)</option>
                <option value={4}>4 Sıra (Standart)</option>
                <option value={5}>5 Sıra (Büyük Sınıf)</option>
                <option value={6}>6 Sıra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sıra Blokları (Sütun)
              </label>
              <select
                value={columnsCount}
                onChange={(e) => setColumnsCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value={2}>2 Blok (Sol - Sağ)</option>
                <option value={3}>3 Blok (Sol - Orta - Sağ)</option>
                <option value={4}>4 Blok</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Güncelle' : 'Sınıfı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
