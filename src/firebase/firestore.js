import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import { db, isDemoMode } from './config';

// コレクション名
const LOTTERIES_COLLECTION = 'lotteries';
const DRAWS_COLLECTION = 'draws';

/**
 * カード配列を生成（景品をシャッフルして配置）
 */
const generateCards = (totalCount, prizes) => {
    const cards = [];

    // 景品カードを追加
    prizes.forEach((prize, prizeIndex) => {
        for (let i = 0; i < prize.count; i++) {
            cards.push({
                type: 'prize',
                prizeIndex,
                prizeName: prize.name,
                drawn: false
            });
        }
    });

    // はずれカードを追加
    const loserCount = totalCount - cards.length;
    for (let i = 0; i < loserCount; i++) {
        cards.push({
            type: 'lose',
            drawn: false
        });
    }

    // シャッフル（Fisher-Yates）
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
};

/**
 * カードの残り状況を計算
 */
const calculateRemaining = (cards, prizes) => {
    const undrawnCards = cards.filter(c => !c.drawn);
    const remainingTotal = undrawnCards.length;

    // 景品ごとの残り枚数を計算
    const remainingPrizes = prizes.map((prize, index) => ({
        ...prize,
        remaining: undrawnCards.filter(c => c.type === 'prize' && c.prizeIndex === index).length
    }));

    const remainingWinners = undrawnCards.filter(c => c.type === 'prize').length;

    return { remainingTotal, remainingWinners, remainingPrizes };
};

// デモ用のくじデータ
let demoLotteries = [];

/**
 * 新しいくじを作成
 */
export const createLottery = async (lotteryData) => {
    const cards = generateCards(lotteryData.totalCount, lotteryData.prizes);
    const { remainingTotal, remainingWinners, remainingPrizes } = calculateRemaining(cards, lotteryData.prizes);

    if (isDemoMode) {
        const newId = `demo-lottery-${Date.now()}`;
        const newLottery = {
            id: newId,
            ...lotteryData,
            cards,
            remainingTotal,
            remainingWinners,
            remainingPrizes,
            createdAt: new Date(),
            status: 'active'
        };
        demoLotteries.unshift(newLottery);
        return newId;
    }

    try {
        const docRef = await addDoc(collection(db, LOTTERIES_COLLECTION), {
            ...lotteryData,
            cards,
            remainingTotal,
            remainingWinners,
            remainingPrizes,
            createdAt: serverTimestamp(),
            status: 'active'
        });
        return docRef.id;
    } catch (error) {
        console.error('くじ作成エラー:', error);
        throw error;
    }
};

/**
 * くじを取得
 */
