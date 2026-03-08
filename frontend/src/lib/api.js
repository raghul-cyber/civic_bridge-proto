import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('civicbridge_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Handle global errors (e.g. 401 Unauthorized)
        if (error.response?.status === 401) {
            localStorage.removeItem('civicbridge_token');
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
