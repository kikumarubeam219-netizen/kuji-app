import { useState } from 'react';
import './DrawCard.css';

/**
 * くじカードコンポーネント（複数カード対応・選択式）
 */
const DrawCard = ({ cardIndex, isDrawn, onDraw, disabled }) => {
    const [isFlipping, setIsFlipping] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [result, setResult] = useState(null);
    const [showWinnerEffect, setShowWinnerEffect] = useState(false);

    const handleClick = async () => {
        if (disabled || isFlipping || isFlipped || isDrawn) return;

        setIsFlipping(true);

        // くじを引く処理を実行
        try {
            const drawResult = await onDraw();

            if (drawResult) {
                // 当たりの場合は予告演出を入れてからめくる
                if (drawResult.result === 'win') {
                    setShowWinnerEffect(true);
                    // 予告演出の後にめくる
                    setTimeout(() => {
                        setResult(drawResult);
                        setIsFlipped(true);
                        setIsFlipping(false);
                    }, 1500);
                } else {
                    // はずれはすぐにめくる
                    setTimeout(() => {
                        setResult(drawResult);
                        setIsFlipped(true);
                        setIsFlipping(false);
                    }, 400);
                }
            } else {
                setIsFlipping(false);
            }
        } catch (error) {
            setIsFlipping(false);
            console.error('くじ引きエラー:', error);
        }
    };

    // 既に引かれたカードの表示
    if (isDrawn && !isFlipped) {
        return (
            <div className="draw-card-container drawn">
                <div className="draw-card">
                    <div className="card-front drawn-card">
                        <div className="drawn-overlay">
                            <span className="drawn-text">済</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`draw-card-container ${isFlipping ? 'flipping' : ''} ${isFlipped ? 'flipped' : ''} ${showWinnerEffect ? 'winner-effect' : ''}`}
            onClick={handleClick}
            style={{ '--card-index': cardIndex }}
        >
            <div className="draw-card">
                {/* 当たり予告エフェクト */}
                {showWinnerEffect && (
                    <div className="winner-anticipation">
                        <div className="sparkle-container">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="sparkle" style={{ '--i': i }} />
                            ))}
                        </div>
                        <div className="rainbow-ring" />
                    </div>
                )}

                {/* カードの表面（めくる前） */}
                <div className="card-front">
                    <div className="card-pattern">
                        <span className="card-number">{cardIndex + 1}</span>
                    </div>
                    <div className="card-shine"></div>
                </div>

                {/* カードの裏面（めくった後） */}
                <div className={`card-back ${result?.result === 'win' ? 'winner' : 'loser'}`}>
                    {result && (
                        <>
                            {result.result === 'win' ? (
                                <div className="result-content winner-content">
                                    <div className="result-icon">🎉</div>
                                    <div className="result-text">あたり!</div>
                                    <div className="prize-text">{result.prizeDescription}</div>
                                </div>
                            ) : (
                                <div className="result-content loser-content">
                                    <div className="result-icon">😢</div>
                                    <div className="result-text">はずれ</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrawCard;

