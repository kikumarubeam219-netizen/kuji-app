import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LotteryForm from '../components/LotteryCreator/LotteryForm';
import './CreateLottery.css';

/**
 * くじ作成ページ
 */
const CreateLottery = () => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    const handleSuccess = (lotteryId) => {
        // 作成成功後、くじ引きページへ遷移
        navigate(`/draw/${lotteryId}`);
    };

    if (loading) {
        return (
            <div className="create-loading">
                <div className="loading-spinner-large"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="create-unauthorized">
                <h2>ログインが必要です</h2>
                <p>くじを作成するにはログインしてください</p>
                <button onClick={() => navigate('/')} className="back-button">
                    トップページへ
                </button>
            </div>
        );
    }

    return (
        <div className="create-lottery">
            <header className="create-header">
                <button onClick={() => navigate('/')} className="back-link">
                    ← 戻る
                </button>
            </header>

            <main className="create-main">
                <LotteryForm onSuccess={handleSuccess} />
            </main>
        </div>
    );
};

export default CreateLottery;
