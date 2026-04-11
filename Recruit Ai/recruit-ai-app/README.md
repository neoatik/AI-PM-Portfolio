# 🤖 Recruit AI — AI-Powered Resume Screening Platform

> **Built for:** Recruiters & Hiring Managers who screen 200–500+ resumes per role  
> **Problem:** Manual resume screening takes 6–8 seconds per resume, leading to inconsistent evaluations, unconscious bias, and delayed candidate communication  
> **Solution:** An AI-powered platform that automates resume parsing, candidate scoring, and personalized email outreach — reducing screening time from hours to minutes

---

## 📸 Screenshots

### Dashboard — Job Overview
![Dashboard showing job cards with evaluation stats](docs/screenshots/dashboard.png)

### Job Detail — AI Evaluation Results
![Job detail page showing shortlisted candidates with AI scores and candidate stories](docs/screenshots/job-detail.png)

### All Candidates — Cross-Job View
![All candidates page sorted by AI fit score](docs/screenshots/candidates.png)

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

- **AI Resume Scoring** — GPT-4o-mini / Gemini evaluates each resume against job requirements, producing a fit score (0–100) with a detailed candidate story
- **Bulk Resume Upload** — Drag & drop multiple PDF/DOCX files; resumes are stored in Supabase cloud storage
- **Automated Email Outreach** — AI-generated personalized shortlist invitations (with Google Calendar booking links) and rejection emails via Gmail
- **Job Management Dashboard** — Create, view, and delete job listings with real-time stats
- **Candidate Tracking** — View all candidates across all jobs, ranked by fit score
- **GitHub Profile Analysis** — If a GitHub link is found in the resume, fetches repos and factors code quality into scoring
- **n8n Automation Pipeline** — Full evaluation pipeline runs through n8n workflows (resume parsing → AI matching → scoring → email outreach)
- **Real-time Progress** — Live progress bar with stages (Parsing → Matching → Scoring) during AI evaluation
- **Calendar-Aware Scheduling** — Interview invitations automatically skip weekends and Indian public holidays

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, Vanilla CSS | SaaS-style dashboard UI |
| **Backend** | Next.js API Routes (App Router) | REST API for jobs & candidates |
| **AI Engine** | Google Gemini 2.0 Flash (via n8n) | Resume scoring, email generation |
| **Database** | Supabase (PostgreSQL) | Jobs, candidates, and metadata storage |
| **File Storage** | Supabase Storage | Resume file storage (PDF/DOCX) |
| **Email** | Gmail (via n8n) | Interview invitations & rejection emails |
| **File Parsing** | n8n Extract from File node | PDF text extraction |
| **Automation** | n8n (self-hosted or cloud) | Resume evaluation pipeline & email workflows |
| **Tunnel** | ngrok (if self-hosted n8n) | Expose local n8n webhooks to the internet |

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
├── docs/
│   ├── screenshots/                    # UI screenshots for README
│   └── n8n-workflows/                  # Importable n8n workflow JSON files
│       ├── candidate-evaluation-pipeline.json
│       └── interview-reschedule-handler.json
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
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com) | API Key (for n8n AI nodes) |
| **Gmail** | Google account | OAuth2 credentials (for n8n email nodes) |

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
   - **Service Role Key** (under "service_role" — this is a secret, never expose publicly)
   - **Anon/Publishable Key** (under "anon public")

---

### Step 4: Set Up n8n Backend (AI Evaluation Pipeline)

The brain of Recruit AI runs on **n8n**. The workflow JSON files are included in this repo at `docs/n8n-workflows/`. Choose one of the options below:

---

#### Option A: n8n with Docker (Self-Hosted — Recommended)

1. **Start n8n with Docker:**
   ```bash
   docker run -d \
     --name n8n \
     -p 5678:5678 \
     -v n8n_data:/home/node/.n8n \
     -e GENERIC_TIMEZONE="Asia/Kolkata" \
     n8nio/n8n
   ```

2. **Access n8n** at `http://localhost:5678` and create your admin account

3. **Import the workflows:**
   - Go to **Workflows → Import from File**
   - Import `docs/n8n-workflows/candidate-evaluation-pipeline.json`
   - Import `docs/n8n-workflows/interview-reschedule-handler.json`

