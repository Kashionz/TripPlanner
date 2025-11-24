import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { MapPin, Compass, LogOut, Menu, X } from 'lucide-react';

export default function NavigationBar() {
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('登出失敗:', error);
        }
    };

    const navItems = [
        { path: '/planner', label: '行程規劃', icon: MapPin },
        { path: '/recommendations', label: '景點推薦', icon: Compass },
    ];

    return (
        <nav className="bg-surface border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/planner" className="flex items-center space-x-2">
                            <MapPin className="w-6 h-6 text-primary" />
                            <span className="text-xl font-light text-primary tracking-wide">
                                旅遊規劃
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="relative"
                                >
                                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isActive
                                            ? 'text-primary bg-primary/10'
                                            : 'text-text/70 hover:text-primary hover:bg-gray-50'
                                        }`}>
                                        <Icon className="w-5 h-5" />
                                        <span className="font-light">{item.label}</span>
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Info & Logout */}
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm text-text/70">
                                {currentUser?.isAnonymous
                                    ? '訪客'
                                    : currentUser?.displayName || currentUser?.email || '使用者'}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 text-text/70 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-light">登出</span>
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-text/70 hover:bg-gray-50"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="md:hidden border-t border-gray-200 bg-surface"
                >
                    <div className="px-4 py-3 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'text-primary bg-primary/10'
                                            : 'text-text/70 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="px-4 py-2 text-sm text-text/70">
                                {currentUser?.isAnonymous
                                    ? '訪客'
                                    : currentUser?.displayName || currentUser?.email || '使用者'}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-3 px-4 py-3 text-text/70 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>登出</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </nav>
    );
}
