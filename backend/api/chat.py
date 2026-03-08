import os
import re
import boto3
from fastapi import APIRouter
from pydantic import BaseModel
from langdetect import detect
from .indian_datasets import *

router = APIRouter()

def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        if lang == 'hi': return 'hi-IN'
        if lang == 'ta': return 'ta-IN'
        if lang == 'te': return 'te-IN'
        if lang == 'bn': return 'bn-IN'
        return 'en-US'
    except:
        return 'en-US'

INTENT_PATTERNS = {
    'weather': [r'weather', r'temperature', r'rain', r'forecast', r'monsoon', r'mausam', r'barish', r'vanilam', r'mazhai'],
    'air_quality': [r'air quality', r'aqi', r'pollution', r'smog', r'vayu', r'pradushan', r'kaal nila'],
    'issues': [r'issue', r'complaint', r'report', r'problem', r'recent', r'samasya', r'shikayat', r'pirachanai'],
    'budget': [r'budget', r'spending', r'fund', r'allocation', r'bajat', r'paisa', r'bajett'],
    'census': [r'population', r'census', r'demographics', r'janganana', r'jansankhya', r'makkal thokai'],
    'traffic': [r'traffic', r'congestion', r'speed', r'bottleneck', r'jam', r'trafik', r'nerisal'],
    'water': [r'water', r'supply', r'shortage', r'jal', r'pani', r'thannir'],
    'transport': [r'transport', r'bus', r'metro', r'ev', r'parivahan', r'yatra', r'pokkuvarathu'],
    'literacy': [r'literacy', r'education', r'school', r'padhai', r'shiksha', r'kalvi'],
    'health': [r'health', r'hospital', r'clinic', r'bed', r'swasthya', r'aspatal', r'maruthuvamanai'],
    'crime': [r'crime', r'safety', r'cctv', r'police', r'suraksha', r'apradh', r'pathukappu'],
    'electricity': [r'electricity', r'power', r'cut', r'bijli', r'vidyut', r'minsaram'],
    'waste': [r'waste', r'garbage', r'trash', r'landfill', r'kachra', r'kuppai'],
    'infrastructure': [r'pothole', r'road', r'repair', r'highway', r'sadak', r'saalai'],
    'internet': [r'internet', r'broadband', r'5g', r'speed', r'network', r'valaiyalam'],
    'housing': [r'housing', r'rent', r'slum', r'affordable', r'makan', r'ghar', r'veedu'],
    'employment': [r'employment', r'unemployment', r'job', r'work', r'rozgar', r'velai'],
    'green': [r'green', r'park', r'tree', r'hara', r'ped', r'maram'],
    'women_safety': [r'women', r'pink', r'helpline', r'mahila', r'pengal'],
    'disaster': [r'disaster', r'flood', r'heatwave', r'warning', r'aapda', r'baadh', r'vellam'],
    'resolution': [r'resolved', r'sla', r'efficiency', r'nivaaran', r'theervu']
}

def classify_intent(text: str) -> str:
    text_lower = text.lower()
    scores = {intent: 0 for intent in INTENT_PATTERNS}
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                scores[intent] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else 'general'

async def fetch_recent_issues(limit: int = 5) -> list:
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('civic_issues')
        response = table.scan(
            FilterExpression='#s = :open',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':open': 'open'},
            Limit=limit
        )
        return response.get('Items', [])
    except:
        return []

class ChatRequest(BaseModel):
    message: str
    language: str = 'en-US'
    city: str = 'New Delhi'
    session_id: str = ''

class ChatResponse(BaseModel):
    reply: str
    detected_language: str
    intent: str
    data: dict
    speak: bool = True