4. **Configure credentials in n8n:**

   | Credential | Where to Add | Instructions |
   |-----------|-------------|-------------|
   | **Google Gemini API** | Settings → Credentials → New → Google PaLM (Gemini) | Paste your API key from [aistudio.google.com](https://aistudio.google.com/apikey) |
   | **Gmail OAuth2** | Settings → Credentials → New → Gmail OAuth2 | Follow [Gmail OAuth2 setup guide](https://docs.n8n.io/integrations/builtin/credentials/google/) |

5. **Update Supabase URLs in the workflow:**
   - Open the **"Request to Job table"** node → Replace `YOUR_SUPABASE_PROJECT_ID` with your actual Supabase project ID
   - Replace `YOUR_SUPABASE_ANON_KEY` with your actual anon key
   - Do the same for **"Saving to Supabase"** node

6. **Expose n8n with ngrok** (so your Next.js app can reach it):
   ```bash
   ngrok http 5678
   ```
   Copy the HTTPS URL (e.g., `https://xxxx.ngrok-free.dev`)

7. **Copy the webhook URL:**
   - Open the **Candidate Evaluation Pipeline** workflow
   - Click the **Webhook** trigger node
   - Copy the **Production URL** (it will look like `https://xxxx.ngrok-free.dev/webhook/candidate-evaluation`)
   - Add this to your `.env.local` as `N8N_WEBHOOK_URL`

8. **Activate the workflow** (toggle on in n8n)

---

#### Option B: n8n Cloud (No Docker Required)

1. **Sign up** at [n8n.io/cloud](https://n8n.io/cloud) (free trial available)

2. **Import the workflows:**
   - Go to **Workflows → Import from File**
   - Import `docs/n8n-workflows/candidate-evaluation-pipeline.json`
   - Import `docs/n8n-workflows/interview-reschedule-handler.json`

3. **Configure credentials** (same as Docker — Gemini API + Gmail OAuth2)

4. **Update Supabase URLs** in both HTTP Request nodes (same as step 5 above)

5. **Copy the webhook URL:**
   - n8n Cloud provides a public URL automatically (no ngrok needed)
   - Click the **Webhook** trigger node → Copy the **Production URL**
   - Add it to `.env.local` as `N8N_WEBHOOK_URL`

6. **Activate the workflow**

---

#### Option C: n8n Desktop App (Simplest)

1. **Download** from [n8n.io/get-started](https://n8n.io/get-started)
2. **Import workflows** from `docs/n8n-workflows/`
3. **Configure credentials** and **update Supabase URLs**
4. **Use ngrok** to expose the webhook (same as Docker option step 6–7)

---

### Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# ─── n8n Webhook ───────────────────────────────────────────
N8N_WEBHOOK_URL=https://your-n8n-url/webhook/candidate-evaluation

# ─── Email (Resend) — Optional if using Gmail via n8n ──────
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
│  3. START AI EVALUATION (triggers n8n webhook)                   │
│     For each candidate:                                          │
│     → Download resume from Supabase Storage                      │
│     → Extract text from PDF                                      │
│     → AI Agent 1: Extract name, email, skills, GitHub            │
│     → Fetch GitHub repos (if available)                          │
│     → AI Agent 2: Score candidate (0–100) + write candidate story│
│     → Save results to Supabase                                   │
│     → Route: Score ≥ 60 → Shortlisted / Score < 60 → Rejected   │
│     → AI-generate personalized email                             │
│     → Send via Gmail                                             │
├─────────────────────────────────────────────────────────────────┤
│  4. VIEW RESULTS (real-time polling)                             │
│     Candidates ranked by fit score with AI candidate stories     │
├─────────────────────────────────────────────────────────────────┤
│  5. RESCHEDULE HANDLER (separate workflow)                       │
│     Monitors Gmail for candidate replies → Proposes new date     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 n8n Workflow Architecture

### Workflow 1: Candidate Evaluation Pipeline (26 nodes)

```
Webhook → Respond → Edit Fields → Fetch Job → Download Resume → Extract PDF
   ↓
Extraction Agent (Gemini) → Check GitHub? → [Yes] → Fetch GitHub Repos → Merge
                           → [No]  → Merge ──────────────────────────┘
   ↓
Intelligence Agent (Gemini) → Save to Supabase → Check Score ≥ 60?
   ↓                                               ↓           ↓
[Shortlisted]                              [Rejected]
   ↓                                               ↓
Check Calendar → Interview Email Agent      Rejection Email Agent
   ↓                      ↓                        ↓
Send Interview Email (Gmail)                Send Rejection Email (Gmail)
```

### Workflow 2: Interview Reschedule Handler (6 nodes)

```
Gmail Trigger → Parse Reply → Check New Date → Reschedule Agent → Send Email
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
| `github_url` | TEXT | — | GitHub profile URL |
| `github_score` | NUMERIC | — | GitHub activity/quality score |
| `status` | TEXT | `'analyzed'` | `pending` / `analyzed` |
| `created_at` | TIMESTAMP | `now()` | Creation timestamp |

---

## 🔐 Security Notes

- `.env.local` is in `.gitignore` — secrets are **never committed**
- n8n workflow JSON files are **sanitized** — all API keys, credentials, and personal data removed
- The app uses Supabase **Service Role Key** (server-side only, never exposed to the browser)
- Email sending uses server-side API routes and n8n workflows only
- No authentication in MVP — designed for single-admin use

---

## 🚫 MVP Scope Boundaries

| In Scope | Out of Scope |
|----------|-------------|
| Single admin user | Multi-user / team accounts |
| AI resume scoring (Gemini) | Analytics dashboard |
| Bulk upload (PDF/DOCX) | ATS integration |
| Automated emails (Gmail) | Reply/inbox listening (basic handler included) |
| Google Calendar link | Calendar bot / auto-scheduling |
| n8n automation | Custom ML model training |
| GitHub profile analysis | LinkedIn data scraping |

---

## 📄 License

This project is part of the [AI PM Portfolio](https://github.com/neoatik/AI-PM-Portfolio) — demonstrating AI product management capabilities including scope definition, interaction design, AI feature integration, and end-to-end system design.
