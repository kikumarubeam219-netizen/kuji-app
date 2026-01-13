import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from './config';

// Googleプロバイダーを作成
const googleProvider = new GoogleAuthProvider();

/**
 * Googleアカウントでログイン
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result;
    } catch (error) {
        console.error('Googleログインエラー:', error);
        throw error;
    }
};

/**
 * ログアウト
 */
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('ログアウトエラー:', error);
        throw error;
    }
};
