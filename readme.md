# ProYou — AI Placement Readiness OS

A full-stack AI-powered dashboard that tracks your coding activity, scores your placement readiness, and sends automated weekly digests — built for students targeting SDE, ML, PM, and other tech roles.

![ProYou Dashboard](https://img.shields.io/badge/Status-Active-22C55E?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js) ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)

---

## Features

| Feature | Description |
|---|---|
| 🏆 Placement Score | AI scores you 0–100 across 4 role-specific dimensions using GitHub + LeetCode data |
| 📊 Weekly Insight | Personalized AI-generated coaching summary every week |
| 🔥 Streak Tracking | GitHub commits, LeetCode submissions, and LinkedIn check-in streaks |
| 🃏 Flashcards | 5 AI-generated interview flashcards weekly, tailored to your weak areas |
| 🤖 AI Tutor | Paste any LeetCode problem, choose hint level (nudge / approach / walkthrough) |
| 📰 Company News | Filters tech news by your target companies using AI relevance scoring |
| 📅 Contest Reminders | Auto-fetches LeetCode + Codeforces contests, emails you 24h before |
| 📧 Weekly Digest | Automated Monday 7AM email with your week summary and action items |
| ⚠️ Productivity Alerts | Daily check — emails you if activity drops >20% vs previous week |
| 🔐 Auth | Email/password + Google OAuth, JWT, password reset via email |

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Zustand (state management)
- Recharts (data visualization)
- Lucide React (icons)

**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- node-cron (scheduled jobs)
- Nodemailer + Gmail SMTP

**AI / External APIs**
- Groq API — LLaMA 3.3 70B (placement score, flashcards, tutor, digest)
- GitHub REST API
- LeetCode GraphQL API
- Newsdata.io API
- Google Gemini API (tech facts, optional)
- Google OAuth 2.0

---

## Project Structure

```
ProYou/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScorePage.jsx
│   │   │   ├── TutorPage.jsx
│   │   │   └── ...
│   │   ├── store/
│   │   │   └── useAppStore.js
│   │   ├── api.js
│   │   └── main.jsx
│   └── package.json
│
└── backend/
    ├── routes/
    │   ├── ai.js
    │   ├── auth.js
    │   ├── contests.js
    │   ├── events.js
    │   ├── facts.js
    │   ├── github.js
    │   ├── leetcode.js
    │   ├── linkedin.js
    │   └── news.js
    ├── services/
    │   ├── aiService.js
    │   ├── contestService.js
    │   ├── emailService.js
    │   ├── githubService.js
    │   └── leetcodeService.js
    ├── models/
    │   ├── User.js
    │   ├── Event.js
    │   └── LinkedInLog.js
    ├── middleware/
    │   └── auth.js
    ├── scheduler.js
    ├── server.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key — [console.groq.com](https://console.groq.com)
- Gmail account with 2FA enabled

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/proyou.git
cd proyou
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/proyou

# Auth
JWT_SECRET=your_long_random_secret_here

# AI
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=                   # optional

# Email (Gmail SMTP)
GMAIL_USER=yourgmail@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx    # Gmail App Password (not your real password)
EMAIL_FROM=ProYou <yourgmail@gmail.com>
ADMIN_EMAIL=yourgmail@gmail.com

# External APIs
GITHUB_TOKEN=ghp_...              # optional, prevents rate limiting
NEWS_API_KEY=                     # newsdata.io key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
```

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3001`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Long random string for signing JWTs |
| `GROQ_API_KEY` | ✅ | Groq API key for all AI features |
| `GMAIL_USER` | ✅ | Gmail address for sending emails |
| `GMAIL_PASS` | ✅ | Gmail App Password (16 chars) |
| `FRONTEND_URL` | ✅ | Frontend URL (for password reset links) |
| `NEWS_API_KEY` | ✅ | Newsdata.io API key |
| `GITHUB_TOKEN` | ⚪ | GitHub personal access token (avoids rate limits) |
| `GEMINI_API_KEY` | ⚪ | Google Gemini key (AI tech facts) |
| `GOOGLE_CLIENT_ID` | ⚪ | Google OAuth client ID |
| `ADMIN_EMAIL` | ⚪ | Email for cron failure alerts |

---

## Automated Cron Jobs

All times are IST (Asia/Kolkata).

| Job | Schedule | What it does |
|---|---|---|
| Productivity Alert | Daily 8:00 PM | Checks if GitHub/LeetCode activity dropped >20% vs last week. Emails affected users. |
| Weekly Digest | Every Monday 7:00 AM | Sends AI-generated weekly summary to all users with email notifications enabled. |
| Contest Reminders | Daily 9:00 AM | Checks for contests starting in ~24h. Sends reminder emails with registration links. |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (JWT required) |
| PATCH | `/api/auth/profile` | Update profile settings |
| POST | `/api/auth/google` | Google OAuth sign-in |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |

### AI (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/score` | Generate placement readiness score |
| POST | `/api/ai/insight` | Generate weekly insight |
| POST | `/api/ai/flashcards` | Generate 5 interview flashcards |
| POST | `/api/ai/tutor` | AI coding tutor (conversational) |
| POST | `/api/ai/email-digest` | Manually trigger digest email |

### Data
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/github/:username` | GitHub stats (cached 6h) |
| GET | `/api/leetcode/:username` | LeetCode stats (cached 6h) |
| GET | `/api/contests` | Upcoming contests (cached 30min) |
| GET | `/api/news?companies[]=Google` | Filtered company news (cached 1h) |
| GET | `/api/facts/random` | Random tech fact |

### Events & LinkedIn (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | Get all calendar events |
| POST | `/api/events` | Create event |
| PATCH | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| POST | `/api/linkedin/checkin` | Log LinkedIn activity |
| GET | `/api/linkedin/log` | Get activity log |
| GET | `/api/linkedin/streak` | Get LinkedIn streak |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub and connect repo to Vercel
# Set VITE_API_URL=https://your-backend.railway.app in Vercel env vars
```

### Backend → Railway

1. Connect your GitHub repo to [railway.app](https://railway.app)
2. Set root directory to `backend`
3. Add all environment variables from the table above
4. Set `FRONTEND_URL` to your Vercel URL
5. In MongoDB Atlas → Network Access → Add `0.0.0.0/0` (allows Railway's dynamic IPs)

---

## Supported Roles

ProYou adapts scoring, flashcards, and AI advice based on your target role:

- **SWE / Backend / Full Stack** — DSA, system design, GitHub projects, consistency
- **ML Engineer** — ML knowledge, Python/coding, research/Kaggle, math depth
- **PM** — Product sense, communication, analytical, behavioral
- **Data Analyst** — SQL skills, statistics, visualization, communication
- **DevOps** — Infrastructure, automation/CI, cloud/certs, reliability
- **Frontend** — UI/UX sense, framework depth, portfolio, problem solving

---

## Gmail App Password Setup

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select **Mail** → **Other** → type "ProYou" → Generate
5. Copy the 16-character password into `GMAIL_PASS` in your `.env`

> Gmail free tier allows 500 emails/day — sufficient for a student project.

---

## Built By

Vyshnavi — pre-final year B.Tech IT student at Anurag University  
Built as part of placement preparation, targeting SDE roles at top product companies.

---

## License

MIT