import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLottery, getDrawHistory } from '../firebase/firestore';
import './ViewLottery.css';

/**
 * 作成者用くじ閲覧ページ
 */
const ViewLottery = () => {
    const { lotteryId } = useParams();
    const { user, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const [lottery, setLottery] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const lotteryData = await getLottery(lotteryId);
                setLottery(lotteryData);

                // 作成者でない場合はくじ引きページへリダイレクト
                if (lotteryData && user && lotteryData.creatorId !== user.uid) {
                    navigate(`/draw/${lotteryId}`, { replace: true });
                    return;
                }

                // 引き履歴を取得
                const historyData = await getDrawHistory(lotteryId);
                setHistory(historyData);
            } catch (err) {
                setError('データの読み込みに失敗しました');
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        };

        if (lotteryId && isAuthenticated) {
            fetchData();
        }
    }, [lotteryId, user, isAuthenticated, navigate]);

    if (loading || loadingData) {
        return (
            <div className="view-loading">
                <div className="loading-spinner-large"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="view-unauthorized">
                <h2>ログインが必要です</h2>
                <button onClick={() => navigate('/')} className="back-button">
                    トップページへ
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="view-error">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
                <button onClick={() => navigate('/')} className="back-button">
                    トップページへ
                </button>
            </div>
        );
    }

    if (!lottery) {
        return (
            <div className="view-error">
                <span className="error-icon">🔍</span>
                <p>くじが見つかりませんでした</p>
                <button onClick={() => navigate('/')} className="back-button">
                    トップページへ
                </button>
            </div>
        );
    }

    return (
        <div className="view-lottery">
            <header className="view-header">
                <button onClick={() => navigate('/')} className="back-link">
                    ← トップへ
                </button>
                <span className={`status-badge ${lottery.status}`}>
                    {lottery.status === 'active' ? '受付中' : '終了'}
                </span>
            </header>

            <div className="view-content">
                <h1 className="view-title">{lottery.title}</h1>

                <div className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-icon">🎴</span>
                        <div className="stat-info">
                            <span className="stat-label">残りくじ</span>
                            <span className="stat-value">{lottery.remainingTotal} / {lottery.totalCount}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">🎯</span>
                        <div className="stat-info">
                            <span className="stat-label">残りあたり</span>
                            <span className="stat-value highlight">{lottery.remainingWinners}</span>
                        </div>
                    </div>
                </div>

                {/* 景品一覧 */}
                {lottery.remainingPrizes && (
                    <section className="prizes-section">
                        <h2>🏆 景品一覧</h2>
                        <div className="prizes-list">
                            {lottery.remainingPrizes.map((prize, index) => (
                                <div key={index} className={`prize-item ${prize.remaining === 0 ? 'depleted' : ''}`}>
                                    <span className="prize-rank">{index + 1}等</span>
                                    <span className="prize-name">{prize.name}</span>
                                    <span className="prize-count">
                                        残り {prize.remaining} / {prize.count} 枚
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 引き履歴 */}
                <section className="history-section">
                    <h2>📋 引き履歴</h2>
                    {history.length === 0 ? (
                        <p className="no-history">まだ誰も引いていません</p>
                    ) : (
                        <div className="history-list">
                            {history.map((item, index) => (
                                <div key={index} className={`history-item ${item.result}`}>
                                    <span className="history-nickname">{item.nickname || '匿名'}</span>
                                    <span className={`history-result ${item.result}`}>
                                        {item.result === 'win' ? `🎉 ${item.prizeName}` : 'はずれ'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* シェアリンク */}
                <section className="share-section">
                    <h2>🔗 参加者に共有</h2>
                    <div className="share-url">
                        <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/draw/${lotteryId}`}
                            onClick={(e) => e.target.select()}
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/draw/${lotteryId}`);
                                alert('URLをコピーしました');
                            }}
                        >
                            コピー
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ViewLottery;
