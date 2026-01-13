import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createLottery } from '../../firebase/firestore';
import './LotteryForm.css';

/**
 * くじ作成フォーム（複数景品対応）
 */
const LotteryForm = ({ onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        totalCount: 10,
        prizes: [{ name: '', count: 1 }]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        }));
    };

    // 景品の変更ハンドラー
    const handlePrizeChange = (index, field, value) => {
        setFormData(prev => {
            const newPrizes = [...prev.prizes];
            newPrizes[index] = {
                ...newPrizes[index],
                [field]: field === 'count' ? parseInt(value, 10) || 0 : value
            };
            return { ...prev, prizes: newPrizes };
        });
    };

    // 景品を追加
    const addPrize = () => {
        setFormData(prev => ({
            ...prev,
            prizes: [...prev.prizes, { name: '', count: 1 }]
        }));
    };

    // 景品を削除
    const removePrize = (index) => {
        if (formData.prizes.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            prizes: prev.prizes.filter((_, i) => i !== index)
        }));
    };

    // あたりの合計枚数を計算
    const totalWinners = formData.prizes.reduce((sum, p) => sum + p.count, 0);
    const loserCount = formData.totalCount - totalWinners;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // バリデーション
        if (!formData.title.trim()) {
            setError('タイトルを入力してください');
            return;
        }
        if (formData.totalCount < 1) {
            setError('全体枚数は1枚以上にしてください');
            return;
        }
        if (formData.prizes.some(p => !p.name.trim())) {
            setError('すべての景品名を入力してください');
            return;
        }
        if (formData.prizes.some(p => p.count < 1)) {
            setError('景品枚数は1枚以上にしてください');
            return;
        }
        if (totalWinners > formData.totalCount) {
            setError('あたりの合計枚数が全体枚数を超えています');
            return;
        }

        setLoading(true);

        try {
            const lotteryId = await createLottery({
                creatorId: user.uid,
                creatorName: user.displayName || 'ゲスト',
                title: formData.title,
                totalCount: formData.totalCount,
                prizes: formData.prizes
            });

            if (onSuccess) {
                onSuccess(lotteryId);
            }
        } catch (err) {
            setError('くじの作成に失敗しました。もう一度お試しください。');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="lottery-form" onSubmit={handleSubmit}>
            <h2 className="form-title">🎯 くじを作成</h2>

            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="title">くじのタイトル</label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="例: 新年会ビンゴ大会"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="totalCount">くじの総枚数</label>
                <input
                    type="number"
                    id="totalCount"
                    name="totalCount"
                    value={formData.totalCount}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="form-input"
                />
            </div>

            <div className="form-group prizes-section">
                <label>景品の設定</label>
                <div className="prizes-list">
                    {formData.prizes.map((prize, index) => (
                        <div key={index} className="prize-item">
                            <span className="prize-rank">{index + 1}等</span>
                            <input
                                type="text"
                                value={prize.name}
                                onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                                placeholder="景品名"
                                className="form-input prize-name"
                            />
                            <input
                                type="number"
                                value={prize.count}
                                onChange={(e) => handlePrizeChange(index, 'count', e.target.value)}
                                min="1"
                                max={formData.totalCount}
                                className="form-input prize-count"
                            />
                            <span className="prize-unit">枚</span>
                            {formData.prizes.length > 1 && (
                                <button
                                    type="button"
                                    className="remove-prize-btn"
                                    onClick={() => removePrize(index)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" className="add-prize-btn" onClick={addPrize}>
                    ＋ 景品を追加
                </button>
            </div>

            <div className="form-summary">
                <div className="summary-item">
                    <span>あたり合計</span>
                    <span className="summary-value winner">{totalWinners}枚</span>
                </div>
                <div className="summary-item">
                    <span>はずれ</span>
                    <span className={`summary-value ${loserCount < 0 ? 'error' : 'loser'}`}>
                        {loserCount}枚
                    </span>
                </div>
                <div className="summary-item">
                    <span>当選確率</span>
                    <span className="summary-value">
                        {((totalWinners / formData.totalCount) * 100).toFixed(1)}%
                    </span>
                </div>
            </div>

            <button
                type="submit"
                className="submit-button"
                disabled={loading || loserCount < 0}
            >
                {loading ? (
                    <span className="loading-spinner"></span>
                ) : (
                    <>
                        <span>🎲</span>
                        <span>くじを作成する</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default LotteryForm;
