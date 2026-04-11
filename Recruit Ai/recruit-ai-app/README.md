# 🤖 Recruit AI — AI-Powered Resume Screening Platform

> **Built for:** Recruiters & Hiring Managers who screen 200–500+ resumes per role  
> **Problem:** Manual resume screening takes 6–8 seconds per resume, leading to inconsistent evaluations, unconscious bias, and delayed candidate communication  
> **Solution:** An AI-powered platform that automates resume parsing, candidate scoring, and personalized email outreach — reducing screening time from hours to minutes

---

## 🎯 User Persona

| Attribute | Detail |
|-----------|--------|
| **Who** | Solo recruiter or hiring manager at a small–mid size company |
| **Pain Point** | Spends 4–6 hours screening 200+ resumes manually for each open role |
| **Technical Level** | Non-technical to moderately technical — comfortable with web dashboards, not with code |
| **Goal** | Shortlist the top candidates in minutes, not hours, and send professional communication instantly |
| **Decision Criteria** | Fit score based on job description match + stakeholder expectations alignment |
| **Current Workflow** | Download resumes → Read each one → Score mentally → Copy-paste emails |

### How Recruit AI Helps

1. Upload all resumes in bulk (PDF/DOCX) — no manual data entry
2. AI scores every candidate (0–100) against the job description + stakeholder expectations
3. Candidates above the fit threshold (60+) are auto-shortlisted
4. AI generates personalized shortlist emails (with calendar booking link) and compassionate rejection emails
5. The recruiter reviews results, not resumes

---

## ✨ Features

- **AI Resume Scoring** — GPT-4o-mini evaluates each resume against job requirements, producing a fit score (0–100) with a detailed candidate story
- **Bulk Resume Upload** — Drag & drop multiple PDF/DOCX files; resumes are stored in Supabase cloud storage
- **Automated Email Outreach** — AI-generated personalized shortlist invitations (with Google Calendar booking links) and rejection emails via Resend
- **Job Management Dashboard** — Create, view, and delete job listings with real-time stats
- **Candidate Tracking** — View all candidates across all jobs, ranked by fit score
- **n8n Automation Pipeline** — Full evaluation pipeline runs through n8n workflows (resume parsing → AI matching → scoring → email outreach)
- **Real-time Progress** — Live progress bar with stages (Parsing → Matching → Scoring) during AI evaluation

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, Vanilla CSS | SaaS-style dashboard UI |
| **Backend** | Next.js API Routes (App Router) | REST API for jobs & candidates |
| **AI Engine** | OpenAI GPT-4o-mini | Resume scoring, email generation |
| **Database** | Supabase (PostgreSQL) | Jobs, candidates, and metadata storage |
| **File Storage** | Supabase Storage | Resume file storage (PDF/DOCX) |
| **Email** | Resend | Transactional email delivery |
| **File Parsing** | pdf-parse, mammoth | PDF and DOCX text extraction |
| **Automation** | n8n (self-hosted) | Resume evaluation pipeline & email workflows |
| **Tunnel** | ngrok | Expose local n8n webhooks to the internet |

---

## 📁 Project Structure

```
recruit-ai-app/
├── app/
│   ├── api/
│   │   ├── candidates/route.js          # GET all candidates across jobs
│   │   └── jobs/
│   │       ├── route.js                 # GET all jobs / POST create job
│   │       └── [id]/
│   │           ├── route.js             # GET job detail / DELETE job
│   │           ├── upload/route.js      # POST upload resumes to Supabase Storage
│   │           └── evaluate/route.js    # POST trigger n8n AI evaluation pipeline
│   ├── candidates/page.jsx             # All candidates view (cross-job)
│   ├── jobs/[id]/page.jsx              # Job detail + upload + results
│   ├── page.jsx                        # Dashboard (all jobs overview)
│   ├── layout.jsx                      # Root layout (fonts, metadata)
│   └── globals.css                     # Full design system (dark theme)
├── components/
│   └── Sidebar.jsx                     # Navigation sidebar
├── lib/
│   ├── openai.js                       # OpenAI client — scoring & email generation
│   ├── email.js                        # Resend email client
│   ├── supabase.js                     # Supabase client (server-side, service role)
│   └── mappers.js                      # Data transformation (DB → frontend format)
├── public/                             # Static assets
├── .env.local                          # Environment variables (NOT committed)
├── .gitignore                          # Excludes node_modules, .next, .env*, etc.
├── package.json                        # Dependencies and scripts
└── next.config.ts                      # Next.js configuration
```