export const getLottery = async (lotteryId) => {
    if (isDemoMode) {
        return demoLotteries.find(l => l.id === lotteryId) || null;
    }

    try {
        const docRef = doc(db, LOTTERIES_COLLECTION, lotteryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('くじ取得エラー:', error);
        throw error;
    }
};

/**
 * ユーザーが作成したくじ一覧を取得
 */
export const getLotteriesByCreator = async (userId) => {
    if (isDemoMode) {
        return demoLotteries.filter(l => l.creatorId === userId);
    }

    try {
        const q = query(
            collection(db, LOTTERIES_COLLECTION),
            where('creatorId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('くじ一覧取得エラー:', error);
        throw error;
    }
};

/**
 * アクティブなくじ一覧を取得
 */
export const getActiveLotteries = async () => {
    if (isDemoMode) {
        return demoLotteries.filter(l => l.status === 'active');
    }

    try {
        const q = query(
            collection(db, LOTTERIES_COLLECTION),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('アクティブくじ取得エラー:', error);
        throw error;
    }
};

/**
 * くじを引く（選択したカードのインデックスで結果を決定）
 */
export const drawLottery = async (lotteryId, userId, nickname, cardIndex) => {
    if (isDemoMode) {
        const lottery = demoLotteries.find(l => l.id === lotteryId);

        if (!lottery) {
            throw new Error('くじが見つかりません');
        }

        if (lottery.cards[cardIndex].drawn) {
            throw new Error('このカードは既に引かれています');
        }

        // カードを引いた状態に更新
        lottery.cards[cardIndex].drawn = true;
        lottery.cards[cardIndex].drawnBy = nickname;

        const card = lottery.cards[cardIndex];
        const isWinner = card.type === 'prize';

        // 残り枚数を更新
        const { remainingTotal, remainingWinners, remainingPrizes } = calculateRemaining(lottery.cards, lottery.prizes);
        lottery.remainingTotal = remainingTotal;
        lottery.remainingWinners = remainingWinners;
        lottery.remainingPrizes = remainingPrizes;

        if (remainingTotal <= 0) {
            lottery.status = 'completed';
        }

        return {
            result: isWinner ? 'win' : 'lose',
            prizeDescription: isWinner ? card.prizeName : null,
            prizeIndex: isWinner ? card.prizeIndex : null
        };
    }

    try {
        const lotteryRef = doc(db, LOTTERIES_COLLECTION, lotteryId);

        const result = await runTransaction(db, async (transaction) => {
            const lotteryDoc = await transaction.get(lotteryRef);

            if (!lotteryDoc.exists()) {
                throw new Error('くじが見つかりません');
            }

            const lottery = lotteryDoc.data();

            if (lottery.cards[cardIndex].drawn) {
                throw new Error('このカードは既に引かれています');
            }

            // カードを引いた状態に更新
            const updatedCards = [...lottery.cards];
            updatedCards[cardIndex] = { ...updatedCards[cardIndex], drawn: true };

            const card = lottery.cards[cardIndex];
            const isWinner = card.type === 'prize';

            // 残り枚数を計算
            const { remainingTotal, remainingWinners, remainingPrizes } = calculateRemaining(updatedCards, lottery.prizes);

            const updates = {
                cards: updatedCards,
                remainingTotal,
                remainingWinners,
                remainingPrizes
            };

            // くじが全てなくなったらステータスを完了に
            if (remainingTotal <= 0) {
                updates.status = 'completed';
            }

            transaction.update(lotteryRef, updates);

            // 引いた記録をサブコレクションに追加
            const drawRef = doc(collection(db, LOTTERIES_COLLECTION, lotteryId, DRAWS_COLLECTION));
            transaction.set(drawRef, {
                userId,
                nickname,
                cardIndex,
                result: isWinner ? 'win' : 'lose',
                prizeName: isWinner ? card.prizeName : null,
                drawnAt: serverTimestamp()
            });

            return {
                result: isWinner ? 'win' : 'lose',
                prizeDescription: isWinner ? card.prizeName : null,
                prizeIndex: isWinner ? card.prizeIndex : null
            };
        });

        return result;
    } catch (error) {
        console.error('くじ引きエラー:', error);
        throw error;
    }
};

/**
 * くじの引いた記録を取得
 */
export const getDrawHistory = async (lotteryId) => {
    if (isDemoMode) {
        const lottery = demoLotteries.find(l => l.id === lotteryId);
        if (!lottery) return [];

        return lottery.cards
            .map((card, index) => {
                if (!card.drawn) return null;
                return {
                    cardIndex: index,
                    result: card.type === 'prize' ? 'win' : 'lose',
                    prizeName: card.type === 'prize' ? card.prizeName : null,
                    nickname: card.drawnBy || '匿名'
                };
            })
            .filter(Boolean);
    }

    try {
        const q = query(
            collection(db, LOTTERIES_COLLECTION, lotteryId, DRAWS_COLLECTION),
            orderBy('drawnAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('履歴取得エラー:', error);
        throw error;
    }
};

/**
 * ユーザーが既にくじを引いたかチェック
 */
export const hasUserDrawn = async (lotteryId, userId) => {
    if (isDemoMode) {
        const lottery = demoLotteries.find(l => l.id === lotteryId);
        if (!lottery || !lottery.drawHistory) return false;
        return lottery.drawHistory.some(d => d.userId === userId);
    }

    try {
        const q = query(
            collection(db, LOTTERIES_COLLECTION, lotteryId, DRAWS_COLLECTION),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('引き済みチェックエラー:', error);
        throw error;
    }
};

/**
 * 終了したくじを削除（作成者のみ）
 */
export const deleteLottery = async (lotteryId, userId) => {
    if (isDemoMode) {
        const index = demoLotteries.findIndex(l => l.id === lotteryId);
        if (index === -1) {
            throw new Error('くじが見つかりません');
        }
        const lottery = demoLotteries[index];
        if (lottery.creatorId !== userId) {
            throw new Error('削除権限がありません');
        }
        if (lottery.status !== 'completed') {
            throw new Error('終了していないくじは削除できません');
        }
        demoLotteries.splice(index, 1);
        return true;
    }

    try {
        const lotteryRef = doc(db, LOTTERIES_COLLECTION, lotteryId);
        const lotteryDoc = await getDoc(lotteryRef);

        if (!lotteryDoc.exists()) {
            throw new Error('くじが見つかりません');
        }

        const lottery = lotteryDoc.data();

        if (lottery.creatorId !== userId) {
            throw new Error('削除権限がありません');
        }

        if (lottery.status !== 'completed') {
            throw new Error('終了していないくじは削除できません');
        }

        // drawsサブコレクションを削除
        const drawsSnapshot = await getDocs(
            collection(db, LOTTERIES_COLLECTION, lotteryId, DRAWS_COLLECTION)
        );
        const deletePromises = drawsSnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        // くじ本体を削除
        await deleteDoc(lotteryRef);

        return true;
    } catch (error) {
        console.error('くじ削除エラー:', error);
        throw error;
    }
};
