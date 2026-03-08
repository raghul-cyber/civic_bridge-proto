export const CATEGORIES = [
    { id: 'pothole', name: 'Pothole', icon: 'Construction' },
    { id: 'streetlight', name: 'Streetlight', icon: 'Lightbulb' },
    { id: 'flooding', name: 'Flooding', icon: 'Droplets' },
    { id: 'graffiti', name: 'Graffiti', icon: 'Palette' },
    { id: 'garbage', name: 'Garbage', icon: 'Trash2' },
    { id: 'water_main', name: 'Water Main', icon: 'Waves' },
    { id: 'tree_trimming', name: 'Tree Trimming', icon: 'Trees' },
    { id: 'abandoned_vehicle', name: 'Abandoned Vehicle', icon: 'Car' },
    { id: 'noise_complaint', name: 'Noise Complaint', icon: 'Volume2' },
];

export const LANGUAGES = [
    { code: 'EN', name: 'English' },
    { code: 'HI', name: 'Hindi' },
    { code: 'TA', name: 'Tamil' },
    { code: 'TE', name: 'Telugu' },
    { code: 'BN', name: 'Bengali' },
];

export const PRIORITIES = [
    { id: 'critical', name: 'Critical', color: 'var(--accent-red)' },
    { id: 'high', name: 'High', color: 'var(--accent-gold)' },
    { id: 'medium', name: 'Medium', color: 'var(--accent-cyan)' },
    { id: 'low', name: 'Low', color: 'var(--text-muted)' },
];

export const WARDS = [
    "Ward 1 (Rogers Park)", "Ward 2 (Near North Side)", "Ward 3 (Douglas)",
    "Ward 4 (Kenwood)", "Ward 10 (East Side)", "Ward 19 (Beverly)",
    "Ward 27 (Near West Side)", "Ward 32 (Lakeview)", "Ward 42 (Downtown)",
    "Ward 47 (North Center)", "Ward 48 (Edgewater)"
];

export const STATUS_OPTIONS = [
    { id: 'OPEN', name: 'Open', color: 'var(--accent-red)' },
    { id: 'IN_PROGRESS', name: 'In Progress', color: 'var(--accent-gold)' },
    { id: 'RESOLVED', name: 'Resolved', color: 'var(--accent-green)' },
];
