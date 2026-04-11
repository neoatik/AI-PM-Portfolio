# 🤖 Recruit AI — AI-Powered Resume Screening Web App

> **Product Type:** AI SaaS MVP | **Role:** AI Product Manager  
> **Status:** Concept & Interaction Design  
> **Date:** February 2026

---

## 📌 Project Overview

**Recruit AI** is a minimal, single-admin AI resume screening web application designed to eliminate the manual burden of shortlisting candidates. It automates resume parsing, AI-powered matching against job descriptions, candidate scoring, and personalised email communication — all from a clean, SaaS-style interface.

This project documents the **full interaction flow**, **feature design**, **system behaviour**, and **product constraints** for an MVP demo.

---

## 🎯 Problem Statement

Hiring teams spend an average of **6–8 seconds** scanning a resume manually. For roles receiving 200–500+ applications, this creates:

- Inconsistent screening quality
- Unconscious bias risks
- Delayed candidate communication
- High recruiter burnout

**Recruit AI** solves this by automating the screening pipeline — from resume ingestion to shortlisting and candidate outreach — in a single, intelligent workflow.

---

## 👤 Target User

| Attribute | Detail |
|-----------|--------|
| **User Type** | Single Admin (Recruiter / Hiring Manager) |
| **Technical Level** | Non-technical to moderately technical |
| **Use Case** | MVP Demo / Early-stage hiring teams |
| **Multi-user?** | ❌ No |

---

## 🔁 Interaction Flow

### 1. Dashboard
- Admin lands on the **Dashboard** after login.
- Sees a list of all created **Job Cards** (Role, Date, Status).
- Primary CTA: **"+ Create New Job"** button.

---

### 2. Create New Job

Admin fills a simple form:

| Field | Type | Required |
|-------|------|----------|
| **Job Role** | Text Input | ✅ |
| **Job Description** | Rich Text / Textarea | ✅ |
| **Stakeholder Expectations** | Textarea | ✅ |

- Clicks **"Create Job"** → Job Card appears on the Dashboard.

---

### 3. Job Detail Page

- Admin clicks on any **Job Card** from the Dashboard.
- Sees the job details and a **Resume Upload Zone**.

**Upload Behaviour:**
- Accepts: `PDF`, `DOCX`
- Supports **multiple file upload** (drag & drop or file picker).
- Shows uploaded file names with a remove option.

- Primary CTA: **"Start AI Evaluation"** button (enabled only after at least one resume is uploaded).

---

### 4. AI Evaluation — Progress Flow

After clicking "Start AI Evaluation", a **progress bar** displays three sequential stages:

```
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]
  📄 Parsing  →  🔗 Matching  →  🏆 Scoring
```

| Stage | What Happens |
|-------|-------------|
| **Parsing** | Extracts text, skills, experience, education from each resume |
| **Matching** | Compares candidate profile against Job Description & Stakeholder Expectations using AI |
| **Scoring** | Assigns a **Fit Score (0–100)** to each candidate |

---

### 5. Results Page

After evaluation completes, the system automatically:

- **Sorts** all candidates by Fit Score (descending).
- **Top 10** → Marked as ✅ **Shortlisted**
- **Remaining** → Marked as ❌ **Rejected**

**Results Page Layout:**

