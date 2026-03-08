export const mockIssues = [
    {
        id: 'CB-2024-001',
        title: 'Major Pothole on N Michigan Ave',
        description: 'Large pothole causing traffic slowdowns and potential vehicle damage near the intersection of N Michigan Ave and E Delaware Pl.',
        category: 'pothole',
        priority: 'critical',
        status: 'OPEN',
        location: { lat: 41.8988, lng: -87.6243 },
        ward: 'Ward 42 (Downtown)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        upvotes: 24,
        reporter: 'Citizen Unit 402'
    },
    {
        id: 'CB-2024-002',
        title: 'Streetlight Out in Rogers Park',
        description: 'Three consecutive streetlights are out on W Lunt Ave between N Ashland Ave and N Paulina St. The area is very dark at night.',
        category: 'streetlight',
        priority: 'high',
        status: 'IN_PROGRESS',
        location: { lat: 42.0085, lng: -87.6695 },
        ward: 'Ward 49 (Rogers Park)',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        upvotes: 12,
        reporter: 'Safety First'
    },
    {
        id: 'CB-2024-003',
        title: 'Basement Flooding Risk after Heavy Rain',
        description: 'Significant water accumulation in the alleyway behind S Drexel Ave. Drainage seems to be blocked by debris.',
        category: 'flooding',
        priority: 'critical',
        status: 'OPEN',
        location: { lat: 41.8015, lng: -87.6030 },
        ward: 'Ward 4 (Kenwood)',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        upvotes: 45,
        reporter: 'Homeowner'
    },
    {
        id: 'CB-2024-004',
        title: 'Graffiti on Historical Landmark',
        description: 'Extensive graffiti on the side of the historical building on W North Ave. Needs sensitive removal.',
        category: 'graffiti',
        priority: 'medium',
        status: 'RESOLVED',
        location: { lat: 41.9105, lng: -87.6775 },
        ward: 'Ward 32 (Lakeview)',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        upvotes: 8,
        reporter: 'Art Lover'
    },
    {
        id: 'CB-2024-005',
        title: 'Abandoned Vehicle Blocking Hydrant',
        description: 'A blue sedan with no plates has been parked in front of a fire hydrant for over a week.',
        category: 'abandoned_vehicle',
        priority: 'high',
        status: 'OPEN',
        location: { lat: 41.8525, lng: -87.6450 },
        ward: 'Ward 25 (Pilsen)',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        upvotes: 15,
        reporter: 'Concerned Neighbor'
    },
    {
        id: 'CB-2024-006',
        title: 'Excessive Construction Noise at Night',
        description: 'Construction crew working past 11 PM on the new development at W Washington Blvd.',
        category: 'noise_complaint',
        priority: 'low',
        status: 'OPEN',
        location: { lat: 41.8833, lng: -87.6472 },
        ward: 'Ward 27 (Near West Side)',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        upvotes: 6,
        reporter: 'Sleepless'
    }
];

export const mockStats = {
    totalIssues: 47293,
    openIssues: 12847,
    resolvedIssues: 32446,
    resolutionRate: 89,
    avgResponseTime: 3.2,
    activeWards: 48
};

export const mockDatasets = {
    airQuality: {
        aqi: 42,
        status: 'Good',
        trend: [35, 38, 42, 45, 42, 40, 38, 35, 32, 35, 40, 42]
    },
    weather: {
        temp: 68,
        humidity: 45,
        condition: 'Partly Cloudy'
    }
};
