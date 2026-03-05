<p align="center">
  <h1 align="center">🏛️ CivicBridge</h1>
  <p align="center">
    <strong>AI-Powered Civic Engagement Platform</strong><br/>
    Connecting citizens to government services through voice, data, and accessibility.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.11-blue?logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.100+-teal?logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/AWS-Cloud%20Native-orange?logo=amazonaws" alt="AWS" />
    <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker" alt="Docker" />
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  </p>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [AWS Services Used](#-aws-services-used)
- [Getting Started](#-getting-started)
- [Local Development with Docker](#-local-development-with-docker)
- [Backend API Reference](#-backend-api-reference)
- [Frontend Components](#-frontend-components)
- [Infrastructure & Deployment](#-infrastructure--deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Testing](#-testing)
- [Monitoring & Observability](#-monitoring--observability)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**CivicBridge** is a full-stack civic-tech platform that enables citizens to report infrastructure issues, access government services, and interact with civic data — using **voice input**, **multilingual support**, and **accessibility-first design**.

### Key Capabilities

- **🎤 Voice-Powered Issue Reporting** — Citizens speak their issue; AI extracts title, category, location, and severity using Claude Haiku
- **🗣️ Speech-to-Text (STT)** — Dual-mode: browser Web Speech API for instant feedback + AWS Transcribe for server-side processing
- **🔊 Text-to-Speech (TTS)** — Amazon Polly (neural voices) with S3 caching + gTTS fallback for local dev
- **📊 Real-Time Civic Data** — Ingests 5 public datasets daily: Chicago 311, US Census, USASpending, OpenAQ, FEMA flood zones
- **♿ Accessibility** — Global panel with font scaling, high contrast, page reader, and voice input toggle
- **🔐 Cognito Authentication** — Email + Google OAuth, role-based access (citizen / officer / admin)
- **📸 Photo Uploads** — Drag-and-drop with compression, S3 presigned URLs, and thumbnail previews

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│   Next.js 14 · React · Amplify · Cognito Auth               │
│   Components: IssueForm, VoiceInput, PhotoUpload,           │
│               AccessibilityPanel, AudioPlayer                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                    API GATEWAY                              │
│   REST API · Cognito Authorizer · CORS · Rate Limiting     │
│   Routes: /issues, /services, /datasets, /stt, /tts,      │
│           /media, /export, /health                          │
└─────┬──────────┬──────────┬──────────┬──────────────────────┘
      │          │          │          │
      ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────────────┐
│  Lambda  │ │ Lambda │ │ Lambda │ │  EC2 / ECS       │
│  Issues  │ │  STT   │ │ Notify │ │  FastAPI Backend │
│  CRUD    │ │ Process│ │  SES   │ │  Whisper · Polly │
└────┬─────┘ └───┬────┘ └───┬────┘ └────────┬─────────┘
     │           │          │               │
     ▼           ▼          ▼               ▼
┌──────────────────────────────────────────────────────┐
│                    AWS SERVICES                      │
│  DynamoDB (9 tables) · S3 (2 buckets) · Transcribe  │
│  Polly · SES · Secrets Manager · CloudWatch · X-Ray │
└──────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11** | Core language |
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server (4 workers) |
| **Boto3** | AWS SDK |
| **Pydantic** | Request validation |
| **OpenAI Whisper** | Local speech-to-text |
| **gTTS** | Local text-to-speech fallback |
| **Pandas** | Dataset processing |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** | React framework (static export) |
| **React 18** | UI library |
| **AWS Amplify** | Auth + hosting |
| **Recharts** | Data visualization |
| **Leaflet** | Interactive maps |
| **Lucide React** | Icon library |
| **React Hook Form** | Form management |

### Infrastructure
| Technology | Purpose |
|---|---|
| **AWS Lambda** | Serverless functions (4 functions) |
| **Amazon ECS Fargate** | Container orchestration |
| **Amazon EC2** | Persistent compute (Whisper STT) |
| **API Gateway** | REST API management |
| **DynamoDB** | NoSQL database (9 tables) |
| **S3** | Object storage (2 buckets) |
| **Cognito** | User authentication |
| **SES** | Email notifications |
| **CloudWatch** | Monitoring + logging |
| **X-Ray** | Distributed tracing |
| **ECR** | Docker image registry |
| **Secrets Manager** | Credentials management |

---

## 📁 Project Structure

```
civic_bridge-proto/
├── backend/
│   ├── main.py                          # FastAPI entrypoint
│   ├── Dockerfile                       # Multi-stage Docker build
│   ├── requirements.txt                 # Python dependencies
│   ├── api/
│   │   ├── issues_router.py             # CRUD /issues endpoints
│   │   ├── datasets_router.py           # /datasets endpoints
│   │   ├── stt_router.py                # /stt endpoints
│   │   ├── tts_router.py                # /tts endpoints
│   │   ├── nlp_router.py                # /nlp extract + translate
│   │   └── s3_router.py                 # /media endpoints
│   ├── services/
│   │   ├── aws_service.py               # AWS client initialization
│   │   ├── dynamo_service.py            # DynamoDB CRUD operations
│   │   ├── s3_service.py                # S3 uploads + presigned URLs
│   │   ├── stt_service.py               # Transcribe + Whisper
│   │   ├── tts_service.py               # Polly + gTTS
│   │   └── dataset_service.py           # 5-source data ingestion
│   ├── utils/
│   │   ├── logger.py                    # Structured JSON logger
│   │   ├── secrets.py                   # Secrets Manager integration
│   │   └── xray_setup.py               # X-Ray tracing
│   ├── lambda_functions/
│   │   ├── civic-api-issues/            # API Gateway → DynamoDB
│   │   ├── civic-stt-process/           # S3 trigger → Transcribe
│   │   ├── civic-dataset-ingest/        # EventBridge → fetch → S3 → DynamoDB
│   │   └── civic-notify/               # DynamoDB Stream → SES + TTS
│   └── tests/
│       ├── test_dynamo.py               # DynamoDB unit tests
│       ├── test_datasets.py             # Dataset ingestion tests
│       └── test_integration.py          # Full integration suite
├── frontend/
│   ├── Dockerfile                       # Multi-stage (node → nginx)
│   ├── nginx.conf                       # Frontend nginx config
│   ├── package.json
│   ├── src/
│   │   ├── main.jsx                     # App bootstrap
│   │   └── aws-exports.js              # Amplify configuration
│   ├── components/
│   │   ├── IssueReportForm.jsx          # Issue form + voice mode
│   │   ├── VoiceInput.jsx               # Mic button component
│   │   ├── PhotoUpload.jsx              # Drag-and-drop photos
│   │   ├── AudioPlayer.jsx              # TTS audio player
│   │   ├── AccessibilityPanel.jsx       # Global a11y panel
│   │   ├── IssueStatusCard.jsx          # Issue display + TTS
│   │   ├── ServiceDescriptionCard.jsx   # Service card + TTS
│   │   ├── DatasetInsightCard.jsx       # Chart card + TTS
│   │   └── withAuth.jsx                 # Protected route HOC
│   ├── context/
│   │   └── AccessibilityContext.jsx     # A11y state provider
│   ├── hooks/
│   │   ├── useSpeechToText.js           # Web Speech API hook
│   │   └── useTextToSpeech.js           # TTS playback hook
│   ├── pages/auth/
│   │   ├── signin.jsx                   # Email + Google OAuth
│   │   ├── signup.jsx                   # Registration + ward
│   │   └── verify.jsx                   # OTP verification
│   ├── styles/
│   │   └── accessibility.css            # High contrast CSS
│   └── cypress/e2e/
│       └── civic_bridge.cy.js           # E2E test suite
├── infrastructure/
│   ├── dynamo_setup.py                  # Create 9 DynamoDB tables
│   ├── openapi.yaml                     # Full OpenAPI 3.0 spec
│   ├── ec2_userdata.sh                  # EC2 bootstrap script
│   ├── civicbridge.service              # systemd unit file
│   ├── nginx_civicbridge.conf           # Nginx reverse proxy
│   ├── ec2_iam_policy.json              # EC2 IAM role
│   ├── security_group.json              # SG rules
│   ├── ecs_setup.sh                     # Full ECS Fargate setup
│   ├── task_def_backend.json            # ECS task definition
│   ├── apigw_setup.sh                   # API Gateway setup
│   ├── apigw_mapping_templates.json     # Error response templates
│   ├── cloudwatch_dashboard.json        # 15-widget dashboard
│   ├── cloudwatch_alarms.json           # 11 alarms → SNS
│   ├── deploy_monitoring.sh             # Monitoring setup
│   ├── secrets_setup.sh                 # Secrets Manager setup
│   ├── deploy_ec2.md                    # EC2 deployment guide
│   ├── deploy_amplify.md                # Amplify deployment guide
│   └── deploy_apigw.md                  # API Gateway + custom domain
├── scripts/
│   └── smoke_test.sh                    # 18-endpoint API smoke test
├── docs/
│   └── TROUBLESHOOTING.md              # FAQ + CLI quick reference
├── .github/workflows/
│   └── deploy.yml                       # CI/CD pipeline
├── docker-compose.yml                   # Local dev stack
├── amplify.yml                          # Amplify build spec
├── .env.example                         # All env vars documented
└── README.md
```

---

## ✨ Features

### 1. Issue Reporting
- Create, update, upvote, and delete civic issues
- Category classification: pothole, streetlight, water, sanitation, road, electricity, noise, illegal dumping, traffic
- Severity levels: low, medium, high, critical
- Ward-based filtering with GSI indexes
- Photo attachments with auto-compression (>5 MB)

### 2. Voice-Powered Input
- **Browser STT**: Web Speech API for real-time transcription
- **Server STT**: AWS Transcribe for uploaded audio (supports en-US, es-US, hi-IN, fr-FR, pt-BR)
- **Local STT**: OpenAI Whisper (base model) for offline/dev use
- **Voice Report Mode**: Speak a full report → Claude Haiku extracts structured data

### 3. Text-to-Speech
- **Amazon Polly**: Neural voices (Joanna, Miguel, Aditi, Celine, Vitoria)
- **S3 Caching**: MD5-based dedup — repeated phrases served from cache
- **gTTS Fallback**: Free local alternative for development

### 4. Data Ingestion (5 Sources)
| Dataset | Source | DynamoDB Table |
|---|---|---|
| 311 Service Requests | Chicago Open Data | `civic_issues` |
| Census Demographics | US Census ACS API | `civic_demographics` |
| Federal Spending | USASpending.gov | `civic_budget` |
| Air Quality | OpenAQ API | `civic_environment` |
| Flood Zones | FEMA NFHL | `civic_hazards` |

Daily automated ingestion via EventBridge (2 AM UTC).

### 5. Accessibility
- Font size scaling (100%–150%)
- High contrast mode
- Page reader (TTS for all visible text)
- Voice input toggle for any form field
- Language selector (persisted in localStorage)

### 6. Authentication
- Cognito User Pool with email verification
- Google OAuth integration
- Role-based access: `citizen` | `officer` | `admin`
- Protected route HOC with role gating

---

## ☁️ AWS Services Used

| Service | Purpose | Resource |
|---|---|---|
| **DynamoDB** | 9 NoSQL tables | `civic_issues`, `civic_users`, `civic_services`, etc. |
| **S3** | 2 buckets | `civic-bridge-media-842533680239`, `civic-bridge-datasets-842533680239` |
| **Lambda** | 4 serverless functions | `civic-api-issues`, `civic-stt-process`, `civic-dataset-ingest`, `civic-notify` |
| **API Gateway** | REST API (16 routes) | `civic-bridge-api` |
| **ECS Fargate** | Container hosting | `civic-bridge-cluster` |
| **EC2** | Persistent compute | `t3.medium` (for Whisper STT) |
| **Cognito** | Authentication | `CivicBridgeUsers` pool |
| **Polly** | Text-to-speech | Neural engine, 5 voices |
| **Transcribe** | Speech-to-text | 5 language codes |
| **SES** | Email notifications | Status change alerts |
| **EventBridge** | Scheduled triggers | Daily dataset ingestion |
| **Secrets Manager** | Credentials | `civic-bridge/prod` |
| **CloudWatch** | Monitoring | Dashboard + 11 alarms |
| **X-Ray** | Distributed tracing | All Lambda + FastAPI |
| **ECR** | Docker registry | 2 repositories |
| **Amplify** | Frontend hosting + CI/CD | Next.js static export |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **AWS CLI v2** (configured with account `842533680239`)
- **Docker** (optional, for containerized dev)
- **ffmpeg** (for Whisper audio processing)

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/raghul-cyber/civic_bridge-proto.git
cd civic_bridge-proto

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and AWS credentials

# Run the FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm ci

# Start dev server
npm run dev
# Opens at http://localhost:3000
```

### DynamoDB Setup

```bash
python infrastructure/dynamo_setup.py
```

---

## 🐳 Local Development with Docker

```bash
# Start all services (backend, frontend, DynamoDB Local, LocalStack S3)
docker compose up --build

# Services available:
#   Backend:   http://localhost:8000
#   Frontend:  http://localhost:3000
#   DynamoDB:  http://localhost:8100
#   LocalStack: http://localhost:4566
```

---

## 📡 Backend API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `GET` | `/issues` | Cognito | List issues (filter: ward, category, status) |
| `POST` | `/issues` | Cognito | Create issue |
| `GET` | `/issues/{id}` | Cognito | Get single issue |
| `PUT` | `/issues/{id}` | Cognito | Update issue |
| `DELETE` | `/issues/{id}` | Admin | Delete issue |
| `POST` | `/issues/{id}/upvote` | Cognito | Upvote issue |
| `GET` | `/services` | — | List government services |
| `GET` | `/datasets/files` | Cognito | List dataset files in S3 |
| `POST` | `/stt/transcribe` | Cognito | Transcribe audio |
| `GET` | `/stt/languages` | — | List supported languages |
| `POST` | `/tts/synthesize` | Cognito | Text-to-speech |
| `GET` | `/tts/voices` | — | List available voices |
| `POST` | `/media/upload` | Cognito | Upload photo |
| `GET` | `/media/presign` | Cognito | Get presigned URL |
| `POST` | `/nlp/extract` | Cognito | LLM-powered data extraction |

Interactive docs: `http://localhost:8000/docs`

---

## 🧩 Frontend Components

| Component | Description |
|---|---|
| `IssueReportForm` | Full issue form with voice mode, LLM extraction, and translation stub |
| `VoiceInput` | Microphone button with real-time transcript display |
| `PhotoUpload` | Drag-and-drop with validation (5 photos, 10 MB each), progress bars |
| `AudioPlayer` | Reusable audio player for TTS output |
| `AccessibilityPanel` | Floating panel with font size, contrast, language, voice, and page reader |
| `withAuth` | HOC for protected routes with role-based gating |
| `IssueStatusCard` | Issue display card with TTS "read aloud" button |
| `DatasetInsightCard` | Chart card with TTS narration |

---

## 🏭 Infrastructure & Deployment

### Option A: EC2 (single instance)
```bash
# Launch and bootstrap
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.medium \
  --user-data file://infrastructure/ec2_userdata.sh \
  ...
```
See: [`infrastructure/deploy_ec2.md`](infrastructure/deploy_ec2.md)

### Option B: ECS Fargate (production, auto-scaling)
```bash
bash infrastructure/ecs_setup.sh
```
See: [`infrastructure/ecs_setup.sh`](infrastructure/ecs_setup.sh)

### Option C: Amplify (frontend only)
```bash
amplify init && amplify publish --yes
```
See: [`infrastructure/deploy_amplify.md`](infrastructure/deploy_amplify.md)

---

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/deploy.yml`):

```
push to main → test → build & push → deploy ECS → deploy Amplify
pull request  → test only
```

| Job | Steps |
|---|---|
| **test** | pytest + moto mocks, ESLint, TypeScript check, Cypress E2E (headless) |
| **build-and-push** | OIDC auth → Docker build → push to ECR (SHA + latest tags) |
| **deploy-ecs** | Update task definition → deploy → wait for stability → smoke tests |
| **deploy-amplify** | `amplify publish --yes` |

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ROLE_ARN` | OIDC role for AWS access |
| `ECS_CLUSTER` | ECS cluster name |
| `ECS_SERVICE_BACKEND` | Backend service name |
| `ECS_SERVICE_FRONTEND` | Frontend service name |
| `AMPLIFY_APP_ID` | Amplify application ID |
| `API_URL` | Staging API endpoint |

---

## 🧪 Testing

### Backend (pytest)
```bash
# Unit tests
pytest backend/tests/test_dynamo.py -v

# Integration tests (moto-mocked AWS)
pytest backend/tests/test_integration.py -v --asyncio-mode=auto

# With coverage
coverage run -m pytest backend/tests/ -v && coverage report
```

### Frontend (Cypress)
```bash
cd frontend
npx cypress run --spec cypress/e2e/civic_bridge.cy.js
```

### API Smoke Test
```bash
./scripts/smoke_test.sh http://localhost:8000
# Checks all 18 endpoints with colored pass/fail output
```

---

## 📊 Monitoring & Observability

### CloudWatch Dashboard
15 widgets covering: API Gateway (requests, errors, latency), Lambda (invocations, errors, duration), DynamoDB (read/write capacity, throttles), S3 (size, object count), ECS/EC2 (CPU, memory).

### CloudWatch Alarms (11)
- API 5XX error rate > 5%
- Lambda errors > 10 in 5 min (per function)
- EC2/ECS CPU > 80% for 10 min
- DynamoDB throttled requests > 0
- API p99 latency > 5 seconds

### Structured Logging
JSON logs with: `timestamp`, `request_id`, `user_id`, `action`, `duration_ms`, `status` — fully searchable in CloudWatch Insights.

### X-Ray Tracing
End-to-end: API gateway → Lambda/FastAPI → DynamoDB → S3

```bash
# Deploy monitoring
bash infrastructure/deploy_monitoring.sh
```

---

## ⚙️ Environment Variables

See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable | Description | Default |
|---|---|---|
| `USE_SECRETS_MANAGER` | Use AWS Secrets Manager | `false` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `S3_BUCKET_MEDIA` | Media bucket | `civic-bridge-media-842533680239` |
| `S3_BUCKET_DATASETS` | Datasets bucket | `civic-bridge-datasets-842533680239` |
| `WHISPER_MODEL` | Whisper model size | `base` |
| `AWS_POLLY_VOICE` | Default Polly voice | `Joanna` |
| `ANTHROPIC_API_KEY` | Claude Haiku key | — |
| `CENSUS_API_KEY` | US Census API key | — |

In production, set `USE_SECRETS_MANAGER=true` to load from AWS Secrets Manager (`civic-bridge/prod`).

---

## ❓ Troubleshooting

See [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) for detailed solutions to common issues including:

- Lambda timeouts on Whisper
- DynamoDB throughput exceptions
- Amplify build failures
- CORS errors
- S3 403 Forbidden
- ECS task restarts

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/new-feature`
3. Commit: `git commit -m "feat: add new feature"`
4. Push: `git push origin feat/new-feature`
5. Open a Pull Request

---

## 📄 License

This project is part of the CivicBridge initiative. MIT License.

---

<p align="center">
  Built with ❤️ for civic engagement<br/>
  <strong>AWS Account:</strong> 842533680239 &nbsp;|&nbsp; <strong>Region:</strong> us-east-1
</p>
