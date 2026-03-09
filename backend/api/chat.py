import os
import json
import logging
import httpx
import anthropic
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langdetect import detect

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# ═══════════════════════════════════════════════════════════════
# LANGUAGE DETECTION
# ═══════════════════════════════════════════════════════════════

LANGUAGE_MAP = {
    'hi': 'hi-IN',  # Hindi
    'ta': 'ta-IN',  # Tamil
    'te': 'te-IN',  # Telugu
    'kn': 'kn-IN',  # Kannada
    'bn': 'bn-IN',  # Bengali
    'mr': 'mr-IN',  # Marathi
    'gu': 'gu-IN',  # Gujarati
    'pa': 'pa-IN',  # Punjabi
    'en': 'en-IN',  # English
}

def detect_language(text: str) -> str:
    try:
        code = detect(text)
        return LANGUAGE_MAP.get(code, 'en-IN')
    except:
        return 'en-IN'

# ═══════════════════════════════════════════════════════════════
# INDIAN CITY EXTRACTOR
# ═══════════════════════════════════════════════════════════════

INDIAN_CITIES = [
  'Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Kolkata','Pune',
  'Ahmedabad','Jaipur','Lucknow','Kanpur','Nagpur','Indore','Thane',
  'Bhopal','Visakhapatnam','Patna','Vadodara','Ghaziabad','Ludhiana',
  'Agra','Nashik','Faridabad','Meerut','Rajkot','Varanasi','Srinagar',
  'Aurangabad','Dhanbad','Amritsar','Allahabad','Ranchi','Howrah',
  'Coimbatore','Jabalpur','Gwalior','Vijayawada','Jodhpur','Madurai',
  'Raipur','Kota','Chandigarh','Guwahati','Hubli','Mysore','Noida',
  'Jamshedpur','Bhubaneswar','Salem','Warangal','Kochi','Dehradun',
  'Nanded','Kolhapur','Ajmer','Jamnagar','Ujjain','Siliguri','Jhansi',
  'Nellore','Jammu','Mangalore','Tirunelveli','Gaya','Udaipur',
  'Tiruchirappalli','Bhilai','Cuttack','Firozabad','Bhavnagar',
  'Durgapur','Asansol','Sangli','Belgaum','Malegaon','Jalgaon',
]

def extract_city(text: str, fallback: str = 'Mumbai') -> str:
    tl = text.lower()
    for city in INDIAN_CITIES:
        if city.lower() in tl:
            return city
    return fallback

# ═══════════════════════════════════════════════════════════════
# INDIA NLP INTENT CLASSIFIER (15 intents, 8 languages)
# ═══════════════════════════════════════════════════════════════

INTENT_PATTERNS = {
    'air_quality':  ['aqi','air quality','pollution','smog','pm2.5','pm10',
                     'vayu pradushan','kaatrru tharam','gali ki hawa'],
    'weather':      ['weather','mausam','barish','rain','temperature','garmi',
                     'sardi','flood','vanilam','veppam','tapman'],
    'civic_issues': ['pothole','khada','streetlight','garbage','kachra','drain',
                     'nali','broken road','sadak','pirachanai','samasya','shikayat'],
    'traffic':      ['traffic','jam','route','toll','highway','metro','bus',
                     'vaahan','gaadi','signal','traffic jam'],
    'water':        ['water','pani','jal','tap water','pipeline','river','flood',
                     'dam','groundwater','borewell','neer','thanni'],
    'health':       ['hospital','doctor','medicine','dava','aspataal','health',
                     'swasthya','ayushman','blood','rakt','bed available'],
    'agriculture':  ['mandi','fasal','crop','kisan','farmer','price','rate',
                     'pm kisan','soil','kheti','bhoomi','urvarak'],
    'education':    ['school','vidyalaya','college','result','cbse','board',
                     'scholarship','mid day meal','fee','admission'],
    'crime':        ['crime','police','FIR','challan','theft','missing person',
                     'cyber crime','fraud','complaint','case status'],
    'law':          ['law','kanoon','section','IPC','RTI','constitution','article',
                     'fundamental right','act','court','legal','vakeel','adhikar'],
    'budget':       ['budget','spending','yojana','scheme','expenditure','tax',
                     'government money','allocation','bajat'],
    'census':       ['population','jansankhya','census','demographics','income',
                     'household','makkal thokai','village data'],
    'electricity':  ['bijli','electricity','power cut','load shedding',
                     'transformer','meter','bill','voltage'],
    'ration':       ['ration','ration card','PDS','anaj','food grain',
                     'wheat','rice','subsidy','ration shop'],
    'pension':      ['pension','old age','vridha pension','widow pension',
                     'disabled','EPFO','PF','provident fund'],
}

