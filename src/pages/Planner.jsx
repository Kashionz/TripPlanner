import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Calendar,
    MapPin,
    Trash2,
    Edit2,
    GripVertical,
    Share2,
    Clock,
    Car,
} from 'lucide-react';
import {
    getTrips,
    createTrip,
    deleteTrip,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    reorderAttractions,
} from '../services/tripService';
import LoadingSpinner from '../components/LoadingSpinner';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Planner() {
    const { currentUser } = useAuth();
    const { toasts, addToast, removeToast } = useToast();
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNewTripDialog, setShowNewTripDialog] = useState(false);
    const [showNewAttractionDialog, setShowNewAttractionDialog] = useState(false);
    const [editingAttraction, setEditingAttraction] = useState(null);

    // 新行程表單
    const [newTrip, setNewTrip] = useState({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
    });

    // 新景點表單
    const [newAttraction, setNewAttraction] = useState({
        name: '',
        time: '',
        transportation: '步行',
        notes: '',
    });

    // 載入行程
    useEffect(() => {
        if (currentUser) {
            loadTrips();
        }
    }, [currentUser]);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const userTrips = await getTrips(currentUser.uid);
            setTrips(userTrips);
        } catch (error) {
            addToast('載入行程失敗', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 建立新行程
    const handleCreateTrip = async (e) => {
        e.preventDefault();
        if (!newTrip.title || !newTrip.destination) {
            addToast('請填寫行程名稱和目的地', 'error');
            return;
        }

        try {
            const tripId = await createTrip(currentUser.uid, newTrip);
            addToast('行程建立成功', 'success');
            setShowNewTripDialog(false);
            setNewTrip({ title: '', destination: '', startDate: '', endDate: '' });
            await loadTrips();

            // 自動選擇新建立的行程
            const trip = trips.find(t => t.id === tripId);
            if (trip) setSelectedTrip(trip);
        } catch (error) {
            addToast('建立行程失敗', 'error');
        }
    };

    // 刪除行程
    const handleDeleteTrip = async (tripId) => {
        if (!confirm('確定要刪除這個行程嗎？')) return;

        try {
            await deleteTrip(tripId);
            addToast('行程已刪除', 'success');
            if (selectedTrip?.id === tripId) {
                setSelectedTrip(null);
            }
            await loadTrips();
        } catch (error) {
            addToast('刪除行程失敗', 'error');
        }
    };

    // 新增景點
    const handleAddAttraction = async (e) => {
        e.preventDefault();
        if (!newAttraction.name) {
            addToast('請輸入景點名稱', 'error');
            return;
        }

        try {
            await addAttraction(selectedTrip.id, newAttraction);
            addToast('景點已新增', 'success');
            setShowNewAttractionDialog(false);
            setNewAttraction({ name: '', time: '', transportation: '步行', notes: '' });
            await loadTrips();

            // 更新選中的行程
            const updatedTrips = await getTrips(currentUser.uid);
            const updatedTrip = updatedTrips.find(t => t.id === selectedTrip.id);
            setSelectedTrip(updatedTrip);
        } catch (error) {
            addToast('新增景點失敗', 'error');
        }
    };

    // 更新景點
    const handleUpdateAttraction = async (e) => {
        e.preventDefault();
        if (!editingAttraction.name) {
            addToast('請輸入景點名稱', 'error');
            return;
        }

        try {
            await updateAttraction(selectedTrip.id, editingAttraction.id, editingAttraction);
            addToast('景點已更新', 'success');
            setEditingAttraction(null);

            const updatedTrips = await getTrips(currentUser.uid);
            const updatedTrip = updatedTrips.find(t => t.id === selectedTrip.id);
            setSelectedTrip(updatedTrip);
        } catch (error) {
            addToast('更新景點失敗', 'error');
        }
    };

    // 刪除景點
    const handleDeleteAttraction = async (attractionId) => {
        if (!confirm('確定要刪除這個景點嗎？')) return;

        try {
            await deleteAttraction(selectedTrip.id, attractionId);
            addToast('景點已刪除', 'success');

            const updatedTrips = await getTrips(currentUser.uid);
            const updatedTrip = updatedTrips.find(t => t.id === selectedTrip.id);
            setSelectedTrip(updatedTrip);
        } catch (error) {
            addToast('刪除景點失敗', 'error');
        }
    };

    const transportationIcons = {
        '步行': '🚶',
        '開車': '🚗',
        '大眾運輸': '🚇',
        '計程車': '🚕',
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="min-h-screen bg-background">
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!selectedTrip ? (
                    // 行程列表視圖
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-light text-primary">我的行程</h1>
                            <button
                                onClick={() => setShowNewTripDialog(true)}
                                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                <span>建立行程</span>
                            </button>
                        </div>

                        {trips.length === 0 ? (
                            <div className="text-center py-12">
                                <MapPin className="w-16 h-16 mx-auto text-text/30 mb-4" />
                                <p className="text-text/50 mb-4">還沒有任何行程</p>
                                <button
                                    onClick={() => setShowNewTripDialog(true)}
                                    className="text-primary hover:underline"
                                >
                                    建立你的第一個行程
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trips.map((trip) => (
                                    <motion.div
                                        key={trip.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => setSelectedTrip(trip)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-light text-primary">{trip.title}</h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTrip(trip.id);
                                                }}
                                                className="text-text/50 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2 text-sm text-text/70">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{trip.destination}</span>
                                            </div>
                                            {trip.startDate && (
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{trip.startDate}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-2">
                                                <span className="text-primary font-medium">
                                                    {trip.attractions?.length || 0} 個景點
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // 行程詳情視圖
                    <div>
                        <div className="mb-6">
                            <button
                                onClick={() => setSelectedTrip(null)}
                                className="text-text/70 hover:text-primary mb-4 flex items-center space-x-2"
                            >
                                <span>← 返回行程列表</span>
                            </button>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-light text-primary mb-2">{selectedTrip.title}</h1>
                                    <div className="flex items-center space-x-4 text-text/70">
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{selectedTrip.destination}</span>
                                        </div>
                                        {selectedTrip.startDate && (
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{selectedTrip.startDate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNewAttractionDialog(true)}
                                    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>新增景點</span>
                                </button>
                            </div>
                        </div>

                        {/* 景點列表 */}
                        <div className="space-y-4">
                            {!selectedTrip.attractions || selectedTrip.attractions.length === 0 ? (
                                <div className="text-center py-12 bg-surface rounded-2xl border border-gray-100">
                                    <MapPin className="w-16 h-16 mx-auto text-text/30 mb-4" />
                                    <p className="text-text/50 mb-4">還沒有新增任何景點</p>
                                    <button
                                        onClick={() => setShowNewAttractionDialog(true)}
                                        className="text-primary hover:underline"
                                    >
                                        新增第一個景點
                                    </button>
                                </div>
                            ) : (
                                selectedTrip.attractions
                                    .sort((a, b) => a.order - b.order)
                                    .map((attraction, index) => (
                                        <motion.div
                                            key={attraction.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                        >
                                            {editingAttraction?.id === attraction.id ? (
                                                // 編輯模式
                                                <form onSubmit={handleUpdateAttraction} className="space-y-4">
                                                    <input
                                                        type="text"
                                                        value={editingAttraction.name}
                                                        onChange={(e) => setEditingAttraction({ ...editingAttraction, name: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        placeholder="景點名稱"
                                                        required
                                                    />
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <input
                                                            type="time"
                                                            value={editingAttraction.time}
                                                            onChange={(e) => setEditingAttraction({ ...editingAttraction, time: e.target.value })}
                                                            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        />
                                                        <select
                                                            value={editingAttraction.transportation}
                                                            onChange={(e) => setEditingAttraction({ ...editingAttraction, transportation: e.target.value })}
                                                            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        >
                                                            <option value="步行">🚶 步行</option>
                                                            <option value="開車">🚗 開車</option>
                                                            <option value="大眾運輸">🚇 大眾運輸</option>
                                                            <option value="計程車">🚕 計程車</option>
                                                        </select>
                                                    </div>
                                                    <textarea
                                                        value={editingAttraction.notes}
                                                        onChange={(e) => setEditingAttraction({ ...editingAttraction, notes: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        placeholder="備註"
                                                        rows={2}
                                                    />
                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="submit"
                                                            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                                        >
                                                            儲存
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingAttraction(null)}
                                                            className="flex-1 bg-gray-200 text-text px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                                        >
                                                            取消
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                // 顯示模式
                                                <div className="flex items-start space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-medium text-primary mb-2">{attraction.name}</h3>
                                                        <div className="space-y-1 text-sm text-text/70">
                                                            {attraction.time && (
                                                                <div className="flex items-center space-x-2">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>{attraction.time}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center space-x-2">
                                                                <Car className="w-4 h-4" />
                                                                <span>{transportationIcons[attraction.transportation]} {attraction.transportation}</span>
                                                            </div>
                                                            {attraction.notes && (
                                                                <p className="text-text/60 mt-2">{attraction.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setEditingAttraction(attraction)}
                                                            className="p-2 text-text/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAttraction(attraction.id)}
                                                            className="p-2 text-text/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 新增行程對話框 */}
            <AnimatePresence>
                {showNewTripDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl"
                        >
                            <h2 className="text-2xl font-light text-primary mb-4">建立新行程</h2>
                            <form onSubmit={handleCreateTrip} className="space-y-4">
                                <input
                                    type="text"
                                    value={newTrip.title}
                                    onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="行程名稱 *"
                                    required
                                />
                                <input
                                    type="text"
                                    value={newTrip.destination}
                                    onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="目的地 *"
                                    required
                                />
                                <input
                                    type="date"
                                    value={newTrip.startDate}
                                    onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="開始日期"
                                />
                                <input
                                    type="date"
                                    value={newTrip.endDate}
                                    onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="結束日期"
                                />
                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        建立
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTripDialog(false)}
                                        className="flex-1 bg-gray-200 text-text px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        取消
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 新增景點對話框 */}
            <AnimatePresence>
                {showNewAttractionDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-xl"
                        >
                            <h2 className="text-2xl font-light text-primary mb-4">新增景點</h2>
                            <form onSubmit={handleAddAttraction} className="space-y-4">
                                <input
                                    type="text"
                                    value={newAttraction.name}
                                    onChange={(e) => setNewAttraction({ ...newAttraction, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="景點名稱 *"
                                    required
                                />
                                <input
                                    type="time"
                                    value={newAttraction.time}
                                    onChange={(e) => setNewAttraction({ ...newAttraction, time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="時間"
                                />
                                <select
                                    value={newAttraction.transportation}
                                    onChange={(e) => setNewAttraction({ ...newAttraction, transportation: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="步行">🚶 步行</option>
                                    <option value="開車">🚗 開車</option>
                                    <option value="大眾運輸">🚇 大眾運輸</option>
                                    <option value="計程車">🚕 計程車</option>
                                </select>
                                <textarea
                                    value={newAttraction.notes}
                                    onChange={(e) => setNewAttraction({ ...newAttraction, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="備註"
                                    rows={3}
                                />
                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        新增
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewAttractionDialog(false)}
                                        className="flex-1 bg-gray-200 text-text px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        取消
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