```
┌─────────────────────────────────────────┐
│  ✅ SHORTLISTED (10)                    │
│  ─────────────────────────────────────  │
│  [Candidate Card] [Fit Score] [Status]  │
│  ...                                    │
├─────────────────────────────────────────┤
│  ▼ REJECTED (Collapsible Section)       │
│  ─────────────────────────────────────  │
│  [Candidate Card] [Fit Score] [Status]  │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

### 6. Email Automation

Triggered **automatically** after evaluation is complete.

| Recipient | Email Type | Content |
|-----------|-----------|---------|
| **Top 10 (Shortlisted)** | ✅ Personalised Shortlist Email | AI-personalised message + **Google Calendar booking link** |
| **Remaining (Rejected)** | ❌ Personalised Rejection Email | AI-personalised, empathetic rejection message |

**Email Rules:**
- Emails are **AI-personalized** (reference candidate's name, role, key strengths or fit gaps).
- **No reply listening** — emails are outbound only.
- **No calendar bot** — only a static Google Calendar booking link is included.
- Triggered once per evaluation run; not re-triggered on re-evaluation.

---

### 7. Candidates Page

Accessible from the **Sidebar Navigation**.

- Displays **all candidates across all jobs** in one unified table.
- Sorted by **Fit Score (descending)**.

| Column | Description |
|--------|-------------|
| **Candidate Name** | Full name extracted from resume |
| **Job Role** | The job they applied for |
| **Fit Score** | AI-assigned score (0–100) |
| **Status** | Shortlisted / Rejected |

> No filters, no search — clean and minimal for MVP.

---

## 🗂️ Navigation Structure

```
Sidebar
├── 🏠 Dashboard          (Job Cards + Create Job CTA)
├── 👥 Candidates         (All candidates, all jobs)
└── ⚙️  Settings          (Optional: Email config, Admin info)
```

---

## ⚙️ System Behaviour & Business Logic

| Rule | Detail |
|------|--------|
| **Top 10 Rule** | Always exactly Top 10 shortlisted; if fewer than 10 candidates, all are shortlisted |
| **Scoring Model** | AI model scores against JD + Stakeholder Expectations |
| **Re-evaluation** | Admin can re-upload and re-run; previous results are overwritten |
| **Email Trigger** | Automated post-evaluation; no manual send required |
| **Calendar Link** | Static Google Calendar link in shortlist email (no dynamic scheduling) |
| **File Types** | PDF and DOCX only |

---

## 🚫 Out of Scope (MVP)

| Feature | Reason |
|---------|--------|
| Multi-user / Team accounts | Adds auth complexity; single admin for MVP |
| Analytics Dashboard | Not core to screening flow |
| Advanced Candidate Filters | Kept minimal by design |
| Reply/Inbox Listening | Increases infra complexity |
| Calendar Bot / Auto-scheduling | Out of scope; static link used instead |
| ATS Integration | Future roadmap |

---

## 🛣️ Proposed Tech Stack (MVP Suggestion)

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js / React |
| **Backend** | Node.js / FastAPI |
| **AI/NLP** | OpenAI GPT-4 API (scoring + email personalisation) |
| **Resume Parsing** | PyMuPDF / python-docx |
| **Email** | SendGrid / Resend API |
| **Storage** | AWS S3 / Supabase Storage |
| **Database** | PostgreSQL / Supabase |
| **Auth** | Simple admin session (no OAuth needed for MVP) |

---

## 📊 Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Resume processing speed | < 30 seconds for 20 resumes |
| Scoring accuracy | Admin-validated in at least 80% of cases |
| Email delivery rate | > 95% |
| End-to-end evaluation flow | < 2 minutes |

---

## 🔮 Future Roadmap

- [ ] Multi-user with role-based access (Recruiter, HR Manager, Interviewer)
- [ ] Two-way email thread parsing
- [ ] Automated interview scheduling via Calendar API
- [ ] Bias detection layer in AI scoring
- [ ] ATS integrations (Greenhouse, Lever, Workday)
- [ ] Candidate self-serve portal
- [ ] Analytics: Funnel metrics, Time-to-hire, Source tracking

---

## 📁 Project Structure (This Folder)

```
Recruit Ai/
├── README.md                    ← You are here
├── interaction-flow/            ← Wireframes & user flow diagrams (coming soon)
├── product-spec/                ← PRD and feature specifications (coming soon)
└── design/                     ← UI mockups and design assets (coming soon)
```

---

## 🙋 About This Project

This project is part of my **AI PM Portfolio**, demonstrating my ability to:

- Define product scope and constraints for AI-powered tools
- Design clear, user-centred interaction flows
- Translate AI technical capabilities into clean product features
- Identify MVP boundaries and future scaling paths

---

*Built with product thinking by [Your Name] | AI PM Portfolio 2026*