---

## 🚀 Setup Guide

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **npm** | 9+ | Package manager |
| **n8n** | Latest | Automation workflows (self-hosted or cloud) |
| **ngrok** | Latest | Tunnel for n8n webhooks (if running n8n locally) |

### Required Accounts (Free Tiers Available)

| Service | Sign Up | What You Need |
|---------|---------|---------------|
| **Supabase** | [supabase.com](https://supabase.com) | Project URL + Service Role Key |
| **OpenAI** | [platform.openai.com](https://platform.openai.com) | API Key |
| **Resend** | [resend.com](https://resend.com) | API Key + Verified sender domain |

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/neoatik/AI-PM-Portfolio.git
cd "AI-PM-Portfolio/Recruit Ai/recruit-ai-app"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase (Backend Database)

#### 3a. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Choose a region close to your users
3. Wait for the project to provision

#### 3b. Create Database Tables

Open the **SQL Editor** in your Supabase dashboard and run:

```sql
-- Jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT,
    job_description TEXT,
    stakeholder_expectations TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Candidates table
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id),
    name TEXT,
    email TEXT,
    phone TEXT,
    resume_url TEXT,
    github_url TEXT,
    github_score NUMERIC,
    skills JSONB,
    candidate_story TEXT,
    fit_score NUMERIC,
    validation_score NUMERIC,
    title_authenticity_score NUMERIC,
    career_level_score NUMERIC,
    seniority_fit_score NUMERIC,
    status TEXT DEFAULT 'analyzed',
    created_at TIMESTAMP DEFAULT now()
);
```

#### 3c. Create Storage Bucket

1. Go to **Storage** in the Supabase dashboard
2. Click **New Bucket** → Name it `resumes`
3. Set it to **Public** (so the app can read resume URLs)
4. Add a storage policy to allow uploads:
   - Go to **Policies** on the `resumes` bucket
   - Add a policy for `INSERT` with `true` (allow all uploads via service role)

#### 3d. Get Your API Keys

1. Go to **Settings → API** in the Supabase dashboard
2. Copy:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Service Role Key** (under "service_role" — this is a secret, never expose it publicly)
   - **Anon/Publishable Key** (under "anon public")

### Step 4: Set Up n8n (Automation Engine)

The AI evaluation pipeline runs through n8n:

1. **Install n8n** locally or use [n8n Cloud](https://n8n.io)
   ```bash
   npm install -g n8n
   n8n start
   ```

2. **Expose n8n with ngrok** (if running locally):
   ```bash
   ngrok http 5678
   ```
   Copy the HTTPS URL (e.g., `https://xxxx.ngrok-free.dev`)

3. **Import the evaluation workflow** into n8n:
   - The workflow accepts a webhook with `{ job_id, candidate_id, resume_url }`
   - It downloads the resume, extracts text, calls OpenAI for scoring, and updates the candidate in Supabase
   - Connect your OpenAI and Supabase credentials in n8n

4. **Copy the webhook URL** from your n8n Webhook trigger node

### Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# ─── OpenAI ────────────────────────────────────────────────
OPENAI_API_KEY=your-openai-api-key-here

# ─── n8n Webhook ───────────────────────────────────────────
N8N_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.dev/webhook/your-webhook-id

# ─── Email (Resend) ────────────────────────────────────────
RESEND_API_KEY=your-resend-api-key-here
FROM_EMAIL=you@yourdomain.com
FROM_NAME=Recruit AI
GOOGLE_CALENDAR_LINK=https://calendar.google.com/calendar/u/0/r/eventedit
```

> ⚠️ **Important:** Never commit `.env.local` to git. It is already listed in `.gitignore`.

### Step 6: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## 🔄 How It Works (End-to-End Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CREATE JOB                                                   │
│     Recruiter fills in: Role, Description, Stakeholder Expects   │
├─────────────────────────────────────────────────────────────────┤
│  2. UPLOAD RESUMES                                               │
│     Drag & drop PDF/DOCX → Stored in Supabase Storage            │
├─────────────────────────────────────────────────────────────────┤
│  3. START AI EVALUATION                                          │
│     App triggers n8n webhook for each pending candidate          │
│     n8n pipeline: Parse resume → Match against JD → Score (0–100)│
├─────────────────────────────────────────────────────────────────┤
│  4. VIEW RESULTS                                                 │
│     Candidates ranked by fit score                               │
│     Score ≥ 60 → ✅ Shortlisted                                  │
│     Score < 60 → ❌ Rejected                                     │
├─────────────────────────────────────────────────────────────────┤
│  5. AUTOMATED EMAILS                                             │
│     Shortlisted → Personalized invite + calendar link            │
│     Rejected → Compassionate AI-generated rejection              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/jobs` | List all jobs with candidate stats |
| `POST` | `/api/jobs` | Create a new job (`role`, `description`, `stakeholder_expectations`) |
| `GET` | `/api/jobs/:id` | Get job details + all candidates |
| `DELETE` | `/api/jobs/:id` | Delete a job and all its candidates + resume files |
| `POST` | `/api/jobs/:id/upload` | Upload resume files (multipart form, field: `resumes`) |
| `POST` | `/api/jobs/:id/evaluate` | Trigger AI evaluation via n8n webhook |
| `GET` | `/api/candidates` | List all candidates across all jobs |

---

## 🗄️ Database Schema

### `jobs` table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `role_name` | TEXT | — | Job title (e.g., "Senior Frontend Engineer") |
| `job_description` | TEXT | — | Full job description |
| `stakeholder_expectations` | TEXT | — | What the hiring manager expects |
| `created_at` | TIMESTAMP | `now()` | Creation timestamp |

### `candidates` table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `job_id` | UUID (FK → jobs.id) | — | Associated job |
| `name` | TEXT | — | Candidate name (from resume) |
| `email` | TEXT | — | Candidate email (from resume) |
| `phone` | TEXT | — | Candidate phone |
| `resume_url` | TEXT | — | Public URL in Supabase Storage |
| `fit_score` | NUMERIC | — | AI fit score (0–100) |
| `candidate_story` | TEXT | — | AI-generated evaluation summary |
| `validation_score` | NUMERIC | — | Resume validation score |
| `title_authenticity_score` | NUMERIC | — | Title authenticity check |
| `career_level_score` | NUMERIC | — | Career level fit |
| `seniority_fit_score` | NUMERIC | — | Seniority match |
| `skills` | JSONB | — | Extracted skills array |
| `status` | TEXT | `'analyzed'` | `pending` / `analyzed` |
| `created_at` | TIMESTAMP | `now()` | Creation timestamp |

---

## 🔐 Security Notes

- `.env.local` is in `.gitignore` — secrets are **never committed**
- The app uses Supabase **Service Role Key** (server-side only, never exposed to the browser)
- Email sending uses server-side API routes only
- No authentication in MVP — designed for single-admin use

---

## 🤝 n8n Workflow Integration

The n8n automation pipeline handles the heavy lifting:

| Workflow | Trigger | What It Does |
|----------|---------|-------------|
| **Resume Evaluation** | Webhook (POST from app) | Downloads resume → Extracts text → Calls OpenAI for scoring → Updates candidate in Supabase → Sends email |
| **Interview Scheduling** | Post-evaluation | Sends calendar invitations to shortlisted candidates, checks HR availability |
| **Rejection Emails** | Post-evaluation | Sends AI-generated compassionate rejection emails |
| **Reschedule Handler** | Candidate reply | Processes rescheduling requests and re-checks calendar availability |

---

## 🚫 MVP Scope Boundaries

| In Scope | Out of Scope |
|----------|-------------|
| Single admin user | Multi-user / team accounts |
| AI resume scoring | Analytics dashboard |
| Bulk upload (PDF/DOCX) | ATS integration |
| Automated emails | Reply/inbox listening |
| Google Calendar link | Calendar bot / auto-scheduling |
| n8n automation | Custom ML model training |

---

## 📄 License

This project is part of the [AI PM Portfolio](https://github.com/neoatik/AI-PM-Portfolio) — demonstrating AI product management capabilities including scope definition, interaction design, AI feature integration, and end-to-end system design.
