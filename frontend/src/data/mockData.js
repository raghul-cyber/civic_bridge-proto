export const mockIssues = [
    {
        id: 'CB-2024-DEL-01', title: 'Severe Waterlogging at ITO Junction', description: 'Massive water accumulation under the ITO flyover after 30 mins of rain. Traffic is halted entirely.',
        category: 'flooding', priority: 'critical', status: 'OPEN', location: { lat: 28.6280, lng: 77.2432 }, ward: 'Zone Central (Delhi)',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), upvotes: 145, reporter: 'Ramesh Singh'
    },
    {
        id: 'CB-2024-MUM-02', title: 'Crater-sized Pothole on JVLR', description: 'Huge pothole near Powai signal on Jogeshwari-Vikhroli Link Road causing extreme danger to two-wheelers.',
        category: 'pothole', priority: 'critical', status: 'IN_PROGRESS', location: { lat: 19.1176, lng: 72.9060 }, ward: 'Ward K/East (Mumbai)',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), upvotes: 312, reporter: 'Siddharth M.'
    },
    {
        id: 'CB-2024-BLR-03', title: 'Overflowing Garbage Dump near Silk Board', description: 'Solid waste management has skipped collection for 4 days. Huge stench affecting nearby apartments.',
        category: 'garbage', priority: 'high', status: 'OPEN', location: { lat: 12.9176, lng: 77.6234 }, ward: 'BTM Layout (Bangalore)',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), upvotes: 89, reporter: 'Priya K.'
    },
    {
        id: 'CB-2024-DEL-04', title: 'Non-functional Streetlights in Dwarka Sec 12', description: 'Entire stretch of Road No. 201 is completely dark. High risk of accidents and petty crime.',
        category: 'streetlight', priority: 'high', status: 'RESOLVED', location: { lat: 28.5921, lng: 77.0460 }, ward: 'Najafgarh Zone (Delhi)',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), upvotes: 56, reporter: 'Amitabh S.'
    },
    {
        id: 'CB-2024-MUM-05', title: 'Abandoned Auto Rickshaw', description: 'Rusty auto rickshaw dumped on the sidewalk near Andheri Station West for 3 months.',
        category: 'abandoned_vehicle', priority: 'medium', status: 'OPEN', location: { lat: 19.1197, lng: 72.8468 }, ward: 'Ward K/West (Mumbai)',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), upvotes: 12, reporter: 'Kavita D.'
    },
    {
        id: 'CB-2024-BLR-06', title: 'Illegal Construction Encroaching Footpath', description: 'Shop owners extending their structures over the pedestrian walkway in Indiranagar 100ft road.',
        category: 'other', priority: 'high', status: 'OPEN', location: { lat: 12.9784, lng: 77.6408 }, ward: 'C.V. Raman Nagar (Bangalore)',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), upvotes: 67, reporter: 'Vikram R.'
    },
    {
        id: 'CB-2024-DEL-07', title: 'Open Manhole in Connaught Place', description: 'Deadly open sewer manhole near Block C. Completely unmarked.',
        category: 'pothole', priority: 'critical', status: 'IN_PROGRESS', location: { lat: 28.6315, lng: 77.2167 }, ward: 'NDMC (Delhi)',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), upvotes: 210, reporter: 'Neha P.'
    },
    {
        id: 'CB-2024-MUM-08', title: 'Contaminated Pipeline Water Supply', description: 'Murky brown water coming from BMC taps in Borivali West residential societies since morning.',
        category: 'water', priority: 'critical', status: 'OPEN', location: { lat: 19.2345, lng: 72.8410 }, ward: 'Ward R/Central (Mumbai)',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), upvotes: 430, reporter: 'Rajesh G.'
    },
    {
        id: 'CB-2024-BLR-09', title: 'Traffic Signal Malfunction at Marathahalli', description: 'All signals blinking yellow causing massive gridlock on the ORR.',
        category: 'traffic', priority: 'high', status: 'RESOLVED', location: { lat: 12.9569, lng: 77.7011 }, ward: 'Mahadevapura (Bangalore)',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), upvotes: 155, reporter: 'Techie B.'
    },
    {
        id: 'CB-2024-DEL-10', title: 'Smog and Illegal Wood Burning', description: 'Large scale wood and plastic burning by illegal scrapyard near Okhla Phase 2.',
        category: 'air_quality', priority: 'critical', status: 'OPEN', location: { lat: 28.5355, lng: 77.2844 }, ward: 'South Zone (Delhi)',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), upvotes: 289, reporter: 'Sanjay V.'
    },
    {
        id: 'CB-2024-MUM-11', title: 'Tree Fallen on Parked Cars during Cyclone', description: 'Huge banyan tree uprooted falling on three Honda Citys in Dadar Parsico colony.',
        category: 'disaster', priority: 'high', status: 'IN_PROGRESS', location: { lat: 19.0178, lng: 72.8478 }, ward: 'Ward G/North (Mumbai)',
        timestamp: new Date(Date.now() - 3600000 * 14).toISOString(), upvotes: 80, reporter: 'Cyrus M.'
    },
    {
        id: 'CB-2024-BLR-12', title: 'Stray Dog Menace in HSR Layout', description: 'Pack of aggressive strays chasing two-wheelers in Sector 2. Multiple minor accidents reported.',
        category: 'other', priority: 'medium', status: 'OPEN', location: { lat: 12.9081, lng: 77.6476 }, ward: 'Bommanahalli (Bangalore)',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), upvotes: 112, reporter: 'Deepa A.'
    },
    {
        id: 'CB-2024-DEL-13', title: 'Dengue Breeding Mosquitoes in Stagnant Pool', description: 'Unfinished DDA construction site has huge stagnant water pools. High dengue risk.',
        category: 'health', priority: 'high', status: 'OPEN', location: { lat: 28.7041, lng: 77.1025 }, ward: 'Rohini Zone (Delhi)',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(), upvotes: 198, reporter: 'Dr. Sharma'
    },
    {
        id: 'CB-2024-MUM-14', title: 'Broken Foot Overbridge Staircase', description: 'Steps collapsing at the Bandra East railway station FOB. Commuters at severe risk.',
        category: 'infrastructure', priority: 'critical', status: 'IN_PROGRESS', location: { lat: 19.0596, lng: 72.8400 }, ward: 'Ward H/East (Mumbai)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), upvotes: 560, reporter: 'Ajit K.'
    },
    {
        id: 'CB-2024-BLR-15', title: 'BESCOM Transformer Sparking Heavily', description: 'Transformer pole near Koramangala 4th Block is throwing massive sparks during rain.',
        category: 'electricity', priority: 'critical', status: 'RESOLVED', location: { lat: 12.9345, lng: 77.6266 }, ward: 'South Zone (Bangalore)',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), upvotes: 320, reporter: 'Vinay T.'
    },
    {
        id: 'CB-2024-DEL-16', title: 'Loud DJ Past Midnight in Saket', description: 'Illegal late night wedding procession playing massive subwoofers at 2 AM.',
        category: 'noise_complaint', priority: 'low', status: 'OPEN', location: { lat: 28.5246, lng: 77.2066 }, ward: 'South Zone (Delhi)',
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), upvotes: 24, reporter: 'Resident D04'
    },
    {
        id: 'CB-2024-MUM-17', title: 'Hazardous Construction Dust without Nets', description: 'Slum Rehab skyscraper construction dropping cement dust all over nearby school in Chembur.',
        category: 'air_quality', priority: 'high', status: 'OPEN', location: { lat: 19.0522, lng: 72.8981 }, ward: 'Ward M/West (Mumbai)',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), upvotes: 110, reporter: 'Principal Mrs. J'
    },
    {
        id: 'CB-2024-BLR-18', title: 'Dead Cow on Airport Road', description: 'Carcass lying in the left lane of Bellary road causing massive swerves and accidents.',
        category: 'garbage', priority: 'high', status: 'RESOLVED', location: { lat: 13.1166, lng: 77.5991 }, ward: 'Yelahanka (Bangalore)',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), upvotes: 75, reporter: 'Karan G.'
    },
    {
        id: 'CB-2024-DEL-19', title: 'DTC Bus Breakdown in Center Lane', description: 'Green low floor DTC bus broke down horizontally across Ring Road near AIIMS.',
        category: 'traffic', priority: 'critical', status: 'IN_PROGRESS', location: { lat: 28.5672, lng: 77.2100 }, ward: 'Central Zone (Delhi)',
        timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), upvotes: 540, reporter: 'Traffic Police'
    },
    {
        id: 'CB-2024-MUM-20', title: 'Illegal Sand Mining on Beach', description: 'Tractors taking away sand from Versova beach illegally at 4 AM.',
        category: 'crime', priority: 'high', status: 'OPEN', location: { lat: 19.1351, lng: 72.8146 }, ward: 'Ward K/West (Mumbai)',
        timestamp: new Date(Date.now() - 3600000 * 36).toISOString(), upvotes: 180, reporter: 'Afroz S.'
    }
];

export const mockStats = {
    totalIssues: 1248992,
    openIssues: 185340,
    resolvedIssues: 1063652,
    resolutionRate: 85,
    avgResponseTime: 4.5,
    activeWards: 124
};

export const mockDatasets = {
    airQuality: {
        aqi: 242,
        status: 'Poor',
        trend: [180, 210, 242, 280, 310, 250, 210, 190, 150, 220, 240, 255]
    },
    weather: {
        temp: 34,
        humidity: 80,
        condition: 'Monsoon Showers'
    }
};
