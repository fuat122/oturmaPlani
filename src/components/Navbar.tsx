import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Classroom } from '../types';
import {
  GraduationCap,
  LogOut,
  ChevronDown,
  Plus,
  Settings,
  Sparkles,
  School,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  classrooms: Classroom[];
  activeClassroom: Classroom;
  onSelectClassroom: (classroom: Classroom) => void;
  onOpenNewClassModal: () => void;
  onOpenEditClassModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  classrooms,
  activeClassroom,
  onSelectClassroom,
  onOpenNewClassModal,
  onOpenEditClassModal
}) => {
  const { currentUser, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Mobile responsive: flex-col sm:flex-row, logo, sınıf seçici ve kullanıcı profili taşma yapmaz */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Sol Alan: Kurumsal Logo & Başlık */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <School className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-blue-950 text-base tracking-tight">ALKEV</span>
                <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">Özel Okulları</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Akıllı Sınıf Oturma Planı</p>
            </div>
          </div>

          {/* Mobil Sınıf Badge */}
          <div className="sm:hidden text-xs font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
            {activeClassroom.name} · {activeClassroom.advisoryTeacher}
          </div>
        </div>

        {/* Orta Alan: Sınıf Seçici & Şube Kontrolleri */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <div className="relative inline-block text-left w-full sm:w-auto">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="font-bold text-blue-950">{activeClassroom.name}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-600 truncate">{activeClassroom.advisoryTeacher}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="origin-top-right absolute left-0 sm:right-0 sm:left-auto mt-1 w-64 rounded-xl shadow-lg bg-white ring-1 ring-black/5 divide-y divide-slate-100 z-30 py-1">
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Kayıtlı Sınıflar
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {classrooms.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectClassroom(c);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          c.id === activeClassroom.id
                            ? 'bg-blue-50 text-blue-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.advisoryTeacher}</div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {c.students.length} Öğrenci
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="p-1.5 flex gap-1 bg-slate-50">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewClassModal();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yeni Sınıf
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenEditClassModal();
                      }}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                      title="Sınıf Bilgilerini Düzenle"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px] sm:max-w-[180px]">
                {currentUser?.displayName || 'Öğretmen'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px] sm:max-w-[180px]">
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
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
