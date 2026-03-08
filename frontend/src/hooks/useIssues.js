import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { mockIssues } from '../data/mockData';

const useIssues = (filters = {}) => {
    const [issues, setIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const filterString = JSON.stringify(filters);

    const fetchIssues = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // Use mock data if VITE_DEMO_MODE is true
        if (import.meta.env.VITE_DEMO_MODE === 'true') {
            await new Promise(resolve => setTimeout(resolve, 400)); // Simulate lag

            let filtered = [...mockIssues];
            const activeFilters = JSON.parse(filterString);

            if (activeFilters.category) {
                filtered = filtered.filter(i => i.category === activeFilters.category);
            }
            if (activeFilters.priority) {
                filtered = filtered.filter(i => i.priority === activeFilters.priority);
            }
            if (activeFilters.query) {
                const q = activeFilters.query.toLowerCase();
                filtered = filtered.filter(i =>
                    i.title.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q)
                );
            }

            setIssues(filtered);
            setIsLoading(false);
            return;
        }

        try {
            const data = await api.get('/api/issues', { params: JSON.parse(filterString) });
            setIssues(data);
        } catch (err) {
            console.error('Fetch issues error:', err);
            setError(err.message || 'Failed to fetch issues');
        } finally {
            setIsLoading(false);
        }
    }, [filterString]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    return { issues, isLoading, error, refetch: fetchIssues };
};

export default useIssues;
