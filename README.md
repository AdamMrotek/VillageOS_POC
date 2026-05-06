# VillageOS

[→ View Idea Overview and data flow](https://adammrotek.github.io/VillageOS_POC/)

> **Proof of Concept** — This project is an experimental build exploring three AI-driven capabilities described below.

A family operating system that turns unstructured parent communications into actionable calendar events — no manual data entry required.

## What it does

Parents receive school newsletters, WhatsApp messages, flyers, and email chains that are hard to keep track of. VillageOS lets you paste or upload any of that content and automatically extracts events, deadlines, and action items into a unified family calendar.

Week Calendar 
<img width="1132" height="746" alt="week_calendar" src="https://github.com/user-attachments/assets/5974b3b1-6b32-4d22-8156-39e41fa80f59" />



## What we are testing

### 1. AI Extraction into Structured Data
Raw parent communications — PDFs, WhatsApp messages, flyer images, emails — are passed through an AI extraction layer that outputs clean, structured event data (title, date, location, action required). The goal is zero manual data entry for the parent.

Event extraction
<img width="1097" height="748" alt="Event_extraction" src="https://github.com/user-attachments/assets/f584e60f-4fd3-43a9-ad15-b66cc24d0436" />


### 2. RAG Retrieval of Places to Subscribe
A retrieval-augmented generation pipeline indexes local providers (schools, clubs, sports teams) so parents can discover and subscribe to event feeds relevant to their children. The system surfaces the right groups without the parent needing to know they exist.

Rag retrival with explanation

<img width="1089" height="700" alt="Rag_event_search" src="https://github.com/user-attachments/assets/4744873d-770a-4706-ab24-65f222c309fe" />


### 3. MCP Server for Local AI Access ( Removed )
A Model Context Protocol server exposes VillageOS data to local AI assistants. This lets you query your family calendar, upcoming events, and action items directly from your own AI tools — keeping data local and under your control.

---

## Stack

- **Frontend** — React app for the parent-facing dashboard
- **Backend** — API server handling AI extraction and calendar management
- ~~**MCP Server** — Model Context Protocol integration for AI tooling~~
- **AI Extraction Layer** — Processes unstructured text and images into structured events

## Getting started

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000` — expects the backend on `http://localhost:8000`.

## Environment variables

Copy the example files and fill in your keys before running the servers.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**`backend/.env.example`**
```env
LLM_PROVIDER=groq

GROQ_API_KEY=gsk_your_groq_api_key_here
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**`frontend/.env.example`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> `.env` and `.env.local` are git-ignored. Never commit real keys.

## Findings Summary

## Status

Active development — see `PHASE_1_DESIGN.md`, `PHASE_2.md`, and `PHASE_3.md` for the roadmap.
