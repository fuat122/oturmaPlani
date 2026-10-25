import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  isAlkevEmail
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInAsTestTeacher: () => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const LOCAL_STORAGE_TEST_USER_KEY = 'alkev_test_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize listener & check existing sessions
  useEffect(() => {
    // Check if test user was persisted locally
    const savedTestUser = localStorage.getItem(LOCAL_STORAGE_TEST_USER_KEY);
    if (savedTestUser) {
      try {
        const parsed = JSON.parse(savedTestUser);
        if (isAlkevEmail(parsed.email)) {
          setCurrentUser(parsed);
          setLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_TEST_USER_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const email = user.email || '';
          if (!isAlkevEmail(email)) {
            // Unconditionally sign out non-ALKEV users and display warning
            await firebaseSignOut(auth);
            setCurrentUser(null);
            setAuthError(
              'Yetkisiz Giriş: Yalnızca @alkev.k12.tr uzantılı kurumsal e-posta adresleri ile sisteme erişebilirsiniz.'
            );
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'ALKEV Öğretmeni',
              photoURL: user.photoURL || undefined,
              isTestUser: false
            });
            setAuthError(null);
          }
        } else {
          // If no Firebase user and no test user, clear
          if (!localStorage.getItem(LOCAL_STORAGE_TEST_USER_KEY)) {
            setCurrentUser(null);
          }
        }
      } catch (err: any) {
        console.error('Auth state change error:', err);
        setAuthError('Kimlik doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
      } finally {
        // loading state MUST always be false in every scenario to avoid screen lock
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || '';
      if (!isAlkevEmail(email)) {
        // Enforce immediate sign out
        await firebaseSignOut(auth);
        setCurrentUser(null);
        setAuthError(
          'Yetkisiz Giriş: Yalnızca @alkev.k12.tr uzantılı kurumsal e-posta adresleri ile sisteme erişebilirsiniz.'
        );
      } else {
        localStorage.removeItem(LOCAL_STORAGE_TEST_USER_KEY);
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'ALKEV Öğretmeni',
          photoURL: result.user.photoURL || undefined,
          isTestUser: false
        });
        setAuthError(null);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Giriş penceresi kapatıldı.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('Firebase yetkili alan adı (authorized domain) ayarı bekleniyor. Test modunu kullanabilirsiniz.');
      } else {
        setAuthError('Giriş yapılırken bir hata oluştu: ' + (err.message || 'Lütfen tekrar deneyiniz.'));
      }
    } finally {
      // Must guarantee loading is set to false in every single scenario
      setLoading(false);
    }
  };

  const signInAsTestTeacher = () => {
    setLoading(true);
    const testUser: UserProfile = {
      uid: 'alkev-demo-teacher-01',
      email: 'ogretmen@alkev.k12.tr',
      displayName: 'Zeynep Kaya (Danışman Öğretmen)',
      photoURL: undefined,
      isTestUser: true
    };
    localStorage.setItem(LOCAL_STORAGE_TEST_USER_KEY, JSON.stringify(testUser));
    setCurrentUser(testUser);
    setAuthError(null);
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(LOCAL_STORAGE_TEST_USER_KEY);
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        signInWithGoogle,
        signInAsTestTeacher,
        signOut,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
