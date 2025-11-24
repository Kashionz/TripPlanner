import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Heart,
    Plus,
    Star,
    Bookmark,
    BookmarkCheck,
} from 'lucide-react';
import {
    getRecommendations,
    getAvailableLocations,
    saveAttraction,
    getSavedAttractions,
    removeSavedAttraction,
} from '../services/attractionService';
import { getTrips, addAttraction } from '../services/tripService';
import LoadingSpinner from '../components/LoadingSpinner';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Recommendations() {
    const { currentUser } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const [selectedLocation, setSelectedLocation] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [savedAttractions, setSavedAttractions] = useState([]);
    const [userTrips, setUserTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const [showAddToTripDialog, setShowAddToTripDialog] = useState(false);
    const [selectedAttraction, setSelectedAttraction] = useState(null);

    const locations = getAvailableLocations();
    const categories = ['全部', '景點', '美食', '購物', '休閒'];

    // 載入已儲存的景點和行程
    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser]);

    // 當選擇地點時載入推薦
    useEffect(() => {
        if (selectedLocation) {
            const recs = getRecommendations(selectedLocation);
            setRecommendations(recs);
        }
    }, [selectedLocation]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [saved, trips] = await Promise.all([
                getSavedAttractions(currentUser.uid),
                getTrips(currentUser.uid),
            ]);
            setSavedAttractions(saved);
            setUserTrips(trips);

            // 預設選擇第一個地點
            if (locations.length > 0 && !selectedLocation) {
                setSelectedLocation(locations[0]);
            }
        } catch (error) {
            addToast('載入資料失敗', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 檢查景點是否已儲存
    const isAttractionSaved = (attractionId) => {
        return savedAttractions.some(attr =>
            attr.id === attractionId || attr.name === attractionId
        );
    };

    // 儲存/取消儲存景點
    const handleToggleSave = async (attraction) => {
        const savedId = savedAttractions.find(attr => attr.name === attraction.id)?.id;

        if (savedId) {
            // 取消儲存
            try {
                await removeSavedAttraction(savedId);
                addToast('已從收藏移除', 'success');
                await loadData();
            } catch (error) {
                addToast('移除失敗', 'error');
            }
        } else {
            // 儲存
            try {
                await saveAttraction(currentUser.uid, {
                    name: attraction.id,
                    description: attraction.description,
                    location: selectedLocation,
                    category: attraction.category,
                    imageUrl: attraction.imageUrl,
                    rating: attraction.rating,
                    tags: attraction.tags,
                });
                addToast('已加入收藏', 'success');
                await loadData();
            } catch (error) {
                addToast('儲存失敗', 'error');
            }
        }
    };

    // 新增到行程
    const handleAddToTrip = async (tripId) => {
        if (!selectedAttraction) return;

        try {
            await addAttraction(tripId, {
                name: selectedAttraction.name,
                time: '',
                transportation: '步行',
                notes: selectedAttraction.description,
            });
            addToast('已新增到行程', 'success');
            setShowAddToTripDialog(false);
            setSelectedAttraction(null);
        } catch (error) {
            addToast('新增失敗', 'error');
        }
    };

    // 篩選推薦
    const filteredRecommendations = recommendations.filter(rec =>
        selectedCategory === '全部' || rec.category === selectedCategory
    );

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="min-h-screen bg-background">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 標題與地點選擇 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-primary mb-6">景點推薦</h1>

                    {/* 地點選擇 */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {locations.map((location) => (
                            <button
                                key={location}
                                onClick={() => setSelectedLocation(location)}
                                className={`px-6 py-2 rounded-full transition-all ${selectedLocation === location
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-surface text-text/70 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {location}
                            </button>
                        ))}
                    </div>

                    {/* 分類篩選 */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${selectedCategory === category
                                        ? 'bg-primary/10 text-primary border border-primary'
                                        : 'bg-surface text-text/70 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 推薦景點網格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {filteredRecommendations.map((attraction, index) => {
                        const isSaved = isAttractionSaved(attraction.id);
                        return (
                            <motion.div
                                key={attraction.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-surface rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                            >
                                {/* 景點圖片 */}
                                <div className="relative h-48 overflow-hidden bg-gray-200">
                                    <img
                                        src={attraction.imageUrl}
                                        alt={attraction.name}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                    />
                                    <button
                                        onClick={() => handleToggleSave(attraction)}
                                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${isSaved
                                                ? 'bg-primary text-white'
                                                : 'bg-white/80 text-text/70 hover:bg-white'
                                            }`}
                                    >
                                        {isSaved ? (
                                            <BookmarkCheck className="w-5 h-5" />
                                        ) : (
                                            <Bookmark className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                {/* 景點資訊 */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-primary mb-1">
                                                {attraction.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 text-sm text-text/60">
                                                <MapPin className="w-4 h-4" />
                                                <span>{attraction.location}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm font-medium text-yellow-700">
                                                {attraction.rating}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-text/70 mb-4 line-clamp-2">
                                        {attraction.description}
                                    </p>

                                    {/* 標籤 */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {attraction.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 bg-gray-100 text-text/60 text-xs rounded-md"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* 操作按鈕 */}
                                    <button
                                        onClick={() => {
                                            setSelectedAttraction(attraction);
                                            setShowAddToTripDialog(true);
                                        }}
                                        className="w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>加入行程</span>
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* 我的收藏 */}
                {savedAttractions.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-light text-primary mb-6">我的收藏</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedAttractions.map((attraction) => (
                                <motion.div
                                    key={attraction.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-primary mb-1">
                                                {attraction.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 text-sm text-text/60">
                                                <MapPin className="w-4 h-4" />
                                                <span>{attraction.location}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeSavedAttraction(attraction.id).then(() => {
                                                addToast('已從收藏移除', 'success');
                                                loadData();
                                            })}
                                            className="text-text/50 hover:text-red-500 transition-colors"
                                        >
                                            <BookmarkCheck className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <p className="text-sm text-text/70 mb-4 line-clamp-2">
                                        {attraction.description}
                                    </p>

                                    <button
                                        onClick={() => {
                                            setSelectedAttraction({
                                                name: attraction.name,
                                                description: attraction.description,
                                            });
                                            setShowAddToTripDialog(true);
                                        }}
                                        className="w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>加入行程</span>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 加入行程對話框 */}
            <AnimatePresence>
                {showAddToTripDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[80vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-light text-primary mb-4">
                                選擇行程
                            </h2>
                            <p className="text-sm text-text/70 mb-6">
                                將「{selectedAttraction?.name}」加入到：
                            </p>

                            {userTrips.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-text/50 mb-4">還沒有任何行程</p>
                                    <button
                                        onClick={() => {
                                            setShowAddToTripDialog(false);
                                            // 可以導航到 Planner 頁面
                                        }}
                                        className="text-primary hover:underline"
                                    >
                                        前往建立行程
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userTrips.map((trip) => (
                                        <button
                                            key={trip.id}
                                            onClick={() => handleAddToTrip(trip.id)}
                                            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-primary mb-1">
                                                        {trip.title}
                                                    </h3>
                                                    <div className="flex items-center space-x-2 text-sm text-text/60">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{trip.destination}</span>
                                                    </div>
                                                </div>
                                                <Plus className="w-5 h-5 text-primary" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setShowAddToTripDialog(false);
                                    setSelectedAttraction(null);
                                }}
                                className="w-full mt-4 bg-gray-200 text-text px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                取消
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
