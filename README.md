# ReMe — Smart Reminder App

A personal reminder and scheduling app with AI-powered suggestions, Google Calendar integration, and multi-channel action shortcuts (call, WhatsApp, email). Available as a web app and iOS app (via Capacitor).

---

## Prerequisites

- **Node.js 18+** — install from [nodejs.org](https://nodejs.org) or via Homebrew: `brew install node`
- **npm** — comes with Node.js
- **Xcode** (Mac App Store) — required only for iOS builds

---

## First-Time Setup

### 1. Install dependencies

Run this once from the project root:

```bash
cd /Users/nissani/personal_project/ReMe

cd apps/server && npm install && cd ../..
cd apps/client && npm install && cd ../..
```

Or use the setup script:

```bash
bash scripts/setup.sh
```

### 2. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Then open `.env` and set the values you need:

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | **Yes** | Any long random string (32+ chars) |
| `CLIENT_ORIGIN` | **Yes** | Allowed frontend origins (comma-separated) |
| `GOOGLE_CLIENT_ID` | Optional | For Google Calendar sync |
| `GOOGLE_CLIENT_SECRET` | Optional | For Google Calendar sync |
| `ANTHROPIC_API_KEY` | Optional | For AI time suggestions |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Optional | For email notifications |

> Without Google and Anthropic keys the app still works fully — you just won't have calendar sync or AI suggestions.

---

## Running the Web App

You need **two terminals** open at the same time.

**Terminal 1 — Backend (API server):**
```bash
cd /Users/nissani/personal_project/ReMe/apps/server
npm run dev
```
Server starts at `http://localhost:3001`

**Terminal 2 — Frontend (UI):**
```bash
cd /Users/nissani/personal_project/ReMe/apps/client
npm run dev
```
App opens at `http://localhost:5173`

Open your browser and go to **http://localhost:5173**

---

## Logging In

When you first open the app you'll see the login screen. There are two ways to sign in:

**Option A — Google (recommended, gives you Calendar access):**
Click "Continue with Google". You'll need `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in `.env` first.

**Option B — Quick start (no Google needed):**
Enter any email and name in the form at the bottom of the login page. No password needed — this creates a local account instantly.

---

## iOS App (Capacitor)

The app runs natively on iPhone using [Capacitor](https://capacitorjs.com), which wraps the React frontend in a native iOS shell.

### Requirements
- Mac with Xcode installed
- Apple Developer account (free for simulator testing; $99/yr for real device / App Store)

### One-time iOS setup

```bash
cd apps/client
npx cap add ios
```

### Running in the iOS Simulator (local development)

The simulator cannot reach `localhost` on your Mac, so Capacitor is configured to load the live Vite dev server using your Mac's local IP address.

**Step 1 — Find your Mac's local IP:**
```bash
ipconfig getifaddr en0
```

**Step 2 — Update `apps/client/capacitor.config.ts` if the IP has changed:**
```ts
server: {
  url: 'http://<YOUR_IP>:5173',
  cleartext: true,
}
```
Also update `CLIENT_ORIGIN` in `.env` to include the new IP:
```
CLIENT_ORIGIN=http://localhost:5173,http://<YOUR_IP>:5173
```

**Step 3 — Start both servers** (same as the web app, but Vite must be running):
```bash
# Terminal 1
cd apps/server && npm run dev

# Terminal 2
cd apps/client && npm run dev
```

**Step 4 — Sync and open Xcode:**
```bash
cd apps/client
npx cap sync ios
npx cap open ios
```

**Step 5 — Press Run (▶) in Xcode** with an iPhone simulator selected.

The simulator loads the live Vite dev server — hot reload works, and no build is needed while developing.

> **Note:** If your Mac's IP changes (e.g. you switch WiFi networks), repeat Steps 1–2 and re-sync.

### Building for a real device or App Store

The backend must be deployed to a public server (e.g. Railway, Render, Fly.io) before distributing.

Set the deployed URL in `apps/client/.env.production`:
```
VITE_API_URL=https://your-server.fly.dev
```

Then comment out the `server.url` line in `capacitor.config.ts` (so it uses the built `dist/` files), build, and sync:
```bash
cd apps/client
npm run build
npx cap sync ios
npx cap open ios
```

---

## Features

### Reminders
- Create reminders with a title, category, due date, and optional recurrence (daily / weekly / monthly / yearly)
- Categories: Birthday, Anniversary, Payment, Meeting, Gym, Custom
- Attach a contact (name, phone, email) to a reminder

### Action Buttons
Each reminder has quick-action buttons:
- **Call** — opens your phone dialer
- **WhatsApp** — opens WhatsApp with a pre-filled message
- **Email** — opens your mail app with subject pre-filled
- **Snooze** — pick a new time; if Google Calendar is connected, Claude AI suggests the best open slots
- **Done** — marks complete; recurring reminders automatically advance to the next date

### Google Calendar
Go to **Settings → Connect Google Calendar** to link your account. Once connected:
- Import your existing Google Calendar events as reminders
- The Snooze AI suggestions use your real free slots

### AI Suggestions (requires `ANTHROPIC_API_KEY`)
When you snooze a reminder, the app looks at your calendar free slots and asks Claude to rank the best times based on the reminder type and your history.

### Notifications
- **Browser notifications** — enabled in-app (banner at the top). Works while the browser is open.
- **Email notifications** — configure SMTP in the Settings page. The server sends emails automatically in the background.

---

## Project Structure

```
ReMe/
├── .env                  # Your local config (never commit this)
├── .env.example          # Template for .env
├── ReMe_icon.png         # App icon (used for iOS)
├── apps/
│   ├── server/           # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point
│   │   │   ├── app.ts            # Express app, CORS, session
│   │   │   ├── config.ts         # Env var loading
│   │   │   ├── db/               # SQLite setup + migrations
│   │   │   ├── routes/           # API endpoints
│   │   │   ├── services/         # Business logic, Google, Anthropic
│   │   │   └── jobs/             # Cron job for email reminders
│   │   └── data/
│   │       └── reminders.db      # SQLite database (auto-created)
│   └── client/           # React + TypeScript frontend
│       ├── capacitor.config.ts   # Capacitor / iOS config
│       ├── .env.production       # API URL for production builds
│       └── src/
│           ├── pages/            # Dashboard, Reminders, Calendar, Settings
│           ├── components/
│           │   ├── layout/       # AppShell, BottomTabBar (iOS nav)
│           │   ├── reminders/    # ReminderCard, ReminderForm, ActionButtons
│           │   ├── calendar/     # GoogleConnect
│           │   └── shared/       # Modal (bottom sheet), FeatureUnavailable
│           ├── api/              # API call functions
│           └── store/            # Auth state (Zustand)
└── scripts/
    └── setup.sh          # One-command install script
```

---

## API Reference (for developers)

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/dev-login` | Quick login with email + name |
| GET | `/auth/google` | Start Google OAuth flow |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Log out |
| GET | `/reminders` | List reminders (filter by `status`, `category`) |
| POST | `/reminders` | Create a reminder |
| PUT | `/reminders/:id` | Update a reminder |
| DELETE | `/reminders/:id` | Archive a reminder |
| POST | `/reminders/:id/snooze` | Snooze with `{ until: ISO date }` |
| POST | `/reminders/:id/complete` | Mark done |
| POST | `/reminders/:id/action` | Log an action (called, emailed, etc.) |
| GET | `/calendar/events` | List Google Calendar events |
| GET | `/calendar/free-slots` | Find free time slots for a date |
| POST | `/calendar/import` | Import GCal events as reminders |
| POST | `/ai/suggest-time` | Get AI-ranked time suggestions |
| POST | `/ai/insights` | Get AI insight for a reminder |
| GET | `/notifications/settings` | Get notification settings |
| PUT | `/notifications/settings` | Save notification settings |

---

## Troubleshooting

**Server won't start — "SESSION_SECRET" error**
Make sure `.env` exists and `SESSION_SECRET` is set to a string of at least 16 characters.

**Google login fails**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- In Google Cloud Console, make sure `http://localhost:3001/api/auth/google/callback` is listed as an authorized redirect URI

**AI suggestions not showing**
Set `ANTHROPIC_API_KEY` in `.env`. Without it, the snooze modal still works but shows a "feature unavailable" notice with manual time options.

**Emails not sending**
- For Gmail: use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password
- Test the connection in **Settings → Email Notifications → Test connection**

**Port already in use**
Change `PORT` in `.env` (server) or edit `vite.config.ts` (client) to use different ports.

**iOS simulator shows white screen**
The simulator cannot reach `localhost`. Make sure:
1. Both `npm run dev` servers are running
2. `apps/client/capacitor.config.ts` has `server.url` set to your Mac's current IP (`ipconfig getifaddr en0`)
3. That same IP is in `EXTRA_CORS_ORIGINS` in `.env`
4. You ran `npx cap sync ios` after any config change

**Google login gives "Access blocked" / private IP error in the simulator**
Google does not allow private IP addresses (`192.168.x.x`) as OAuth redirect URIs.
`GOOGLE_REDIRECT_URI` must always stay as `http://localhost:3001/api/auth/google/callback`.
**Use Google login only from the browser** (`http://localhost:5173`), not from the iOS simulator.
Once logged in via the browser, the session is stored and you can use the app normally in the simulator.
