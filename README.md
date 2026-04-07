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
- Google Calendar sync — import events as reminders (duplicates skipped automatically)
- Browser & email notifications
- Native iOS app via Capacitor — adaptive layout for all iPhone sizes

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

### 3. Run the web app
```bash
# Terminal 1 — backend
cd apps/server && npm run dev

# Terminal 2 — frontend
cd apps/client && npm run dev
```
Open **http://localhost:5173**

---

## iOS Development

### Start everything (simulator or device)
```bash
bash scripts/run-ios.sh
```
This will:
- Detect your Mac's local IP and update config automatically if it changed
- Kill any leftover processes on ports 3001 / 5173
- Start the backend and frontend in separate Terminal windows
- Sync Capacitor to Xcode
- Open Xcode and position it side-by-side with the Simulator

Then press **▶ Run** in Xcode.

### Stop everything
```bash
bash scripts/stop-ios.sh
```
Kills both servers, closes the Simulator, and quits Xcode.

### Run on a real iPhone
1. Plug your iPhone in via USB and tap **Trust** on the device
2. In Xcode top bar select your iPhone instead of a simulator
3. Press **▶ Run** — your iPhone and Mac must be on the same WiFi

---

## Project Structure

```
ReMe/
├── apps/
│   ├── server/        # Express API + SQLite
│   └── client/        # React frontend + iOS (Capacitor)
│       ├── capacitor.config.ts   # iOS config (auto-updated by run-ios.sh)
│       └── src/
│           ├── components/layout/   # AppShell, BottomTabBar (iOS nav)
│           ├── components/shared/   # Modal (bottom sheet), FeatureUnavailable
│           └── pages/               # Dashboard, Reminders, Calendar, Settings
├── scripts/
│   ├── run-ios.sh     # Start everything + open Xcode
│   └── stop-ios.sh    # Stop all services + close Xcode & Simulator
└── .env               # Your local config (never committed)
```

---

## Notes

- **Google login** works in the **browser only** during local dev (`http://localhost:5173`) — Google blocks private IPs in OAuth redirect URIs
- In the **iOS simulator / device**, use the manual login (email + name) — all features work except Google Calendar sync, which you connect once from the browser
- If your Mac's IP changes (different WiFi), just re-run `bash scripts/run-ios.sh` — it updates everything automatically
