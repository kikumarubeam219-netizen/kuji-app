import { useEffect } from 'react';
import './ResultModal.css';

/**
 * 結果表示モーダル
 */
const ResultModal = ({ result, onClose }) => {
    const isWinner = result?.result === 'win';

    useEffect(() => {
        // モーダルが開いている間はスクロールを無効化
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="result-modal-overlay" onClick={onClose}>
            <div
                className={`result-modal ${isWinner ? 'winner' : 'loser'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {isWinner ? (
                    <>
                        <div className="confetti-container">
                            {[...Array(50)].map((_, i) => (
                                <div
                                    key={i}
                                    className="confetti"
                                    style={{
                                        '--x': `${Math.random() * 100}%`,
                                        '--delay': `${Math.random() * 0.5}s`,
                                        '--duration': `${1 + Math.random() * 2}s`,
                                        '--color': ['#fbbf24', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'][Math.floor(Math.random() * 5)]
                                    }}
                                />
                            ))}
                        </div>
                        <div className="result-content">
                            <div className="result-badge winner-badge">
                                <span className="badge-icon">🎊</span>
                                <span className="badge-text">おめでとう！</span>
                            </div>
                            <h2 className="result-title">あたり！</h2>
                            <div className="prize-card">
                                <span className="prize-label">🎁 当選賞品</span>
                                <p className="prize-description">{result.prizeDescription}</p>
                            </div>
                            <button className="close-button" onClick={onClose}>
                                閉じる
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="result-content">
                        <div className="result-badge loser-badge">
                            <span className="badge-icon">😢</span>
                        </div>
                        <h2 className="result-title loser-title">残念...</h2>
                        <p className="loser-message">今回ははずれでした</p>
                        <p className="encourage-message">また挑戦してね！</p>
                        <button className="close-button" onClick={onClose}>
                            閉じる
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultModal;