def classify_intent(text: str) -> str:
    tl = text.lower()
    scores = {k: sum(1 for p in v if p in tl) for k,v in INTENT_PATTERNS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else 'general'

# ═══════════════════════════════════════════════════════════════
# ASYNC DATASET FETCHERS
# ═══════════════════════════════════════════════════════════════

async def fetch_weather_india(city: str) -> dict:
    url = f'https://wttr.in/{city}?format=j1'
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(url)
        d = r.json()['current_condition'][0]
        return {
            'temp_c': d['temp_C'], 'temp_f': d['temp_F'],
            'feels_like': d['FeelsLikeC'], 'humidity': d['humidity'],
            'description': d['weatherDesc'][0]['value'],
            'wind_kmph': d['windspeedKmph'], 'uv_index': d['uvIndex']
        }

async def fetch_aqi_india(city: str) -> dict:
    # Try OpenAQ first
    url = 'https://api.openaq.org/v2/latest'
    params = {'city': city, 'country': 'IN', 'limit': 1, 'has_geo': True}
    headers = {'X-API-Key': os.getenv('OPENAQ_API_KEY', '')}
    async with httpx.AsyncClient(timeout=10) as c:
        try:
            r = await c.get(url, params=params, headers=headers)
            d = r.json()
            if d.get('results'):
                ms = d['results'][0]['measurements']
                return {m['parameter']: f"{m['value']} {m['unit']}" for m in ms}
        except Exception as e:
            logger.warning(f"OpenAQ fetch failed: {e}")

    # Fallback: WAQI
    token = os.getenv('WAQI_TOKEN', 'demo')
    async with httpx.AsyncClient(timeout=10) as c:
        r2 = await c.get(f'https://api.waqi.info/feed/{city}/?token={token}')
        d2 = r2.json()
        return {'aqi': d2.get('data',{}).get('aqi','N/A'), 'source': 'WAQI'}

async def fetch_mandi_prices(crop: str = 'tomato', city: str = 'Mumbai') -> list:
    url = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
    # For a prototype, we use the city as a filter for district or state if needed, 
    # but here we keep it simple as per prompt.
    params = {
        'api-key': os.getenv('DATA_GOV_KEY',''), 
        'format':'json',
        'filters[Commodity]': crop,
        'limit': 5
    }
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(url, params=params)
        return r.json().get('records', [])

async def fetch_law_section(query: str) -> dict:
    url = f'https://indiankanoon.org/api/search/'
    params = {'formInput': query, 'pagenum': 0}
    headers = {'Authorization': f'Token {os.getenv("INDIANKANOON_TOKEN","")}'} 
    async with httpx.AsyncClient(timeout=10) as c:
        try:
            r = await c.get(url, params=params, headers=headers)
            d = r.json()
            docs = d.get('docs', [])
            return {'results': docs[:3], 'total': d.get('total', 0)}
        except Exception as e:
            return {'error': str(e)}

async def fetch_scheme_info(query: str) -> list:
    url = 'https://api.myscheme.gov.in/search/v4/schemes'
    params = {'keyword': query, 'lang': 'en', 'sortBy': 'relevance', 'size': 3}
    async with httpx.AsyncClient(timeout=10) as c:
        try:
            r = await c.get(url, params=params)
            return r.json().get('data', {}).get('schemes', [])
        except Exception as e:
            return []

async def fetch_train_status(train_no: str) -> dict:
    # Note: Train status APIs often require keys or complex scraping.
    # This is a placeholder as per the architecture prompt.
    url = f'https://enquiry.indianrail.gov.in/mntes/q?opt=TR&trainNo={train_no}'
    async with httpx.AsyncClient(timeout=10) as c:
        try:
            r = await c.get(url)
            return r.json()
        except:
            return {"status": "Information currently unavailable"}

async def fetch_civic_issues(city: str, limit: int = 5) -> list:
    try:
        # Integrated with DynamoDB as seen in previous implementation
        import boto3
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('civic_issues')
        # Simplified scan for the prototype
        response = table.scan(Limit=limit)
        return response.get('Items', [])
    except Exception as e:
        logger.error(f"Failed to fetch civic issues: {e}")
        return []

# ═══════════════════════════════════════════════════════════════
# CLAUDE LLM INTEGRATION
# ═══════════════════════════════════════════════════════════════

claude = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY', ''))

LANG_NAMES = {
    'hi-IN':'Hindi', 'ta-IN':'Tamil', 'te-IN':'Telugu', 'kn-IN':'Kannada',
    'bn-IN':'Bengali', 'mr-IN':'Marathi', 'gu-IN':'Gujarati', 'en-IN':'English'
}

async def ask_claude(query: str, context: dict, lang: str, city: str) -> str:
    lang_name = LANG_NAMES.get(lang, 'English')
    system = f'''You are CivicBridge AI, India's smartest civic assistant.
    You know: all Indian laws (IPC, CrPC, RTI, Constitution articles),
    government schemes (PM Kisan, Ayushman, PMAY, MNREGA, etc.),
    all 28 states and 8 UTs, municipal corporations, civic rights,
    consumer rights, labour laws, property laws, traffic rules.
    Current user city: {city}.
    CRITICAL: You MUST reply ONLY in {lang_name}.
    For legal questions: cite the exact Act name and Section number.
    For scheme questions: give eligibility criteria and application URL.
    Use provided data context if available, otherwise use your knowledge.
    Keep answers clear and useful for ordinary Indian citizens.
    '''
    ctx_str = json.dumps(context, ensure_ascii=False, indent=2) if context else ''
    msg = f'Data context:\n{ctx_str}\n\nUser question: {query}' if ctx_str else query
    
    try:
        resp = claude.messages.create(
            model='claude-3-sonnet-20240229', # Using active version of sonnet
            max_tokens=700,
            system=system,
            messages=[{'role':'user','content':msg}]
        )
        return resp.content[0].text
    except Exception as e:
        logger.error(f"Claude API failed: {e}")
        return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment."

# ═══════════════════════════════════════════════════════════════
# MAIN CHAT ENDPOINT
# ═══════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str
    language: str = 'en-IN'
    city: str = 'Mumbai'
    user_lat: float = None
    user_lon: float = None
    session_id: str = ''

class ChatResponse(BaseModel):
    reply: str
    detected_language: str
    intent: str
    data: dict = {}
    speak: bool = True
    map_markers: list = []
    suggestions: list = []

@router.post('/api/chat', response_model=ChatResponse)
async def chat(req: ChatRequest):
    lang = detect_language(req.message)
    city = extract_city(req.message, req.city)
    intent = classify_intent(req.message)
    data = {}
    map_markers = []

    # Fetch structured data based on intent
    try:
        if intent == 'weather':
            data = await fetch_weather_india(city)
        elif intent == 'air_quality':
            data = await fetch_aqi_india(city)
        elif intent == 'agriculture':
            data = {'prices': await fetch_mandi_prices(city=city)}
        elif intent == 'law':
            data = await fetch_law_section(req.message)
        elif intent == 'budget':
            data = await fetch_scheme_info(req.message)
        elif intent == 'civic_issues':
            issues = await fetch_civic_issues(city=city, limit=5)
            data = {'issues': issues, 'count': len(issues)}
            map_markers = [
                {'lat': i.get('lat'), 'lon': i.get('lon'),
                 'title': i.get('title'), 'cat': i.get('category')}
                for i in issues if i.get('lat')
            ]
    except Exception as e:
        logger.error(f"Intent data fetch failed: {e}")
        data = {'fetch_error': str(e)}

    # Claude LLM generates the final human-language reply
    reply = await ask_claude(req.message, data, lang, city)

    # Multilingual suggestion chips
    CHIPS = {
      'hi-IN': ['Aaj ka mausam','Vayu guna','Shikayat','Kanoon jaankari',
                'Kisan yojana','Aspatal khoje','Mandi bhav'],
      'ta-IN': ['Indru vanilam','Kaatrru tharam','Pirachanai','Kanoon',
                'Vivasayam','Aspatal','Mandi vilai'],
      'te-IN': ['Intha weather','Vayu nosta','Samasya','Chatta',
                'Raitu scheme','Hospital khoji','Mandi dhara'],
      'kn-IN': ['Inda havamanasthiti','Vayu guna','Samasye','Kanoon',
                'Raita yojane','Aaspatre','Mandi bele'],
      'bn-IN': ['Ajer abohar','Bayur guna','Samasya','Ain',
                'Kishi prakalpa','Aspataal','Mandi dam'],
      'en-IN': ['Weather today','Air quality','Report issue','Know your rights',
                'Farmer schemes','Find hospital','Mandi prices'],
    }
    
    suggestions = CHIPS.get(lang, CHIPS['en-IN'])

    return ChatResponse(
        reply=reply, 
        detected_language=lang, 
        intent=intent,
        data=data, 
        speak=True, 
        map_markers=map_markers,
        suggestions=suggestions
    )
