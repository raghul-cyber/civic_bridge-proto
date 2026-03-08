import asyncio
import random

# Mapping realistic data to Top Indian Cities
CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Surat"]

async def simulate_delay():
    await asyncio.sleep(0.3)

async def fetch_weather_india(city: str) -> dict:
    await simulate_delay()
    base_temp = 32 if city.lower() in ['chennai', 'mumbai'] else 28
    return {
        'temp_c': base_temp + random.randint(-4, 6),
        'humidity': random.randint(50, 90),
        'description': random.choice(['Clear', 'Partly Cloudy', 'Humid', 'Light Rain']),
        'wind_kmph': random.randint(5, 25),
    }

async def fetch_aqi_india(city: str) -> dict:
    await simulate_delay()
    aqi = random.randint(50, 150)
    if 'delhi' in city.lower(): aqi = random.randint(250, 450)
    if 'mumbai' in city.lower(): aqi = random.randint(100, 200)
    return {'pm25_value': aqi, 'unit': 'µg/m³'}

async def fetch_census_india(city: str) -> dict:
    await simulate_delay()
    pop_map = {
        'mumbai': 21293000, 'delhi': 32941000, 'bangalore': 13707000,
        'chennai': 11776000, 'kolkata': 15333000, 'hyderabad': 10801000
    }
    c = city.lower()
    for k, v in pop_map.items():
        if k in c: return {'population': v, 'growth_rate': '+1.5%'}
    return {'population': random.randint(2000000, 8000000), 'growth_rate': '+2.1%'}

async def fetch_budget_india(city: str) -> dict:
    await simulate_delay()
    budget_map = {
        'mumbai': {'body': 'BMC', 'budget_cr': 59954},
        'delhi': {'body': 'NDMC/MCD', 'budget_cr': 16683},
        'bangalore': {'body': 'BBMP', 'budget_cr': 12369},
        'chennai': {'body': 'GCC', 'budget_cr': 8780}
    }
    for k, v in budget_map.items():
        if k in city.lower(): return v
    return {'body': f'{city.title()} Municipal Corporation', 'budget_cr': random.randint(2000, 8000)}

async def fetch_traffic_india(city: str) -> dict:
    await simulate_delay()
    return {
        'congestion_level': random.randint(40, 85),
        'avg_speed_kmph': random.randint(12, 35),
        'bottlenecks': random.randint(5, 25)
    }

async def fetch_water_india(city: str) -> dict:
    await simulate_delay()
    return {
        'supply_mld': random.randint(800, 4000),
        'deficit_percent': random.randint(5, 25),
        'quality_index': random.randint(70, 95)
    }

async def fetch_transport_india(city: str) -> dict:
    await simulate_delay()
    return {
        'active_buses': random.randint(1500, 8000),
        'metro_ridership_lakhs': random.randint(2, 60),
        'ev_adoption_rate': f"{random.randint(2, 12)}%"
    }

async def fetch_literacy_india(state_or_city: str) -> dict:
    await simulate_delay()
    rate = 88.0
    if 'kerala' in state_or_city.lower(): rate = 96.2
    if 'bihar' in state_or_city.lower(): rate = 63.8
    return {'literacy_rate': rate + round(random.uniform(-5, 5), 1)}

async def fetch_health_india(city: str) -> dict:
    await simulate_delay()
    return {
        'govt_hospitals': random.randint(15, 60),
        'beds_per_1000': round(random.uniform(0.5, 2.5), 2),
        'mohalla_clinics': random.randint(50, 500) if 'delhi' in city.lower() else 0
    }

async def fetch_crime_india(city: str) -> dict:
    await simulate_delay()
    return {
        'safety_index': random.randint(50, 85),
        'cctv_coverage': f"{random.randint(40, 90)}%",
        'major_crimes_reduced': f"{random.randint(5, 20)}%"
    }

async def fetch_electricity_india(city: str) -> dict:
    await simulate_delay()
    return {
        'peak_demand_mw': random.randint(2000, 8000),
        'renewables_share': f"{random.randint(10, 35)}%",
        'avg_power_cut_mins': random.randint(0, 120)
    }

async def fetch_waste_india(city: str) -> dict:
    await simulate_delay()
    return {
        'waste_generated_tpd': random.randint(3000, 11000),
        'processing_efficiency': f"{random.randint(40, 85)}%",
        'landfill_capacity_remaining': f"{random.randint(2, 10)} years"
    }

async def fetch_infrastructure_india(city: str) -> dict:
    await simulate_delay()
    return {
        'potholes_reported': random.randint(2000, 15000),
        'potholes_repaired': random.randint(1000, 12000),
        'new_road_projects': random.randint(5, 20)
    }

async def fetch_internet_india(city: str) -> dict:
    await simulate_delay()
    return {
        'broadband_speed_mbps': random.randint(40, 150),
        '5g_coverage': f"{random.randint(60, 95)}%",
        'active_users_millions': round(random.uniform(2.0, 15.0), 1)
    }

async def fetch_housing_india(city: str) -> dict:
    await simulate_delay()
    return {
        'avg_rent_1bhk': random.randint(12000, 45000),
        'affordable_projects_active': random.randint(10, 50),
        'slum_rehab_ongoing': random.randint(5, 30)
    }

async def fetch_employment_india(city: str) -> dict:
    await simulate_delay()
    return {
        'unemployment_rate': f"{round(random.uniform(4.0, 9.0), 1)}%",
        'formal_jobs_created': random.randint(10000, 50000),
        'tech_sector_share': f"{random.randint(15, 60)}%" if 'bangalore' in city.lower() or 'hyderabad' in city.lower() else f"{random.randint(5, 20)}%"
    }

async def fetch_green_india(city: str) -> dict:
    await simulate_delay()
    return {
        'green_cover_sqkm': random.randint(50, 300),
        'trees_planted_ytd': random.randint(50000, 500000),
        'public_parks': random.randint(100, 1000)
    }

async def fetch_women_safety_india(city: str) -> dict:
    await simulate_delay()
    return {
        'pink_police_patrols': random.randint(20, 100),
        'helpline_response_time': f"{random.randint(2, 8)} mins",
        'safe_city_budget_cr': random.randint(50, 250)
    }

async def fetch_disaster_india(city: str) -> dict:
    await simulate_delay()
    risk = "High Waterlogging" if city.lower() in ['mumbai', 'chennai'] else "Heatwave" if 'delhi' in city.lower() else "Moderate"
    return {
        'primary_risk': risk,
        'evacuation_shelters': random.randint(50, 300),
        'early_warning_systems_active': True
    }

async def fetch_resolution_india(city: str) -> dict:
    await simulate_delay()
    return {
        'total_complaints_ytd': random.randint(100000, 500000),
        'resolved_percent': f"{random.randint(65, 92)}%",
        'avg_sla_days': random.randint(3, 15)
    }
