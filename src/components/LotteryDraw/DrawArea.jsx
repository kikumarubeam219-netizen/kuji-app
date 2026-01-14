import { useState, useEffect } from 'react';
import DrawCard from './DrawCard';
import ResultModal from '../Result/ResultModal';
import { drawLottery, getLottery, hasUserDrawn } from '../../firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import './DrawArea.css';

/**
 * くじ引きエリア全体（複数カード選択対応）
 */
const DrawArea = ({ lotteryId }) => {
    const { user } = useAuth();
    const [lottery, setLottery] = useState(null);
    const [nickname, setNickname] = useState('');
    const [isNicknameSet, setIsNicknameSet] = useState(false);
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [drawnCards, setDrawnCards] = useState(new Set());
    const [hasAlreadyDrawn, setHasAlreadyDrawn] = useState(false);

    useEffect(() => {
        const fetchLottery = async () => {
            try {
                const data = await getLottery(lotteryId);
                setLottery(data);

                // 既に引かれたカードをセット
                if (data?.cards) {
                    const drawn = new Set();
                    data.cards.forEach((card, index) => {
                        if (card.drawn) drawn.add(index);
                    });
                    setDrawnCards(drawn);
                }

                // ユーザーが既に引いたかチェック
                if (user && data) {
                    const alreadyDrawn = await hasUserDrawn(lotteryId, user.uid);
                    setHasAlreadyDrawn(alreadyDrawn);
                }
            } catch (err) {
                setError('くじの読み込みに失敗しました');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (lotteryId) {
            fetchLottery();
        }
    }, [lotteryId, user]);

    const handleNicknameSubmit = (e) => {
        e.preventDefault();
        if (nickname.trim()) {
            setIsNicknameSet(true);
        }
    };

    const handleDraw = async (cardIndex) => {
        if (drawnCards.has(cardIndex) || hasAlreadyDrawn) return null;

        try {
            const drawResult = await drawLottery(lotteryId, user.uid, nickname, cardIndex);

            setResult(drawResult);

            // 当たりの場合は予告演出の後にモーダル表示（2秒後）
            // はずれの場合はすぐにモーダル表示（0.6秒後）
            const delay = drawResult.result === 'win' ? 2000 : 600;
            setTimeout(() => {
                // 引いたカードを記録
                setDrawnCards(prev => new Set([...prev, cardIndex]));
                setShowModal(true);
            }, delay);

            // くじ情報を更新
            const updatedLottery = await getLottery(lotteryId);
            setLottery(updatedLottery);

            return drawResult;
        } catch (err) {
            setError(err.message || 'くじ引きに失敗しました');
            throw err;
        }
    };

    const closeModal = () => {
        setShowModal(false);
        // 結果を見た後に制限をかける
        setHasAlreadyDrawn(true);
    };

    if (loading) {
        return (
            <div className="draw-area-loading">
                <div className="loading-spinner-large"></div>
                <p>読み込み中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="draw-area-error">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
            </div>
        );
    }

    if (!lottery) {
        return (
            <div className="draw-area-error">
                <span className="error-icon">🔍</span>
                <p>くじが見つかりませんでした</p>
            </div>
        );
    }

    if (lottery.status === 'completed' || lottery.remainingTotal <= 0) {
        return (
            <div className="draw-area-completed">
                <span className="completed-icon">🎊</span>
                <h2>このくじは終了しました</h2>
                <p>全てのくじが引かれました</p>
            </div>
        );
    }

    if (hasAlreadyDrawn) {
        return (
            <div className="draw-area-already-drawn">
                <span className="already-drawn-icon">✅</span>
                <h2>あなたは既にくじを引きました</h2>
                <p>このくじは一人1回までです</p>
                <div className="lottery-info-box">
                    <h3>{lottery.title}</h3>
                    <p>残り: {lottery.remainingTotal}枚</p>
                </div>
            </div>
        );
    }

    // ログインしていない場合はログインを促す
    if (!user) {
        return (
            <div className="draw-area-login-required">
                <div className="lottery-header">
                    <h1 className="lottery-title">{lottery.title}</h1>
                    <div className="creator-info">
                        作成者: {lottery.creatorName}
                    </div>
                </div>
                <div className="login-prompt">
                    <span className="login-icon">🔐</span>
                    <h2>くじを引くにはログインが必要です</h2>
                    <p>Googleアカウントでログインしてください</p>
                    <p className="login-hint">右上の「ログイン」ボタンをクリック！</p>
                </div>
            </div>
        );
    }

    return (
        <div className="draw-area">
            <div className="lottery-header">
                <h1 className="lottery-title">{lottery.title}</h1>
                <div className="lottery-stats">
                    <div className="stat-item">
                        <span className="stat-label">残り</span>
                        <span className="stat-value">{lottery.remainingTotal}枚</span>
                    </div>
                    <div className="stat-divider" />
                    <div className="stat-item">
                        <span className="stat-label">あたり残り</span>
                        <span className="stat-value highlight">{lottery.remainingWinners}枚</span>
                    </div>
                </div>

                {/* 景品一覧表示 */}
                {lottery.remainingPrizes && (
                    <div className="prizes-status">
                        {lottery.remainingPrizes.map((prize, index) => (
                            <div key={index} className={`prize-status-item ${prize.remaining === 0 ? 'depleted' : ''}`}>
                                <span className="prize-rank-badge">{index + 1}等</span>
                                <span className="prize-name">{prize.name}</span>
                                <span className="prize-remaining">残り{prize.remaining}枚</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="creator-info">
                    作成者: {lottery.creatorName}
                </div>
            </div>

            {!isNicknameSet ? (
                <form className="nickname-form" onSubmit={handleNicknameSubmit}>
                    <h2>ニックネームを入力してね</h2>
                    <div className="nickname-input-wrapper">
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="ニックネーム"
                            className="nickname-input"
                            maxLength={20}
                        />
                        <button type="submit" className="nickname-submit" disabled={!nickname.trim()}>
                            決定
                        </button>
                    </div>
                </form>
            ) : (
                <div className="draw-section">
                    <p className="draw-instruction">
                        <span className="nickname-display">{nickname}</span>さん、好きなカードを1枚選んでタップ！
                    </p>

                    <div className="cards-grid">
                        {lottery.cards.map((card, index) => (
                            <DrawCard
                                key={index}
                                cardIndex={index}
                                isDrawn={drawnCards.has(index)}
                                onDraw={() => handleDraw(index)}
                                disabled={drawnCards.has(index) || card.drawn || hasAlreadyDrawn}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showModal && result && (
                <ResultModal
                    result={result}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default DrawArea;
