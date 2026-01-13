import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DrawArea from '../components/LotteryDraw/DrawArea';
import './DrawLottery.css';

/**
 * くじ引きページ
 */
const DrawLottery = () => {
    const { lotteryId } = useParams();
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="draw-loading">
                <div className="loading-spinner-large"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="draw-unauthorized">
                <h2>ログインが必要です</h2>
                <p>くじを引くにはログインしてください</p>
                <button onClick={() => navigate('/')} className="back-button">
                    トップページへ
                </button>
            </div>
        );
    }

    return (
        <div className="draw-lottery">
            <header className="draw-header">
                <button onClick={() => navigate('/')} className="back-link">
                    ← トップへ
                </button>
            </header>

            <DrawArea lotteryId={lotteryId} />
        </div>
    );
};

export default DrawLottery;
