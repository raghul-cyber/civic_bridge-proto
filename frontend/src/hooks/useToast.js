import { useState, useCallback } from 'react';

const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(({ title, message, type = 'info' }) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, title, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    return { toasts, showToast, removeToast };
};

export default useToast;
