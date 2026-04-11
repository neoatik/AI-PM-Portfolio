# 🤖 Recruit AI

An AI-powered resume screening and candidate management platform built with Next.js, OpenAI, and Supabase.

Recruit AI automates the tedious parts of hiring — upload resumes, let AI evaluate candidates against job requirements and stakeholder expectations, then automatically send personalized shortlist or rejection emails.

---

## ✨ Features

- **AI Resume Scoring** — GPT-4o-mini evaluates resumes against job descriptions and stakeholder expectations, producing a 0–100 fit score with a summary
- **Bulk Resume Upload** — Upload multiple PDF/DOCX resumes per job and process them all at once
- **Automated Email Outreach** — AI-generated personalized shortlist invitations (with calendar booking links) and compassionate rejection emails via Resend
- **Job Management Dashboard** — Create, view, and delete job listings with real-time stats (total candidates, shortlisted count, evaluation status)
- **Candidate Tracking** — View all candidates across jobs, filter by status, and read AI-generated evaluation summaries
- **Demo Mode** — Built-in demo flow that simulates the AI evaluation process with pre-defined results

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Vanilla CSS |
| **Backend** | Next.js API Routes (App Router) |
| **AI** | OpenAI GPT-4o-mini |
| **Database** | Supabase (PostgreSQL) |
| **Email** | Resend |
| **File Parsing** | pdf-parse, mammoth (DOCX) |
| **Automation** | n8n workflows (interview scheduling, candidate reply handling) |

## 📁 Project Structure

```
recruit-ai-app/
├── app/
│   ├── api/
│   │   ├── candidates/route.js      # GET all candidates
│   │   └── jobs/
│   │       ├── route.js              # GET/POST jobs
│   │       └── [id]/
│   │           ├── route.js          # GET/DELETE single job
│   │           ├── upload/route.js   # POST resume uploads
│   │           └── evaluate/route.js # POST AI evaluation
│   ├── candidates/page.jsx          # All candidates view
│   ├── jobs/[id]/page.jsx           # Job detail + candidate list
│   ├── page.jsx                     # Dashboard
│   ├── layout.jsx                   # Root layout
│   └── globals.css                  # Design system + all styles
├── components/
│   └── Sidebar.jsx                  # Navigation sidebar
├── lib/
│   ├── openai.js                    # AI scoring & email generation
│   ├── email.js                     # Resend email client
│   ├── supabase.js                  # Supabase client
│   └── mappers.js                   # Data transformation utilities
└── public/                          # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key
- A [Resend](https://resend.com) API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-...

# Resend (Email)
RESEND_API_KEY=re_...
FROM_EMAIL=your-email@domain.com
FROM_NAME=Recruit AI
```

### 3. Set Up Database

Create the following tables in your Supabase project:

**`jobs`** — Job listings  
**`candidates`** — Candidate records with AI scores and status

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 🔄 Workflow

1. **Create a Job** — Define the role, description, and stakeholder expectations
2. **Upload Resumes** — Drag and drop PDF/DOCX files for the job
3. **AI Evaluation** — Click "Start AI Evaluation" to score all candidates
4. **Review Results** — Candidates are ranked by fit score with AI summaries
5. **Send Emails** — Shortlisted candidates receive interview invitations; others receive rejection emails

## 🤝 n8n Integration

This project integrates with n8n automation workflows for:

- **Interview Scheduling** — Sends calendar invitations to shortlisted candidates, checking HR availability and avoiding weekends/holidays
- **Rejection Emails** — Sends compassionate AI-generated rejection emails to unselected candidates
- **Candidate Reply Handling** — Processes rescheduling requests, re-checks calendar availability, and sends updated interview details

## 📄 License

This project is part of the [AI PM Portfolio](https://github.com/neoatik/AI-PM-Portfolio).
