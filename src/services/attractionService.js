import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const SAVED_ATTRACTIONS_COLLECTION = 'savedAttractions';

// 台灣熱門景點推薦資料
const recommendationsData = {
    '台北': [
        {
            id: 'taipei-1',
            name: '台北101',
            description: '台北地標性建築，擁有觀景台和購物中心',
            location: '信義區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
            rating: 4.5,
            tags: ['地標', '觀景', '購物'],
        },
        {
            id: 'taipei-2',
            name: '故宮博物院',
            description: '世界四大博物館之一，收藏豐富的中華文物',
            location: '士林區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400',
            rating: 4.7,
            tags: ['博物館', '文化', '歷史'],
        },
        {
            id: 'taipei-3',
            name: '西門町',
            description: '台北最熱鬧的商圈，年輕人的流行文化中心',
            location: '萬華區',
            category: '購物',
            imageUrl: 'https://images.unsplash.com/photo-1555217477-0ff5b8ab1566?w=400',
            rating: 4.3,
            tags: ['購物', '美食', '娛樂'],
        },
        {
            id: 'taipei-4',
            name: '士林夜市',
            description: '台北最著名的夜市，各種台灣小吃應有盡有',
            location: '士林區',
            category: '美食',
            imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            rating: 4.4,
            tags: ['夜市', '小吃', '美食'],
        },
        {
            id: 'taipei-5',
            name: '陽明山國家公園',
            description: '台北近郊的自然景觀，四季皆有不同美景',
            location: '北投區',
            category: '休閒',
            imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            rating: 4.6,
            tags: ['自然', '登山', '溫泉'],
        },
        {
            id: 'taipei-6',
            name: '龍山寺',
            description: '台北最古老的寺廟之一，香火鼎盛',
            location: '萬華區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400',
            rating: 4.5,
            tags: ['寺廟', '歷史', '文化'],
        },
    ],
    '台中': [
        {
            id: 'taichung-1',
            name: '逢甲夜市',
            description: '中台灣最大的夜市，創新美食的發源地',
            location: '西屯區',
            category: '美食',
            imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
            rating: 4.5,
            tags: ['夜市', '小吃', '創意美食'],
        },
        {
            id: 'taichung-2',
            name: '高美濕地',
            description: '台中著名的日落景點，生態豐富',
            location: '清水區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
            rating: 4.7,
            tags: ['夕陽', '濕地', '生態'],
        },
        {
            id: 'taichung-3',
            name: '彩虹眷村',
            description: '色彩繽紛的藝術村落，充滿童趣',
            location: '南屯區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400',
            rating: 4.4,
            tags: ['藝術', '彩繪', '拍照'],
        },
        {
            id: 'taichung-4',
            name: '勤美綠園道',
            description: '結合藝術、文創與自然的休閒區域',
            location: '西區',
            category: '休閒',
            imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
            rating: 4.3,
            tags: ['文創', '綠地', '購物'],
        },
        {
            id: 'taichung-5',
            name: '台中國家歌劇院',
            description: '世界級建築，獨特的曲牆設計',
            location: '西屯區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
            rating: 4.6,
            tags: ['建築', '藝術', '文化'],
        },
    ],
    '台南': [
        {
            id: 'tainan-1',
            name: '安平古堡',
            description: '台灣最古老的城堡，見證台灣歷史',
            location: '安平區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
            rating: 4.5,
            tags: ['古蹟', '歷史', '文化'],
        },
        {
            id: 'tainan-2',
            name: '赤崁樓',
            description: '台南著名古蹟，荷蘭時期建築',
            location: '中西區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
            rating: 4.4,
            tags: ['古蹟', '歷史', '建築'],
        },
        {
            id: 'tainan-3',
            name: '花園夜市',
            description: '台南最大的流動夜市，每週四、六、日營業',
            location: '北區',
            category: '美食',
            imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=400',
            rating: 4.6,
            tags: ['夜市', '小吃', '美食'],
        },
        {
            id: 'tainan-4',
            name: '神農街',
            description: '充滿古早味的老街，文青必訪',
            location: '中西區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=400',
            rating: 4.3,
            tags: ['老街', '文創', '拍照'],
        },
        {
            id: 'tainan-5',
            name: '奇美博物館',
            description: '台灣館藏最豐富的私人博物館',
            location: '仁德區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b64664a5?w=400',
            rating: 4.8,
            tags: ['博物館', '藝術', '文化'],
        },
    ],
    '高雄': [
        {
            id: 'kaohsiung-1',
            name: '駁二藝術特區',
            description: '舊倉庫改造的藝術園區，充滿創意',
            location: '鹽埕區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=400',
            rating: 4.6,
            tags: ['藝術', '文創', '拍照'],
        },
        {
            id: 'kaohsiung-2',
            name: '愛河',
            description: '高雄的母親河，夜晚燈光浪漫',
            location: '前金區',
            category: '休閒',
            imageUrl: 'https://images.unsplash.com/photo-1499159058454-75067059248a?w=400',
            rating: 4.4,
            tags: ['河濱', '夜景', '散步'],
        },
        {
            id: 'kaohsiung-3',
            name: '六合夜市',
            description: '高雄最著名的觀光夜市',
            location: '新興區',
            category: '美食',
            imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
            rating: 4.3,
            tags: ['夜市', '海鮮', '小吃'],
        },
        {
            id: 'kaohsiung-4',
            name: '旗津海岸公園',
            description: '欣賞海景、吃海鮮的好去處',
            location: '旗津區',
            category: '休閒',
            imageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
            rating: 4.5,
            tags: ['海灘', '海鮮', '自然'],
        },
        {
            id: 'kaohsiung-5',
            name: '美麗島站',
            description: '世界最美地鐵站之一，光之穹頂令人驚艷',
            location: '新興區',
            category: '景點',
            imageUrl: 'https://images.unsplash.com/photo-1502085671122-2d218cd434e6?w=400',
            rating: 4.7,
            tags: ['捷運站', '藝術', '拍照'],
        },
    ],
};

// 取得推薦景點
export function getRecommendations(location) {
    return recommendationsData[location] || [];
}

// 取得所有可選擇的地點
export function getAvailableLocations() {
    return Object.keys(recommendationsData);
}

// 儲存景點
export async function saveAttraction(userId, attraction) {
    try {
        const attractionRef = await addDoc(collection(db, SAVED_ATTRACTIONS_COLLECTION), {
            userId,
            ...attraction,
            savedAt: serverTimestamp(),
        });
        return attractionRef.id;
    } catch (error) {
        console.error('儲存景點失敗:', error);
        throw error;
    }
}

// 取得已儲存的景點
export async function getSavedAttractions(userId) {
    try {
        const q = query(
            collection(db, SAVED_ATTRACTIONS_COLLECTION),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error('取得已儲存景點失敗:', error);
        throw error;
    }
}

// 移除已儲存的景點
export async function removeSavedAttraction(attractionId) {
    try {
        await deleteDoc(doc(db, SAVED_ATTRACTIONS_COLLECTION, attractionId));
    } catch (error) {
        console.error('移除景點失敗:', error);
        throw error;
    }
}

// 檢查景點是否已儲存
export function isAttractionSaved(savedAttractions, attractionId) {
    return savedAttractions.some(attr => attr.id === attractionId || attr.name === attractionId);
}
