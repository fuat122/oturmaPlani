import React from 'react';
import { useAuth } from '../context/AuthContext';
import { School, ShieldAlert, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithGoogle, signInAsTestTeacher, loading, authError, clearError } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full">
        {/* Logo and Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-md mb-4 ring-4 ring-blue-50">
            <School className="w-9 h-9 text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight">
            ALKEV Özel Okulları
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            Akıllı Sınıf Oturma Planı & Pedagojik Dağılım Sistemi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          
          {/* Security Banner / Notice */}
          <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Kurumsal Güvenlik Korumalı:</span> Öğrenci verilerinin gizliliği ve güvenliği için sistemimiz yalnızca ALKEV Okulları öğretmenlerine ve idarecilerine açıktır.
              </div>
            </div>
          </div>

          {/* Auth Error Banner if non-alkev or popup cancelled */}
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-left animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-red-800">Erişim Reddedildi</h4>
                  <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                    {authError}
                  </p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="mt-3 text-xs font-semibold text-red-700 hover:text-red-900 underline block text-right w-full"
              >
                Uyanıyı Kapat
              </button>
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <div className="space-y-4">
            <button
              onClick={() => signInWithGoogle()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 rounded-xl shadow-xs bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Google ile Giriş Yap</span>
            </button>

            {/* Exact Required Warning Message Underneath Button */}
            <p className="text-center text-xs text-slate-500 font-medium">
              ℹ️ Yalnızca @alkev.k12.tr uzantılı kurumsal e-posta adresleri kabul edilmektedir.
            </p>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Geliştirme / Önizleme
              </span>
            </div>
          </div>

          {/* Test Mode Switch */}
          <button
            onClick={() => signInAsTestTeacher()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Test Öğretmeni Olarak Başla (ogretmen@alkev.k12.tr)</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          ALKEV Özel Okulları &copy; 2026 · Akıllı Sınıf Oturma Planı Sistemi
        </div>
      </div>
    </div>
  );
};
