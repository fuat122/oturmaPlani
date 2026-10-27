import React, { useState } from 'react';
import { Student, StudentObservationLog, ClassroomLog } from '../types';
import {
  X,
  MessageSquare,
  MessageSquarePlus,
  Calendar,
  Send,
  Trash2,
  Tag,
  Users,
  CheckCircle2,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface StudentCommentModalProps {
  student: Student;
  teacherName: string;
  onClose: () => void;
  onSaveComment: (studentId: string, newObservation: StudentObservationLog) => void;
  onDeleteComment: (studentId: string, observationId: string) => void;
}

export const StudentCommentModal: React.FC<StudentCommentModalProps> = ({
  student,
  teacherName,
  onClose,
  onSaveComment,
  onDeleteComment
}) => {
  const [commentText, setCommentText] = useState('');
  const [selectedTag, setSelectedTag] = useState<StudentObservationLog['tag']>('katilim');
  const [error, setError] = useState<string | null>(null);

  const quickTags = [
    { id: 'katilim' as const, label: 'Derse Katılım 👍', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { id: 'odev' as const, label: 'Ödev Takibi 📚', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { id: 'davranis' as const, label: 'Ders İçi Davranış 🎯', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { id: 'tebrik' as const, label: 'Tebrikler / Başarı ⭐', color: 'bg-purple-50 text-purple-800 border-purple-200' },
    { id: 'diger' as const, label: 'Genel Not 📝', color: 'bg-slate-100 text-slate-800 border-slate-300' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError('Lütfen yorum metnini giriniz.');
      return;
    }

    const newLog: StudentObservationLog = {
      id: 'obs_' + Date.now(),
      date: new Date().toISOString(),
      teacherName: teacherName || 'Ders Öğretmeni',
      note: commentText.trim(),
      tag: selectedTag
    };

    onSaveComment(student.id, newLog);
    setCommentText('');
    setError(null);
  };

  const observations = student.observations || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-sm shadow-2xs">
              #{student.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{student.name}</h3>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  Bireysel Ders Yorumu
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Ders içi gözlem, ödev ve rehberlik notları
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Yeni Yorum Formu */}
          <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800">
              Yeni Ders İçi Yorum / Gözlem Ekle
            </label>

            {/* Hızlı Etiketler */}
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setSelectedTag(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selectedTag === t.id
                      ? 'ring-2 ring-blue-600 font-bold bg-white shadow-2xs'
                      : t.color
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Örn: Bugün derste soru çözümünde çok aktifti, arkadaşlarına yardımcı oldu..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                Öğretmen: <strong>{teacherName}</strong>
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Yorumu Kaydet
              </button>
            </div>
          </form>

          {/* Geçmiş Yorumlar Listesi */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
              Öğrencinin Ders Notları ({observations.length})
            </h4>

            {observations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
                Bu öğrenci için henüz ders içi yorum eklenmedi.
              </div>
            ) : (
              <div className="space-y-2">
                {[...observations].reverse().map((obs) => {
                  const dateStr = new Date(obs.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={obs.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{dateStr}</span>
                          {obs.teacherName && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-slate-700">{obs.teacherName}</span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteComment(student.id, obs.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                          title="Yorumu Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {obs.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};

interface ClassroomCommentModalProps {
  classroomName: string;
  advisoryTeacher: string;
  classroomLogs: ClassroomLog[];
  onClose: () => void;
  onSaveClassroomLog: (
    newLog: ClassroomLog,
    applyToAllStudents: boolean
  ) => void;
  onDeleteClassroomLog: (logId: string) => void;
}

export const ClassroomCommentModal: React.FC<ClassroomCommentModalProps> = ({
  classroomName,
  advisoryTeacher,
  classroomLogs,
  onClose,
  onSaveClassroomLog,
  onDeleteClassroomLog
}) => {
  const [lessonName, setLessonName] = useState('');
  const [noteText, setNoteText] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      setError('Lütfen sınıf yorumunu giriniz.');
      return;
    }

    const newLog: ClassroomLog = {
      id: 'class_log_' + Date.now(),
      date: new Date().toISOString(),
      teacherName: advisoryTeacher || 'Öğretmen',
      lessonName: lessonName.trim() || 'Genel Ders',
      note: noteText.trim()
    };

    onSaveClassroomLog(newLog, applyToAll);
    setNoteText('');
    setLessonName('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {classroomName} Sınıfı Genel Ders Yorumu & Günlüğü
              </h3>
              <p className="text-xs text-slate-500">
                Tüm sınıfa ait ders değerlendirmesi ve toplu notlar
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Yeni Sınıf Yorumu Formu */}
          <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800">
              Toplu Sınıf Yorumu Ekle
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Ders / Konu Adı (Opsiyonel)
              </label>
              <input
                type="text"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                placeholder="Örn: Matematik - Fonksiyonlar / Rehberlik Saati"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Sınıf Genel Yorumu *
              </label>
              <textarea
                rows={3}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Örn: Bugün sınıfın katılımı ve dikkati çok yüksekti. Grup çalışmasında sıralar verimli şekilde iş birliği yaptı..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white focus:outline-hidden"
              />
            </div>

            {/* Tüm Öğrencilere de Kopyala Seçeneği */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="applyToAllStudents"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="applyToAllStudents" className="text-xs text-slate-700 font-medium cursor-pointer">
                Bu yorumu sınıftaki tüm öğrencilerin profiline de kopyala
              </label>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Sınıf Yorumunu Kaydet
              </button>
            </div>
          </form>

          {/* Sınıfın Geçmiş Günlükleri */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              Sınıfın Ders Günlükleri ({classroomLogs.length})
            </h4>

            {classroomLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
                Henüz bu sınıf için toplu ders yorumu kaydedilmedi.
              </div>
            ) : (
              <div className="space-y-2.5">
                {[...classroomLogs].reverse().map((log) => {
                  const dateStr = new Date(log.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={log.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-950 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {log.lessonName || 'Ders'}
                          </span>
                          <span className="text-[11px]">{dateStr}</span>
                        </div>
                        <button
                          onClick={() => onDeleteClassroomLog(log.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {log.note}
                      </p>

                      <div className="mt-2 text-[10px] text-slate-400">
                        Öğretmen: {log.teacherName || advisoryTeacher}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
