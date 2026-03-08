import os
import re
import httpx
import boto3
from fastapi import APIRouter
from pydantic import BaseModel
from langdetect import detect

router = APIRouter()

# --- STEP 2: Language Detection ---
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

# --- STEP 3: NLP Intent Classifier ---
INTENT_PATTERNS = {
    'weather': [
        r'weather', r'temperature', r'rain', r'forecast', r'hot', r'cold',
        r'humid', r'climate', r'monsoon', r'barometer', r'wind',
        r'\bweather\b', r'mausam', r'barish',  # Hindi
        r'vanilam', r'mazhai',  # Tamil
    ],
    'air_quality': [
        r'air quality', r'aqi', r'pollution', r'smog', r'pm2\.5',
        r'pm10', r'particulate', r'breathe', r'breathing', r'air',
        r'vayu', r'pradushan',  # Hindi
        r'kaal nila',  # Tamil
    ],
    'issues': [
        r'issue', r'complaint', r'report', r'problem', r'pothole',
        r'streetlight', r'garbage', r'flooding', r'broken', r'repair',
        r'status', r'ticket', r'open issue', r'recent', r'latest',
        r'samasya', r'shikayat',  # Hindi
        r'pirachanai',  # Tamil
    ],
    'budget': [
        r'budget', r'spending', r'money', r'fund', r'expenditure',
        r'allocation', r'government spend', r'taxpayer',
        r'bajat', r'paisa',  # Hindi
        r'bajett',  # Tamil
    ],
    'census': [
        r'population', r'census', r'demographics', r'income',
        r'how many people', r'residents', r'household',
        r'janganana', r'jansankhya',  # Hindi
        r'makkal thokai',  # Tamil
    ],
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

# --- STEP 4: Dataset Fetchers (all async with httpx) ---
async def fetch_weather(city: str = 'Chicago') -> dict:
    url = f'https://wttr.in/{city}?format=j1'
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(url)
            data = r.json()
            current = data['current_condition'][0]
            return {
                'temp_c': current['temp_C'],
                'temp_f': current['temp_F'],
                'feels_like_c': current['FeelsLikeC'],
                'humidity': current['humidity'],
                'description': current['weatherDesc'][0]['value'],
                'wind_kmph': current['windspeedKmph'],
                'visibility_km': current['visibility'],
                'uv_index': current['uvIndex'],
            }
        except Exception as e:
            return {'error': str(e)}

async def fetch_air_quality(city: str = 'Chicago') -> dict:
    url = 'https://api.openaq.org/v2/latest'
    params = {'city': city, 'limit': 1, 'order_by': 'lastUpdated',
              'sort': 'desc', 'has_geo': True}
    headers = {'X-API-Key': os.getenv('OPENAQ_API_KEY', '')}
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(url, params=params, headers=headers)
            data = r.json()
            if not data.get('results'): return {'error': 'No air quality data found'}
            measurements = data['results'][0]['measurements']
            result = {'location': data['results'][0]['name']}
            for m in measurements:
                result[m['parameter']] = f"{m['value']} {m['unit']}"
            return result
        except Exception as e:
             return {'error': str(e)}

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
    except Exception as e:
        return []

async def fetch_budget_data(agency: str = 'Department of Transportation') -> dict:
    url = 'https://api.usaspending.gov/api/v2/search/spending_by_award/'
    payload = {
        'filters': {'agencies': [{'type': 'awarding', 'tier': 'toptier',
                   'name': agency}], 'time_period': [{'start_date': '2023-10-01',
                   'end_date': '2024-09-30'}]},
        'fields': ['Award Amount', 'Recipient Name', 'Award Type'],
        'limit': 5, 'page': 1
    }
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.post(url, json=payload)
            data = r.json()
            total = sum(a.get('Award Amount', 0) for a in data.get('results', []))
            return {'agency': agency, 'total_awarded': total,
                    'top_recipients': [a.get('Recipient Name') for a in data.get('results', [])[:3]]}
        except Exception as e:
            return {'error': str(e)}

async def fetch_census_data(city: str = 'Chicago', state: str = 'IL') -> dict:
    api_key = os.getenv('CENSUS_API_KEY', '')
    url = f'https://api.census.gov/data/2022/acs/acs5'
    params = {
        'get': 'NAME,B01003_001E,B19013_001E,B25077_001E',
        'for': 'place:*', 'in': f'state:17', 'key': api_key
    }
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(url, params=params)
            rows = r.json()
            chicago = next((row for row in rows[1:] if 'Chicago' in str(row[0])), None)
            if not chicago: return {'error': 'City not found'}
            return {
                'city': chicago[0], 'population': int(chicago[1]),
                'median_income': int(chicago[2]), 'median_home_value': int(chicago[3])
            }
        except Exception as e:
            return {'error': str(e)}

# --- STEP 5: Multilingual Response Formatter ---
RESPONSE_TEMPLATES = {
    'weather': {
        'en-US': 'Current weather in {city}: {description}. Temperature: {temp_c}C ({temp_f}F). Feels like {feels_like_c}C. Humidity: {humidity}%. Wind: {wind_kmph} km/h. UV Index: {uv_index}.',
        'hi-IN': '{city} mein abhi mausam: {description}. Taapman: {temp_c}C. Nami: {humidity}%. Hawa: {wind_kmph} km/h.',
        'ta-IN': '{city} il t vanilam: {description}. Veppanilai: {temp_c}C. Eerappatham: {humidity}%. Kaatrru: {wind_kmph} km/h.',
    },
    'air_quality': {
        'en-US': 'Air quality in {city}: PM2.5 level is {pm25}. {health_advice}',
        'hi-IN': '{city} mein vayu guna: PM2.5 star {pm25} hai. {health_advice}',
        'ta-IN': '{city} il kaatrru tharam: PM2.5 aalavu {pm25}. {health_advice}',
    },
    'issues': {
        'en-US': 'There are currently {count} open civic issues. Recent reports include: {summary}',
        'hi-IN': 'Abhi {count} nagarik samasya khuli hain. Haaliya shikayatein: {summary}',
        'ta-IN': 'Tarpothu {count} thiranthu vullu nagarik pirachanaikal. Sameebathiya arikkaigal: {summary}',
    },
}

def get_health_advice(pm25_value: float, lang: str) -> str:
    if pm25_value < 12:
        msgs = {'en-US': 'Air is Good. Safe for all activities.',
                'hi-IN': 'Vayu achhi hai. Sab ke liye surakshit.',
                'ta-IN': 'Kaatrru nalladu. Anavaram seyalpaduthu suraksitham.'}
    elif pm25_value < 35:
        msgs = {'en-US': 'Air quality is Moderate.',
                'hi-IN': 'Vayu guna madhyam hai.',
                'ta-IN': 'Kaatrru tharam mathiyamam.'}
    else:
        msgs = {'en-US': 'Air quality is Unhealthy. Avoid outdoor activities.',
                'hi-IN': 'Vayu guna kharab hai. Bahar mat jaiye.',
                'ta-IN': 'Kaatrru tharam mosam. Veliyil pokatheergal.'}
    return msgs.get(lang, msgs['en-US'])

# --- STEP 6: Main Chat Endpoint ---
class ChatRequest(BaseModel):
    message: str
    language: str = 'en-US'  # can be overridden by detection
    city: str = 'Chicago'
    session_id: str = ''

class ChatResponse(BaseModel):
    reply: str
    detected_language: str
    intent: str
    data: dict
    speak: bool = True  # tell frontend to speak this reply

@router.post('/api/chat', response_model=ChatResponse)
async def chat(req: ChatRequest):
    detected_lang = detect_language(req.message)
    intent = classify_intent(req.message)
    data = {}
    reply = ''
    
    if intent == 'weather':
        data = await fetch_weather(req.city)
        if 'error' not in data:
            template = RESPONSE_TEMPLATES['weather'].get(detected_lang,
                       RESPONSE_TEMPLATES['weather']['en-US'])
            reply = template.format(city=req.city, **data)
        else:
            reply = f'Sorry, weather data for {req.city} is unavailable right now.'
    elif intent == 'air_quality':
        data = await fetch_air_quality(req.city)
        if 'error' not in data:
            pm25_raw = data.get('pm25', '0 ug/m3')
            pm25_val = float(pm25_raw.split()[0]) if pm25_raw else 0
            advice = get_health_advice(pm25_val, detected_lang)
            template = RESPONSE_TEMPLATES['air_quality'].get(detected_lang,
                       RESPONSE_TEMPLATES['air_quality']['en-US'])
            reply = template.format(city=req.city, pm25=pm25_raw, health_advice=advice)
        else:
            reply = 'Air quality data is currently unavailable.'
    elif intent == 'issues':
        issues = await fetch_recent_issues(5)
        count = len(issues)
        summary = ', '.join([i.get('title', 'Unknown issue') for i in issues[:3]])
        template = RESPONSE_TEMPLATES['issues'].get(detected_lang,
                   RESPONSE_TEMPLATES['issues']['en-US'])
        reply = template.format(count=count, summary=summary or 'No recent issues')
        data = {'issues': issues}
    elif intent == 'budget':
        data = await fetch_budget_data()
        amt = f"${data['total_awarded']:,.0f}" if data.get('total_awarded') else 'N/A'
        if detected_lang == 'hi-IN':
            reply = f"Sarkar ne {data.get('agency','vibhag')} ko {amt} diya hai."
        elif detected_lang == 'ta-IN':
            reply = f"Aracu {data.get('agency','')} ku {amt} vankiyadu."
        else:
            reply = f"Government allocated {amt} to {data.get('agency','the department')} this fiscal year."
    elif intent == 'census':
        data = await fetch_census_data(req.city)
        if 'error' not in data:
            pop = f"{data['population']:,}"
            inc = f"${data['median_income']:,}"
            if detected_lang == 'hi-IN':
                reply = f"{req.city} ki jansankhya {pop} hai. Madhyan aay {inc} pratighar hai."
            elif detected_lang == 'ta-IN':
                reply = f"{req.city} il makkal thokai {pop}. Mathiya varumanam {inc}."
            else:
                reply = f"{req.city} has a population of {pop}. Median household income is {inc}."
        else:
            reply = "Sorry, demographic data is unavailable right now."
    else:
        if detected_lang == 'hi-IN':
            reply = 'Main mausam, vayu guna, nagarik samasya, bajat, ya jansankhya ke bare mein bata sakta hoon. Aap kya jaanna chahte hain?'
        elif detected_lang == 'ta-IN':
            reply = 'Naan vanilam, kaatrru tharam, pirachanaikal, bajett, makkal thokai pattri solluveen. Neengal enna ketka virupam?'
        else:
            reply = 'I can help you with weather, air quality, civic issues, budget spending, or census data. What would you like to know?'
            
    return ChatResponse(reply=reply, detected_language=detected_lang,
                        intent=intent, data=data, speak=True)
