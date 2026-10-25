import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { ClassroomGrid } from './components/ClassroomGrid';
import { ClassroomToolbar } from './components/ClassroomToolbar';
import { StudentObservationModal } from './components/StudentObservationModal';
import { ClassModal } from './components/ClassModal';
import { Classroom, Student, Desk } from './types';
import { defaultClassrooms, generateDefaultDesks } from './data/mockData';
import { runSmartSeating } from './utils/seatingAlgorithm';
import { exportClassroomSeatingPDF } from './utils/pdfExport';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

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
        console.warn('Failed to parse saved classrooms', e);
      }
    }
    return defaultClassrooms;
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    const savedId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_CLASS_ID);
    return savedId || (classrooms[0] ? classrooms[0].id : 'class-9a');
  });

  // Modal states
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);

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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CLASSES_KEY, JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_CLASS_ID, activeClassId);
  }, [activeClassId]);

  // Active classroom helper
  const activeClassroom =
    classrooms.find((c) => c.id === activeClassId) || classrooms[0] || defaultClassrooms[0];

  // Handlers for updating active classroom
  const updateActiveClassroom = (updated: Partial<Classroom>) => {
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id === activeClassroom.id) {
          return {
            ...c,
            ...updated,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
  };

  // Desks update
  const handleUpdateDesks = (newDesks: Desk[]) => {
    updateActiveClassroom({ desks: newDesks });
  };

  // Students update
  const handleUpdateStudents = (newStudents: Student[]) => {
    updateActiveClassroom({ students: newStudents });
    showToast('Öğrenci listesi ve gözlem notları güncellendi.', 'success');
  };

  // Run Smart Seating Algorithm
  const handleRunSmartSeating = () => {
    if (activeClassroom.students.length === 0) {
      showToast('Sınıfta henüz öğrenci bulunmamaktadır. Önce öğrenci ekleyiniz.', 'info');
      return;
    }

    const result = runSmartSeating(activeClassroom.students, activeClassroom.desks);
    updateActiveClassroom({ desks: result.desks });

    const msg = `Akıllı yerleşim tamamlandı! Ön sıra başarısı: %${result.metrics.frontRowSuccessRate}, Cinsiyet dengesi: %${result.metrics.genderBalanceScore}`;
    showToast(msg, 'success');
  };

  // Clear all seats
  const handleClearDesks = () => {
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

  // Export PDF
  const handleExportPDF = async () => {
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

  // Save new classroom
  const handleSaveNewClassroom = (newClass: Classroom) => {
    setClassrooms((prev) => [...prev, newClass]);
    setActiveClassId(newClass.id);
    showToast(`"${newClass.name}" sınıfı başarıyla oluşturuldu.`, 'success');
  };

  // Update existing classroom info
  const handleSaveEditClassroom = (editedClass: Classroom) => {
    setClassrooms((prev) => prev.map((c) => (c.id === editedClass.id ? editedClass : c)));
    showToast(`"${editedClass.name}" sınıf bilgileri güncellendi.`, 'success');
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

      {/* Navbar with responsive flex-col sm:flex-row layout */}
      <Navbar
        classrooms={classrooms}
        activeClassroom={activeClassroom}
        onSelectClassroom={(c) => setActiveClassId(c.id)}
        onOpenNewClassModal={() => setIsNewClassModalOpen(true)}
        onOpenEditClassModal={() => setIsEditClassModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Sınıf Başlığı ve Kılavuz */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-blue-950 tracking-tight">
              {activeClassroom.name} Sınıfı Oturma Düzeni
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Rehber Öğretmen: <span className="font-semibold text-slate-800">{activeClassroom.advisoryTeacher}</span>
              {' · '}
              Öğrenci Mevcudu: <span className="font-semibold text-slate-800">{activeClassroom.students.length}</span>
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-2xs">
            <span className="font-semibold text-blue-900">İpucu:</span> Öğrencileri karşılıklı yer değiştirmek için sırasıyla iki koltuğa tıklayınız.
          </div>
        </div>

        {/* Toolbar (Smart Seating, PDF, Observation Modal) */}
        <ClassroomToolbar
          classroom={activeClassroom}
          isExportingPDF={isExportingPDF}
          onRunSmartSeating={handleRunSmartSeating}
          onExportPDF={handleExportPDF}
          onOpenObservationModal={() => setIsObservationModalOpen(true)}
          onClearDesks={handleClearDesks}
        />

        {/* Interactive Classroom Grid */}
        <ClassroomGrid
          classroom={activeClassroom}
          onUpdateDesks={handleUpdateDesks}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          ALKEV Özel Okulları &copy; 2026 · Kurumsal Akıllı Sınıf Oturma Düzeni ve Öğrenci Takip Sistemi
        </div>
      </footer>

      {/* Modals */}
      {isObservationModalOpen && (
        <StudentObservationModal
          students={activeClassroom.students}
          onClose={() => setIsObservationModalOpen(false)}
          onUpdateStudents={handleUpdateStudents}
        />
      )}

      {isNewClassModalOpen && (
        <ClassModal
          onClose={() => setIsNewClassModalOpen(false)}
          onSaveClassroom={handleSaveNewClassroom}
        />
      )}

      {isEditClassModalOpen && (
        <ClassModal
          classroomToEdit={activeClassroom}
          onClose={() => setIsEditClassModalOpen(false)}
          onSaveClassroom={handleSaveEditClassroom}
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
