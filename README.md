# ReMe — Smart Reminder App

A personal reminder app with AI-powered suggestions, Google Calendar integration, and quick-action shortcuts (call, WhatsApp, email). Available as a web app and native iOS app.

---

## Tech Stack

- **Frontend** — React + TypeScript + Tailwind CSS (Vite)
- **Backend** — Node.js + Express + SQLite
- **iOS** — Capacitor (wraps the web app as a native iOS app)
- **AI** — Claude (Anthropic) for smart scheduling suggestions
- **Auth** — Google OAuth + session-based local login

---

## Features

- Create reminders with categories, recurrence, and contacts
- Quick actions: Call, WhatsApp, Email directly from a reminder
- Snooze with AI-suggested time slots based on your calendar
- Google Calendar sync — import events as reminders
- Browser & email notifications
- Native iOS app via Capacitor

---

## Getting Started

### 1. Install dependencies
```bash
bash scripts/setup.sh
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in SESSION_SECRET (required) and optional Google / Anthropic keys
```

### 3. Run the app
```bash
# Terminal 1 — backend
cd apps/server && npm run dev

# Terminal 2 — frontend
cd apps/client && npm run dev
```

Open **http://localhost:5173**

### 4. Run on iOS Simulator
```bash
bash scripts/run-ios.sh
```
Then press ▶ in Xcode.

---

## Project Structure

```
ReMe/
├── apps/
│   ├── server/        # Express API + SQLite
│   └── client/        # React frontend + iOS (Capacitor)
├── scripts/
│   ├── run-ios.sh     # Start everything + open Xcode
│   └── stop-ios.sh    # Stop all services
└── .env               # Your local config (never committed)
```

---

## Notes

- Google login works in the **browser only** during local development (Google blocks private IPs in OAuth redirects)
- In the iOS simulator, use the manual login (email + name)
