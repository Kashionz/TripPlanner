import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const TRIPS_COLLECTION = 'trips';

// 建立新行程
export async function createTrip(userId, tripData) {
    try {
        const tripRef = await addDoc(collection(db, TRIPS_COLLECTION), {
            userId,
            title: tripData.title,
            destination: tripData.destination,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            attractions: [],
            sharedWith: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return tripRef.id;
    } catch (error) {
        console.error('建立行程失敗:', error);
        throw error;
    }
}

// 取得使用者的所有行程（包含分享的）
export async function getTrips(userId) {
    try {
        // 取得使用者建立的行程 - 移除 orderBy 以避免需要建立索引
        const ownTripsQuery = query(
            collection(db, TRIPS_COLLECTION),
            where('userId', '==', userId)
        );
        const ownTripsSnapshot = await getDocs(ownTripsQuery);
        const ownTrips = ownTripsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isOwner: true,
        }));

        // 取得分享給使用者的行程
        // Note: Firebase doesn't support array-contains with object, so we'll filter client-side
        const allTripsSnapshot = await getDocs(collection(db, TRIPS_COLLECTION));
        const sharedTrips = allTripsSnapshot.docs
            .filter(doc => {
                const data = doc.data();
                // 排除自己建立的行程，只保留分享給自己的
                return doc.data().userId !== userId &&
                    data.sharedWith?.some(share => share.userId === userId);
            })
            .map(doc => {
                const data = doc.data();
                const shareInfo = data.sharedWith.find(share => share.userId === userId);
                return {
                    id: doc.id,
                    ...data,
                    isOwner: false,
                    permission: shareInfo?.permission || 'view',
                };
            });

        // 合併並在客戶端排序（按 updatedAt 降序）
        const allTrips = [...ownTrips, ...sharedTrips];
        allTrips.sort((a, b) => {
            const timeA = a.updatedAt?.toMillis?.() || 0;
            const timeB = b.updatedAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        return allTrips;
    } catch (error) {
        console.error('取得行程失敗:', error);
        throw error;
    }
}

// 取得單一行程
export async function getTrip(tripId) {
    try {
        const tripDoc = await getDoc(doc(db, TRIPS_COLLECTION, tripId));
        if (tripDoc.exists()) {
            return { id: tripDoc.id, ...tripDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('取得行程失敗:', error);
        throw error;
    }
}

// 更新行程
export async function updateTrip(tripId, updates) {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        await updateDoc(tripRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('更新行程失敗:', error);
        throw error;
    }
}

// 刪除行程
export async function deleteTrip(tripId) {
    try {
        await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    } catch (error) {
        console.error('刪除行程失敗:', error);
        throw error;
    }
}

// 新增景點
export async function addAttraction(tripId, attraction) {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        const tripDoc = await getDoc(tripRef);

        if (!tripDoc.exists()) {
            throw new Error('行程不存在');
        }

        const currentAttractions = tripDoc.data().attractions || [];
        const newAttraction = {
            id: Date.now().toString(),
            ...attraction,
            order: currentAttractions.length,
        };

        await updateDoc(tripRef, {
            attractions: arrayUnion(newAttraction),
            updatedAt: serverTimestamp(),
        });

        return newAttraction;
    } catch (error) {
        console.error('新增景點失敗:', error);
        throw error;
    }
}

// 更新景點
export async function updateAttraction(tripId, attractionId, updates) {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        const tripDoc = await getDoc(tripRef);

        if (!tripDoc.exists()) {
            throw new Error('行程不存在');
        }

        const attractions = tripDoc.data().attractions || [];
        const updatedAttractions = attractions.map(attr =>
            attr.id === attractionId ? { ...attr, ...updates } : attr
        );

        await updateDoc(tripRef, {
            attractions: updatedAttractions,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('更新景點失敗:', error);
        throw error;
    }
}

// 刪除景點
export async function deleteAttraction(tripId, attractionId) {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        const tripDoc = await getDoc(tripRef);

        if (!tripDoc.exists()) {
            throw new Error('行程不存在');
        }

        const attractions = tripDoc.data().attractions || [];
        const updatedAttractions = attractions.filter(attr => attr.id !== attractionId);

        await updateDoc(tripRef, {
            attractions: updatedAttractions,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('刪除景點失敗:', error);
        throw error;
    }
}

// 重新排序景點
export async function reorderAttractions(tripId, attractions) {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        const reorderedAttractions = attractions.map((attr, index) => ({
            ...attr,
            order: index,
        }));

        await updateDoc(tripRef, {
            attractions: reorderedAttractions,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('重新排序景點失敗:', error);
        throw error;
    }
}

// 分享行程
export async function shareTrip(tripId, shareData) {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        await updateDoc(tripRef, {
            sharedWith: arrayUnion(shareData),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('分享行程失敗:', error);
        throw error;
    }
}

// 移除分享
export async function removeShare(tripId, userId) {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        const tripDoc = await getDoc(tripRef);

        if (!tripDoc.exists()) {
            throw new Error('行程不存在');
        }

        const sharedWith = tripDoc.data().sharedWith || [];
        const updatedSharedWith = sharedWith.filter(share => share.userId !== userId);

        await updateDoc(tripRef, {
            sharedWith: updatedSharedWith,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('移除分享失敗:', error);
        throw error;
    }
}
