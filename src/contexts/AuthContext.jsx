import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isDemoMode } from '../firebase/config';
import { signInWithGoogle, signOut } from '../firebase/auth';

// 認証コンテキストを作成
const AuthContext = createContext(null);

/**
 * 認証状態を提供するプロバイダー
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(!isDemoMode);
    const [demoMode, setDemoMode] = useState(isDemoMode);

    useEffect(() => {
        // デモモードの場合は認証監視をスキップ
        if (isDemoMode) {
            setLoading(false);
            return;
        }

        if (!auth) {
            setLoading(false);
            return;
        }

        // 認証状態の変化を監視
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // クリーンアップ
        return () => unsubscribe();
    }, []);

    const login = async () => {
        if (isDemoMode) {
            // デモモードでは仮のユーザーをセット
            setUser({
                uid: 'demo-user-001',
                displayName: 'デモユーザー',
                photoURL: null,
                email: 'demo@example.com'
            });
            return;
        }

        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('ログインに失敗しました:', error);
            throw error;
        }
    };

    const logout = async () => {
        if (isDemoMode) {
            setUser(null);
            return;
        }

        try {
            await signOut();
        } catch (error) {
            console.error('ログアウトに失敗しました:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isDemoMode: demoMode
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * 認証コンテキストを使用するカスタムフック
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthはAuthProvider内で使用してください');
    }
    return context;
};

export default AuthContext;
