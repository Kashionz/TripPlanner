import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
    const { loginWithGoogle, loginAnonymously } = useAuth();
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleGoogleLogin() {
        try {
            setError('');
            await loginWithGoogle();
            navigate('/planner');
        } catch (err) {
            setError('Google 登入失敗: ' + err.message);
        }
    }

    async function handleAnonymousLogin() {
        try {
            setError('');
            await loginAnonymously();
            navigate('/planner');
        } catch (err) {
            setError('訪客登入失敗: ' + err.message);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-surface p-8 rounded-2xl shadow-sm max-w-md w-full border border-gray-100"
            >
                <h2 className="text-3xl font-light text-primary mb-6 text-center tracking-wide">旅遊規劃</h2>
                <p className="text-text/70 text-center mb-8 text-sm">輕鬆規劃你的旅程</p>

                {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white border border-gray-200 text-text py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-2 shadow-sm"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        使用 Google 登入
                    </button>

                    <button
                        onClick={handleAnonymousLogin}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition duration-200 shadow-sm"
                    >
                        訪客登入
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
