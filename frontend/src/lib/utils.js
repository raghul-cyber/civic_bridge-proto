import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function getPriorityColor(priority) {
    switch (priority?.toLowerCase()) {
        case 'critical': return 'var(--accent-red)';
        case 'high': return 'var(--accent-gold)';
        case 'medium': return 'var(--accent-cyan)';
        case 'low': return 'var(--text-muted)';
        default: return 'var(--text-muted)';
    }
}

export function getStatusColor(status) {
    switch (status?.toUpperCase()) {
        case 'OPEN': return 'var(--accent-red)';
        case 'IN_PROGRESS': return 'var(--accent-gold)';
        case 'RESOLVED': return 'var(--accent-green)';
        default: return 'var(--text-muted)';
    }
}
