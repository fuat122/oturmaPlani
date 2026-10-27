import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Classroom } from '../types';

const CLASSROOMS_COLLECTION = 'classrooms';

/**
 * Save classroom document to Firebase/Firestore with graceful fallback
 */
export const saveClassroomToFirestore = async (classroom: Classroom): Promise<boolean> => {
  try {
    const docRef = doc(db, CLASSROOMS_COLLECTION, classroom.id);
    await setDoc(docRef, {
      ...classroom,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore kaydetme uyarısı (Offline veya yetki modu):', err);
    return false;
  }
};

/**
 * Fetch all classrooms from Firebase/Firestore
 */
export const fetchClassroomsFromFirestore = async (): Promise<Classroom[] | null> => {
  try {
    const querySnapshot = await getDocs(collection(db, CLASSROOMS_COLLECTION));
    if (!querySnapshot.empty) {
      const list: Classroom[] = [];
      querySnapshot.forEach((d) => {
        list.push(d.data() as Classroom);
      });
      return list;
    }
  } catch (err) {
    console.warn('Firestore okuma uyarısı (Offline veya yetki modu):', err);
  }
  return null;
};

/**
 * Delete classroom from Firestore
 */
export const deleteClassroomFromFirestore = async (classroomId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, CLASSROOMS_COLLECTION, classroomId));
    return true;
  } catch (err) {
    console.warn('Firestore silme hatası:', err);
    return false;
  }
};
