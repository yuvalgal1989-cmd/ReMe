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
- Native iOS app — adaptive layout for all iPhone sizes, no black bars, safe areas handled

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
2. In Xcode → **App target → Signing & Capabilities** → select your Apple ID as Team
3. In Xcode top bar select your iPhone instead of a simulator
4. Press **▶ Run**

Your iPhone and Mac must be on the **same WiFi network** while testing.

### First run on a new device
After installing, go to:
**iPhone Settings → General → VPN & Device Management → your Apple ID → Trust**

---

## iOS Platform Notes

| Topic | Detail |
|---|---|
| Layout | Fixed header + tab bar in native flex layout — no `position:fixed` jitter |
| Safe areas | Notch, Dynamic Island, and home indicator all handled automatically |
| Splash screen | ReMe logo centered on white background, sized at 55% screen width |
| App icon | ReMe_icon.png used as the home screen icon |
| Google login | Browser only (`http://localhost:5173`) — Google blocks private IPs in OAuth redirects |
| Manual login | Works in simulator and on device — use email + name, no password needed |
| IP change | Re-run `bash scripts/run-ios.sh` — it auto-updates the IP everywhere |

---

## Project Structure

```
ReMe/
├── apps/
│   ├── server/        # Express API + SQLite
│   └── client/        # React frontend + iOS (Capacitor)
│       ├── capacitor.config.ts        # iOS config (auto-updated by run-ios.sh)
│       ├── ios/App/App/
│       │   ├── AppDelegate.swift      # Native iOS background color fix
│       │   ├── Assets.xcassets/       # App icon + splash image
│       │   └── Base.lproj/            # Launch screen storyboard
│       └── src/
│           ├── utils/platform.ts      # isNative / isIOS helpers
│           ├── components/layout/     # AppShell, BottomTabBar
│           ├── components/shared/     # Modal (bottom sheet), FeatureUnavailable
│           └── pages/                 # Dashboard, Reminders, Calendar, Settings
├── scripts/
│   ├── run-ios.sh     # Start everything + open Xcode
│   └── stop-ios.sh    # Stop all services + close Xcode & Simulator
└── .env               # Your local config (never committed)
```

---

## Troubleshooting

**White screen in simulator**
Both servers must be running. Run `bash scripts/run-ios.sh` and wait for it to finish before pressing ▶ in Xcode.

**Black bars at top or bottom**
Do a clean build: Xcode → **Product → Clean Build Folder** (Shift+Cmd+K), then ▶ Run.

**Google login gives "Access blocked"**
Use Google login in the browser (`http://localhost:5173`) — Google blocks `192.168.x.x` IPs in OAuth redirect URIs.

**IP changed after switching WiFi**
Re-run `bash scripts/run-ios.sh` — it detects the new IP and updates `capacitor.config.ts` and `.env` automatically.

**Provisioning profile error in Xcode**
Go to **App target → Signing & Capabilities**, check **Automatically manage signing**, and select your Apple ID as Team. Your iPhone must be plugged in.
