import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Classroom, TeacherRole } from '../types';
import {
  LogOut,
  ChevronDown,
  Plus,
  Settings,
  School,
  Shield,
  Eye,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface NavbarProps {
  classrooms: Classroom[];
  activeClassroom: Classroom;
  userRole: TeacherRole;
  isClassOwner: boolean;
  onSelectClassroom: (classroom: Classroom) => void;
  onOpenNewClassModal: () => void;
  onOpenEditClassModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  classrooms,
  activeClassroom,
  userRole,
  isClassOwner,
  onSelectClassroom,
  onOpenNewClassModal,
  onOpenEditClassModal
}) => {
  const { currentUser, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const logoUrl = `${import.meta.env.BASE_URL}assets/aistudio/alkev-logo-tr-2025_552f0d5d.png`;

  // Kullanıcının kendi oluşturduğu sınıflar ve diğer sınıflar ayrımı
  const myClasses = classrooms.filter(
    (c) =>
      currentUser?.email &&
      (
        (c.creatorEmail && c.creatorEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser.isTestUser && c.creatorEmail === 'ogretmen@alkev.k12.tr') ||
        (c.advisoryTeacher && currentUser.displayName && c.advisoryTeacher.trim().toLowerCase() === currentUser.displayName.trim().toLowerCase())
      )
  );

  const otherClasses = classrooms.filter((c) => !myClasses.some((mc) => mc.id === c.id));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Mobile responsive: flex-col sm:flex-row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Sol Alan: Resmi ALKEV Logosu */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="ALKEV Özel Okulları"
              className="h-10 sm:h-11 w-auto max-w-[200px] object-contain drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="border-l border-slate-200 pl-3 hidden md:block">
              <span className="text-xs font-bold text-blue-950 block leading-tight">
                Akıllı Sınıf Oturma Planı
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Pedagojik Düzen & Gözlem Sistemi
              </span>
            </div>
          </div>

          {/* Mobil Sınıf Badge */}
          <div className="sm:hidden text-xs font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 truncate max-w-[150px]">
            {activeClassroom ? activeClassroom.name : 'Sınıf Seçiniz'}
          </div>
        </div>

        {/* Orta Alan: Sınıf Seçici & Rol Durumu */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
          
          {/* Sınıf Seçici Açılır Menü */}
          <div className="relative inline-block text-left w-full sm:w-auto">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2 h-2 rounded-full ${isClassOwner ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="font-bold text-blue-950">{activeClassroom?.name || 'Sınıf Seçiniz'}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-600 truncate">{activeClassroom?.advisoryTeacher || 'Sınıf'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="origin-top-right absolute left-0 sm:right-0 sm:left-auto mt-1 w-72 rounded-xl shadow-lg bg-white ring-1 ring-black/5 divide-y divide-slate-100 z-30 py-1">
                  
                  {/* Kendi Sınıflarım */}
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between bg-emerald-50/50">
                      <span>Sınıflarım (Düzenleme Yetkili)</span>
                      <span className="text-emerald-700">{myClasses.length}</span>
                    </div>
                    {myClasses.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">
                        Henüz oluşturduğunuz bir sınıf yok.
                      </div>
                    ) : (
                      myClasses.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectClassroom(c);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            c.id === activeClassroom.id
                              ? 'bg-blue-50 text-blue-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              <span>{c.name}</span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-medium">Sahibi</span>
                            </div>
                            <div className="text-[11px] text-slate-500">{c.advisoryTeacher}</div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {c.students.length} Öğrenci
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Diğer Sınıflar (Salt Okunur) */}
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between bg-slate-50">
                      <span>Diğer Sınıflar (Salt Okunur)</span>
                      <span>{otherClasses.length}</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {otherClasses.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectClassroom(c);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            c.id === activeClassroom.id
                              ? 'bg-amber-50 text-amber-900 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              <span>{c.name}</span>
                              <Eye className="w-3 h-3 text-slate-400" />
                            </div>
                            <div className="text-[11px] text-slate-500">{c.advisoryTeacher}</div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {c.students.length} Öğrenci
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alt İşlemler: Yeni Sınıf & Düzenle */}
                  <div className="p-1.5 flex gap-1 bg-slate-50">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewClassModal();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-700" />
                      + Yeni Sınıf Oluştur
                    </button>
                    {isClassOwner && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenEditClassModal();
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Sınıf Bilgilerini Düzenle"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Yetki Durumu Rozeti: Sınıf Sahibi (Danışman) vs. Branş (Salt Okunur) */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border ${
              isClassOwner
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}
            title={
              isClassOwner
                ? 'Bu sınıfı siz oluşturdunuz. Sıra düzenleme, koltuk takası, öğrenci yönetimi ve PDF indirme yetkiniz açıktır.'
                : 'Bu sınıf başka bir öğretmen tarafından oluşturulmuştur. Yalnızca salt okunur görüntüleyebilirsiniz.'
            }
          >
            {isClassOwner ? (
              <>
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>Danışman Öğretmen (Düzenleme Yetkili)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-700" />
                <span>Branş Öğretmeni (Salt Okunur)</span>
              </>
            )}
          </div>

        </div>

        {/* Sağ Alan: Kullanıcı Profili & Çıkış */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex items-center gap-2">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                className="w-7 h-7 rounded-full border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'Ö'}
              </div>
            )}
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px] sm:max-w-[160px]">
                {currentUser?.displayName || 'Öğretmen'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[130px] sm:max-w-[160px]">
                {currentUser?.email}
              </div>
            </div>
            {currentUser?.isTestUser && (
              <span className="hidden md:inline-block text-[10px] bg-amber-100 text-amber-800 font-medium px-1.5 py-0.5 rounded border border-amber-300">
                Test Modu
              </span>
            )}
          </div>

          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
            title="Oturumu Kapat"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>

      </div>
    </header>
  );
};
