import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { ClassroomGrid } from './components/ClassroomGrid';
import { ClassroomToolbar } from './components/ClassroomToolbar';
import { StudentObservationModal } from './components/StudentObservationModal';
import { StudentReportModal } from './components/StudentReportModal';
import { ClassModal } from './components/ClassModal';
import {
  StudentCommentModal,
  ClassroomCommentModal
} from './components/ObservationCommentModals';
import {
  Classroom,
  Student,
  Desk,
  StudentObservationLog,
  ClassroomLog,
  TeacherRole
} from './types';
import { defaultClassrooms, generateDefaultDesks } from './data/mockData';
import { runSmartSeating } from './utils/seatingAlgorithm';
import { exportClassroomSeatingPDF } from './utils/pdfExport';
import {
  saveClassroomToFirestore,
  fetchClassroomsFromFirestore
} from './services/classroomService';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  School,
  PlusCircle,
  Shield,
  Eye,
  Lock
} from 'lucide-react';

const LOCAL_STORAGE_CLASSES_KEY = 'alkev_classrooms_storage_v1';
const LOCAL_STORAGE_ACTIVE_CLASS_ID = 'alkev_active_classroom_id';

const ClassroomApp: React.FC = () => {
  const { currentUser, loading } = useAuth();

  // Classrooms State with LocalStorage Persistence
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CLASSES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Saved classrooms parse error', e);
      }
    }
    return defaultClassrooms;
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    const savedId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_CLASS_ID);
    return savedId || (classrooms[0] ? classrooms[0].id : '');
  });

  // Modal states
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observationModalMode, setObservationModalMode] = useState<'view' | 'add'>('view');
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [isStudentReportModalOpen, setIsStudentReportModalOpen] = useState(false);

  // Lesson Comments modal states (Individual student & class-wide)
  const [selectedStudentForComment, setSelectedStudentForComment] = useState<Student | null>(null);
  const [isClassroomCommentModalOpen, setIsClassroomCommentModalOpen] = useState(false);

  // PDF Export loading state
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Initial Firestore Sync: Fetch from Firestore when user logs in
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    fetchClassroomsFromFirestore().then((remoteClasses) => {
      if (isMounted && remoteClasses && remoteClasses.length > 0) {
        setClassrooms(remoteClasses);
        if (!activeClassId || !remoteClasses.some((c) => c.id === activeClassId)) {
          setActiveClassId(remoteClasses[0].id);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // 2. Persist to LocalStorage on every state update
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CLASSES_KEY, JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    if (activeClassId) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_CLASS_ID, activeClassId);
    }
  }, [activeClassId]);

  // Active classroom resolution
  const activeClassroom = classrooms.find((c) => c.id === activeClassId) || classrooms[0] || null;

  // Sahiplik & Yetkilendirme Kuralı:
  // Kullanıcı bu sınıfı kendisi oluşturduysa -> Sınıf Danışmanı (Düzenleme / Takas / Yorum / PDF Yetkili)
  // Kullanıcı bu sınıfı oluşturmadıysa -> Branş Öğretmeni (Salt Okunur)
  const isClassOwner = Boolean(
    currentUser?.email &&
    activeClassroom &&
    (
      (activeClassroom.creatorEmail && activeClassroom.creatorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.isTestUser && (activeClassroom.creatorEmail === 'ogretmen@alkev.k12.tr' || activeClassroom.advisoryTeacher === 'Zeynep Kaya')) ||
      (activeClassroom.advisoryTeacher && currentUser.displayName && activeClassroom.advisoryTeacher.trim().toLowerCase() === currentUser.displayName.trim().toLowerCase())
    )
  );

  const effectiveRole: TeacherRole = isClassOwner ? 'advisory' : 'branch';

  // Kullanıcının oluşturduğu herhangi bir sınıf var mı?
  const myCreatedClassesCount = classrooms.filter(
    (c) =>
      currentUser?.email &&
      (
        (c.creatorEmail && c.creatorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser.isTestUser && (c.creatorEmail === 'ogretmen@alkev.k12.tr' || c.advisoryTeacher === 'Zeynep Kaya')) ||
        (c.advisoryTeacher && currentUser.displayName && c.advisoryTeacher.trim().toLowerCase() === currentUser.displayName.trim().toLowerCase())
      )
  ).length;

  // Unified updater for active classroom with both Local State + Firestore persistence
  const updateActiveClassroom = async (updated: Partial<Classroom>) => {
    if (!activeClassroom) return;
    if (!isClassOwner) {
      showToast('Yalnızca sınıfı oluşturan danışman öğretmen düzenleme yapabilir.', 'error');
      return;
    }

    const mergedClassroom: Classroom = {
      ...activeClassroom,
      ...updated,
      updatedAt: new Date().toISOString()
    };

    // Update local state immediately for instant UI feedback
    setClassrooms((prev) =>
      prev.map((c) => (c.id === mergedClassroom.id ? mergedClassroom : c))
    );

    // Save to Firestore asynchronously
    await saveClassroomToFirestore(mergedClassroom);
  };

  // Update desk positions (Only if owner)
  const handleUpdateDesks = (newDesks: Desk[]) => {
    if (!isClassOwner) {
      showToast('Branş öğretmenleri oturma düzenini değiştiremez.', 'error');
      return;
    }
    updateActiveClassroom({ desks: newDesks });
  };

  // Update students list (Add, Edit, Delete)
  const handleUpdateStudents = (newStudents: Student[]) => {
    if (!activeClassroom) return;
    if (!isClassOwner) {
      showToast('Branş öğretmenleri öğrenci listesini güncelleyemez.', 'error');
      return;
    }

    // Remove any deleted students from desks so no dangling IDs remain
    const newStudentIds = new Set(newStudents.map((s) => s.id));
    const cleanedDesks = activeClassroom.desks.map((d) => ({
      ...d,
      leftStudentId: d.leftStudentId && newStudentIds.has(d.leftStudentId) ? d.leftStudentId : null,
      rightStudentId: d.rightStudentId && newStudentIds.has(d.rightStudentId) ? d.rightStudentId : null
    }));

    updateActiveClassroom({
      students: newStudents,
      desks: cleanedDesks
    });

    showToast('Öğrenci listesi ve veritabanı başarıyla güncellendi.', 'success');
  };

  // Bireysel Ders İçi Öğrenci Yorumu Kaydetme
  const handleSaveStudentComment = (studentId: string, newObservation: StudentObservationLog) => {
    if (!activeClassroom) return;
    if (!isClassOwner) {
      showToast('Branş öğretmenleri yorum ekleyemez.', 'error');
      return;
    }

    const updatedStudents = activeClassroom.students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          observations: [...(s.observations || []), newObservation]
        };
      }
      return s;
    });

    updateActiveClassroom({ students: updatedStudents });
    setSelectedStudentForComment((prev) =>
      prev && prev.id === studentId
        ? { ...prev, observations: [...(prev.observations || []), newObservation] }
        : prev
    );
    showToast('Öğrenciye ders içi bireysel yorum eklendi.', 'success');
  };

  // Bireysel Yorum Silme
  const handleDeleteStudentComment = (studentId: string, observationId: string) => {
    if (!activeClassroom) return;
    if (!isClassOwner) {
      showToast('Branş öğretmenleri yorum silemez.', 'error');
      return;
    }

    const updatedStudents = activeClassroom.students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          observations: (s.observations || []).filter((o) => o.id !== observationId)
        };
      }
      return s;
    });

    updateActiveClassroom({ students: updatedStudents });
    setSelectedStudentForComment((prev) =>
      prev && prev.id === studentId
        ? { ...prev, observations: (prev.observations || []).filter((o) => o.id !== observationId) }
        : prev
    );
    showToast('Yorum silindi.', 'info');
  };

  // Topluca Sınıfa Yorum Kaydetme
  const handleSaveClassroomLog = (newLog: ClassroomLog, applyToAllStudents: boolean) => {
    if (!activeClassroom) return;
    if (!isClassOwner) {
      showToast('Branş öğretmenleri sınıf notu ekleyemez.', 'error');
      return;
    }

    const updatedLogs = [...(activeClassroom.classroomLogs || []), newLog];

    let updatedStudents = activeClassroom.students;
    if (applyToAllStudents) {
      const studentObservationFromClassLog: StudentObservationLog = {
        id: 'obs_class_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date: newLog.date,
        teacherName: newLog.teacherName,
        note: `[Sınıf Notu - ${newLog.lessonName || 'Ders'}]: ${newLog.note}`,
        tag: 'diger'
      };
      updatedStudents = activeClassroom.students.map((s) => ({
        ...s,
        observations: [...(s.observations || []), studentObservationFromClassLog]
      }));
    }

    updateActiveClassroom({
      classroomLogs: updatedLogs,
      students: updatedStudents
    });

    showToast(
      applyToAllStudents
        ? 'Sınıf notu kaydedildi ve tüm öğrencilerin profiline işlendi.'
        : 'Sınıf genel ders notu başarıyla kaydedildi.',
      'success'
    );
  };

  // Sınıf Yorumu Silme
  const handleDeleteClassroomLog = (logId: string) => {
    if (!activeClassroom) return;
    if (!isClassOwner) return;
    const updatedLogs = (activeClassroom.classroomLogs || []).filter((l) => l.id !== logId);
    updateActiveClassroom({ classroomLogs: updatedLogs });
    showToast('Sınıf notu silindi.', 'info');
  };

  // Run Smart Seating Algorithm (Yalnızca Sınıf Danışmanı)
  const handleRunSmartSeating = () => {
    if (!isClassOwner) {
      showToast('Yalnızca sınıfı oluşturan danışman öğretmen akıllı yerleşim yapabilir.', 'error');
      return;
    }

    if (!activeClassroom) {
      showToast('Lütfen önce bir sınıf seçin veya oluşturun.', 'error');
      return;
    }

    if (activeClassroom.students.length === 0) {
      showToast('Sınıfta henüz öğrenci bulunmamaktadır. Önce öğrenci ekleyiniz.', 'info');
      setObservationModalMode('add');
      setIsObservationModalOpen(true);
      return;
    }

    const result = runSmartSeating(activeClassroom.students, activeClassroom.desks);
    updateActiveClassroom({ desks: result.desks });

    const msg = `Akıllı yerleşim tamamlandı! Ön sıra başarısı: %${result.metrics.frontRowSuccessRate}, Cinsiyet dengesi: %${result.metrics.genderBalanceScore}`;
    showToast(msg, 'success');
  };

  // Clear all seats
  const handleClearDesks = () => {
    if (!isClassOwner) return;
    if (!activeClassroom) return;
    if (confirm('Tüm sıralardaki öğrencileri kaldırmak istediğinize emin misiniz?')) {
      const cleared = activeClassroom.desks.map((d) => ({
        ...d,
        leftStudentId: null,
        rightStudentId: null
      }));
      updateActiveClassroom({ desks: cleared });
      showToast('Tüm sıralar boşaltıldı.', 'info');
    }
  };

  // Export PDF (Sadece Sınıfı Oluşturan Öğretmen İndirebilir)
  const handleExportPDF = async () => {
    if (!isClassOwner) {
      showToast('Sınıf oturma planı PDF çıktısı yalnızca sınıfı oluşturan danışman öğretmen tarafından indirilebilir.', 'error');
      return;
    }

    if (!activeClassroom) {
      showToast('Lütfen önce bir sınıf seçin veya oluşturun.', 'error');
      return;
    }
    try {
      setIsExportingPDF(true);
      await exportClassroomSeatingPDF({ classroom: activeClassroom });
      showToast('A4 Yatay Oturma Planı PDF olarak başarıyla indirildi.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('PDF oluşturulurken bir sorun meydana geldi: ' + err.message, 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Create new classroom (Kullanıcı kendi sınıfını oluşturur ve sahibi olur)
  const handleSaveNewClassroom = async (newClass: Classroom) => {
    if (!currentUser) return;
    const classToSave: Classroom = {
      ...newClass,
      creatorEmail: currentUser.email,
      creatorUid: currentUser.uid,
      advisoryTeacher: newClass.advisoryTeacher || currentUser.displayName || 'Öğretmen'
    };
    setClassrooms((prev) => [...prev, classToSave]);
    setActiveClassId(classToSave.id);
    await saveClassroomToFirestore(classToSave);
    showToast(`"${classToSave.name}" sınıfı başarıyla oluşturuldu. Düzenleme yetkiniz tanımlandı.`, 'success');
  };

  // Update existing classroom info
  const handleSaveEditClassroom = async (editedClass: Classroom) => {
    if (!isClassOwner) {
      showToast('Bu sınıfı düzenleme yetkiniz bulunmamaktadır.', 'error');
      return;
    }
    setClassrooms((prev) => prev.map((c) => (c.id === editedClass.id ? editedClass : c)));
    await saveClassroomToFirestore(editedClass);
    showToast(`"${editedClass.name}" sınıf bilgileri güncellendi.`, 'success');
  };

  // Open observation modal in specific mode
  const openObservationModal = (mode: 'view' | 'add' = 'view') => {
    if (!activeClassroom) {
      showToast('Lütfen önce bir sınıf seçin veya oluşturun.', 'error');
      setIsNewClassModalOpen(true);
      return;
    }
    setObservationModalMode(mode);
    setIsObservationModalOpen(true);
  };

  // Initial loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          ALKEV Oturma Planı Yükleniyor...
        </p>
      </div>
    );
  }

  // If not authenticated, render LoginView
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-800'
                : toast.type === 'error'
                ? 'bg-red-900 text-white border-red-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar with official ALKEV logo & TeacherRole switcher */}
      <Navbar
        classrooms={classrooms}
        activeClassroom={activeClassroom || defaultClassrooms[0]}
        userRole={effectiveRole}
        isClassOwner={isClassOwner}
        onSelectClassroom={(c) => setActiveClassId(c.id)}
        onOpenNewClassModal={() => setIsNewClassModalOpen(true)}
        onOpenEditClassModal={() => setIsEditClassModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Kullanıcı henüz sınıf oluşturmadıysa ve diğer sınıfları salt okunur izliyorsa bildirim kartı */}
        {!isClassOwner && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  Branş Öğretmeni Modu (Salt Okunur Erişim)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Bu sınıf <span className="font-bold underline">{activeClassroom?.advisoryTeacher || 'başka bir danışman öğretmen'}</span> tarafından oluşturulmuştur. Kendi sınıfınızı oluşturup oturma planı düzenlemek, öğrenci eklemek ve PDF indirmek için <strong>"+ Yeni Sınıf"</strong> oluşturabilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsNewClassModalOpen(true)}
              className="shrink-0 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Kendi Sınıfımı Oluştur</span>
            </button>
          </div>
        )}

        {/* Sınıf Seçilmemişse Uyarı Ekranı */}
        {!activeClassroom ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 p-12 text-center shadow-xs max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <School className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Lütfen önce bir sınıf seçin veya oluşturun
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Oturma planı ve öğrenci listesini yönetebilmek için üst menüden kayıtlı bir sınıf seçebilir ya da hemen yeni bir sınıf oluşturabilirsiniz.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsNewClassModalOpen(true)}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                + Yeni Sınıf Oluştur
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Sınıf Başlığı ve Kılavuz */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-blue-950 tracking-tight">
                  {activeClassroom.name} Sınıfı Oturma Düzeni
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Danışman Öğretmen:{' '}
                  <span className="font-semibold text-slate-800">
                    {activeClassroom.advisoryTeacher}
                  </span>
                  {' · '}
                  Mevcut:{' '}
                  <span className="font-semibold text-slate-800">
                    {activeClassroom.students.length} Öğrenci
                  </span>
                </p>
              </div>

              <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-2xs">
                {isClassOwner ? (
                  <span>
                    <span className="font-semibold text-emerald-800">Sınıf Yöneticisi:</span> Koltuklara tıklayarak yer değiştirebilir, öğrenci ve ders notu ekleyebilirsiniz.
                  </span>
                ) : (
                  <span>
                    <span className="font-semibold text-amber-800">Branş Modu:</span> Sınıf düzeni salt okunur biçimde görüntülenmektedir.
                  </span>
                )}
              </div>
            </div>

            {/* Toolbar (Smart Seating, PDF, Observation Modal, Add Student, Class Comment, Student Report) */}
            <ClassroomToolbar
              classroom={activeClassroom}
              userRole={effectiveRole}
              isExportingPDF={isExportingPDF}
              onRunSmartSeating={handleRunSmartSeating}
              onExportPDF={handleExportPDF}
              onOpenObservationModal={() => openObservationModal('view')}
              onOpenAddStudent={() => openObservationModal('add')}
              onOpenClassroomComment={() => setIsClassroomCommentModalOpen(true)}
              onOpenStudentReport={() => setIsStudentReportModalOpen(true)}
              onClearDesks={handleClearDesks}
            />

            {/* Interactive Classroom Grid */}
            <ClassroomGrid
              classroom={activeClassroom}
              userRole={effectiveRole}
              onUpdateDesks={handleUpdateDesks}
              onOpenAddStudent={() => openObservationModal('add')}
              onOpenStudentComment={(student) => setSelectedStudentForComment(student)}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          ALKEV Özel Okulları &copy; 2026 · Kurumsal Akıllı Sınıf Oturma Düzeni ve Öğrenci Takip Sistemi
        </div>
      </footer>

      {/* Modals */}
      {isObservationModalOpen && activeClassroom && (
        <StudentObservationModal
          students={activeClassroom.students}
          classroomName={activeClassroom.name}
          userRole={effectiveRole}
          initialMode={observationModalMode}
          onClose={() => setIsObservationModalOpen(false)}
          onUpdateStudents={handleUpdateStudents}
        />
      )}

      {/* Öğrenci Yorum Raporu Modalı */}
      {isStudentReportModalOpen && activeClassroom && (
        <StudentReportModal
          classroom={activeClassroom}
          onClose={() => setIsStudentReportModalOpen(false)}
        />
      )}

      {isNewClassModalOpen && (
        <ClassModal
          currentUserEmail={currentUser.email}
          currentUserName={currentUser.displayName}
          onClose={() => setIsNewClassModalOpen(false)}
          onSaveClassroom={handleSaveNewClassroom}
        />
      )}

      {isEditClassModalOpen && activeClassroom && isClassOwner && (
        <ClassModal
          classroomToEdit={activeClassroom}
          currentUserEmail={currentUser.email}
          currentUserName={currentUser.displayName}
          onClose={() => setIsEditClassModalOpen(false)}
          onSaveClassroom={handleSaveEditClassroom}
        />
      )}

      {/* Bireysel Öğrenci Ders Yorumu Modalı */}
      {selectedStudentForComment && activeClassroom && isClassOwner && (
        <StudentCommentModal
          student={selectedStudentForComment}
          teacherName={currentUser.displayName || activeClassroom.advisoryTeacher}
          onClose={() => setSelectedStudentForComment(null)}
          onSaveComment={handleSaveStudentComment}
          onDeleteComment={handleDeleteStudentComment}
        />
      )}

      {/* Toplu Sınıf Yorumu Modalı */}
      {isClassroomCommentModalOpen && activeClassroom && isClassOwner && (
        <ClassroomCommentModal
          classroomName={activeClassroom.name}
          advisoryTeacher={activeClassroom.advisoryTeacher}
          classroomLogs={activeClassroom.classroomLogs || []}
          onClose={() => setIsClassroomCommentModalOpen(false)}
          onSaveClassroomLog={handleSaveClassroomLog}
          onDeleteClassroomLog={handleDeleteClassroomLog}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ClassroomApp />
    </AuthProvider>
  );
}
