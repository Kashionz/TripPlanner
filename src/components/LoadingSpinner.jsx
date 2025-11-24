import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const spinner = (
        <motion.div
            className={`${sizeClasses[size]} border-3 border-primary/30 border-t-primary rounded-full`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <div className="text-center">
                    {spinner}
                    <p className="mt-4 text-text/70 font-light">載入中...</p>
                </div>
            </div>
        );
    }

    return spinner;
}
