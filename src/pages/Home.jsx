import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from '../components/Auth/LoginButton';
import { getActiveLotteries, getLotteriesByCreator, deleteLottery } from '../firebase/firestore';
import './Home.css';

/**
 * トップページ
 */
const Home = () => {
    const { user, isAuthenticated, loading, isDemoMode } = useAuth();
    const navigate = useNavigate();
    const [myLotteries, setMyLotteries] = useState([]);
    const [activeLotteries, setActiveLotteries] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (lotteryId, e) => {
        e.stopPropagation();
        setDeleteConfirm(lotteryId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            await deleteLottery(deleteConfirm, user.uid);
            setMyLotteries(prev => prev.filter(l => l.id !== deleteConfirm));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('削除に失敗:', error);
            alert(error.message || '削除に失敗しました');
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;

            setLoadingData(true);
            try {
                const [myData, activeData] = await Promise.all([
                    getLotteriesByCreator(user.uid),
                    getActiveLotteries()
                ]);
                setMyLotteries(myData);
                // 自分が作成したものを除外
                setActiveLotteries(activeData.filter(l => l.creatorId !== user.uid));
            } catch (error) {
                console.error('データの取得に失敗:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [isAuthenticated, user]);

    if (loading) {
        return (
            <div className="home-loading">
                <div className="loading-spinner-large"></div>
            </div>
        );
    }

    return (
        <div className="home">
            <header className="home-header">
                <h1 className="app-title">
                    <span className="title-icon">🎰</span>
                    くじ引きアプリ
                </h1>
                <LoginButton />
            </header>

            {isDemoMode && (
                <div className="demo-banner">
                    <span>🧪</span>
                    <span>デモモード: Firebase未設定のため、データはブラウザ内に一時保存されます</span>
                </div>
            )}

            {!isAuthenticated ? (
                <main className="home-hero">
                    <div className="hero-content">
                        <h2 className="hero-title">
                            みんなで楽しむ<br />
                            <span className="highlight">オンラインくじ引き</span>
                        </h2>
                        <p className="hero-description">
                            簡単にくじを作成して、友達や仲間と一緒に楽しもう！
                            <br />
                            一番くじONLINE風のカードめくりアニメーションで
                            <br />
                            ドキドキのくじ引き体験を。
                        </p>
                        <div className="hero-features">
                            <div className="feature-item">
                                <span className="feature-icon">🎯</span>
                                <span>くじを作成</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">🎴</span>
                                <span>カードをめくる</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">🎊</span>
                                <span>結果を確認</span>
                            </div>
                        </div>
                        <p className="hero-cta">
                            👆 上のボタンからGoogleアカウントでログインしてね！
                        </p>
                    </div>
                </main>
            ) : (
                <main className="home-main">
                    <div className="action-buttons">
                        <button
                            className="action-button create"
                            onClick={() => navigate('/create')}
                        >
                            <span className="button-icon">🎯</span>
                            <span className="button-text">くじを作成する</span>
                        </button>
                    </div>

                    {loadingData ? (
                        <div className="section-loading">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <>
                            {myLotteries.length > 0 && (
                                <section className="lottery-section">
                                    <h2 className="section-title">📋 自分が作成したくじ</h2>
                                    <div className="lottery-list">
                                        {myLotteries.map(lottery => (
                                            <div
                                                key={lottery.id}
                                                className="lottery-card"
                                                onClick={() => navigate(`/view/${lottery.id}`)}
                                            >
                                                <div className="lottery-card-header">
                                                    <h3 className="lottery-card-title">{lottery.title}</h3>
                                                    <span className={`status-badge ${lottery.status}`}>
                                                        {lottery.status === 'active' ? '受付中' : '終了'}
                                                    </span>
                                                </div>
                                                <div className="lottery-card-stats">
                                                    <span>残り: {lottery.remainingTotal}/{lottery.totalCount}枚</span>
                                                    <span>あたり: {lottery.remainingWinners}枚</span>
                                                </div>
                                                <button
                                                    className="delete-button"
                                                    onClick={(e) => handleDelete(lottery.id, e)}
                                                >
                                                    🗑️ 削除
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeLotteries.length > 0 && (
                                <section className="lottery-section">
                                    <h2 className="section-title">🎲 参加できるくじ</h2>
                                    <div className="lottery-list">
                                        {activeLotteries.map(lottery => (
                                            <div
                                                key={lottery.id}
                                                className="lottery-card"
                                                onClick={() => navigate(`/draw/${lottery.id}`)}
                                            >
                                                <div className="lottery-card-header">
                                                    <h3 className="lottery-card-title">{lottery.title}</h3>
                                                </div>
                                                <div className="lottery-card-info">
                                                    <span>作成者: {lottery.creatorName}</span>
                                                </div>
                                                <div className="lottery-card-stats">
                                                    <span>残り: {lottery.remainingTotal}枚</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {myLotteries.length === 0 && activeLotteries.length === 0 && (
                                <div className="empty-state">
                                    <span className="empty-icon">🎰</span>
                                    <p>まだくじがありません</p>
                                    <p className="empty-hint">「くじを作成する」ボタンから新しいくじを作ってみよう！</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            )}

            {/* 削除確認ダイアログ */}
            {deleteConfirm && (
                <div className="delete-modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>くじを削除しますか？</h3>
                        <p>この操作は取り消せません。</p>
                        <div className="delete-modal-buttons">
                            <button
                                className="cancel-btn"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                            >
                                キャンセル
                            </button>
                            <button
                                className="confirm-delete-btn"
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? '削除中...' : '削除する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