@router.post('/api/chat', response_model=ChatResponse)
async def chat(req: ChatRequest):
    detected_lang = detect_language(req.message)
    intent = classify_intent(req.message)
    data = {}
    reply = ''
    city = req.city if req.city != 'Chicago' else 'New Delhi'

    if intent == 'weather':
        data = await fetch_weather_india(city)
        reply = f"Weather in {city}: {data['description']}, {data['temp_c']}°C. Humidity {data['humidity']}%. Wind {data['wind_kmph']} km/h."
    elif intent == 'air_quality':
        data = await fetch_aqi_india(city)
        reply = f"AQI in {city} is {data['pm25_value']} {data['unit']}. " + ("Poor air quality." if data['pm25_value'] > 100 else "Moderate air quality.")
    elif intent == 'issues':
        issues = await fetch_recent_issues(5)
        reply = f"There are {len(issues)} open issues in {city}. Most recent: " + ", ".join([i.get('title', '') for i in issues[:2]])
        data = {'issues': issues}
    elif intent == 'budget':
        data = await fetch_budget_india(city)
        reply = f"{data['body']} budget for {city} is ₹{data['budget_cr']} Crores."
    elif intent == 'census':
        data = await fetch_census_india(city)
        reply = f"Population of {city} is roughly {data['population']:,} growing at {data['growth_rate']}."
    elif intent == 'traffic':
        data = await fetch_traffic_india(city)
        reply = f"Traffic congestion in {city} is {data['congestion_level']}%. Avg speed is {data['avg_speed_kmph']} km/h."
    elif intent == 'water':
        data = await fetch_water_india(city)
        reply = f"Water supply is {data['supply_mld']} MLD with a {data['deficit_percent']}% deficit. Quality index: {data['quality_index']}/100."
    elif intent == 'transport':
        data = await fetch_transport_india(city)
        reply = f"Public transport: {data['active_buses']} active buses. Metro daily ridership: {data['metro_ridership_lakhs']} Lakhs. EV Adoption: {data['ev_adoption_rate']}."
    elif intent == 'literacy':
        data = await fetch_literacy_india(city)
        reply = f"The estimated literacy rate in {city}/state is {data['literacy_rate']}%."
    elif intent == 'health':
        data = await fetch_health_india(city)
        reply = f"Healthcare: {data['govt_hospitals']} Govt Hospitals. {data['beds_per_1000']} beds per 1000 people."
    elif intent == 'crime':
        data = await fetch_crime_india(city)
        reply = f"Safety Index is {data['safety_index']}/100. CCTV coverage is {data['cctv_coverage']}."
    elif intent == 'electricity':
        data = await fetch_electricity_india(city)
        reply = f"Peak demand is {data['peak_demand_mw']} MW. Renewable share is {data['renewables_share']}."
    elif intent == 'waste':
        data = await fetch_waste_india(city)
        reply = f"Generates {data['waste_generated_tpd']} TPD of waste with {data['processing_efficiency']} processing efficiency."
    elif intent == 'infrastructure':
        data = await fetch_infrastructure_india(city)
        reply = f"Roads: {data['potholes_reported']} potholes reported, {data['potholes_repaired']} repaired. {data['new_road_projects']} new road projects."
    elif intent == 'internet':
        data = await fetch_internet_india(city)
        reply = f"Broadband speed averages {data['broadband_speed_mbps']} Mbps. 5G coverage is {data['5g_coverage']}."
    elif intent == 'housing':
        data = await fetch_housing_india(city)
        reply = f"Avg 1BHK rent is ₹{data['avg_rent_1bhk']}. {data['affordable_projects_active']} affordable housing projects active."
    elif intent == 'employment':
        data = await fetch_employment_india(city)
        reply = f"Unemployment rate is {data['unemployment_rate']}. {data['formal_jobs_created']} formal jobs created recently."
    elif intent == 'green':
        data = await fetch_green_india(city)
        reply = f"Green cover is {data['green_cover_sqkm']} sq km. {data['trees_planted_ytd']:,} trees planted YTD."
    elif intent == 'women_safety':
        data = await fetch_women_safety_india(city)
        reply = f"Women Safety: {data['pink_police_patrols']} Pink Police patrols. Helpline response: {data['helpline_response_time']}."
    elif intent == 'disaster':
        data = await fetch_disaster_india(city)
        reply = f"Disaster Mgmt: Primary risk is {data['primary_risk']}. {data['evacuation_shelters']} active evacuation shelters."
    elif intent == 'resolution':
        data = await fetch_resolution_india(city)
        reply = f"Civic Resolution: {data['resolved_percent']} of complaints resolved within SLA averaging {data['avg_sla_days']} days."
    else:
        reply = "I can share data about India on: weather, AQI, population, transport, crime, waste, literacy, and 13 other civic metrics. Ask away!"

    # Ensure Hindi/Tamil fallback localization wrapper (simulated simple translation wrap for prototype speed)
    if detected_lang == 'hi-IN' and intent != 'general':
        reply = f"(Hindi) {reply}"
    elif detected_lang == 'ta-IN' and intent != 'general':
        reply = f"(Tamil) {reply}"

    return ChatResponse(reply=reply, detected_language=detected_lang, intent=intent, data=data, speak=True)
