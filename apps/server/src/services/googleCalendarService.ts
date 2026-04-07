import { google } from 'googleapis';
import { db } from '../db/database';
import { config } from '../config';
import { User, FreeSlot } from '../types';

function getOAuth2Client() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getUserInfo(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
}

async function getAuthenticatedClient(userId: number) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
  if (!user || !user.google_refresh_token) {
    throw new Error('User not connected to Google');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.google_access_token,
    refresh_token: user.google_refresh_token,
    expiry_date: user.google_token_expiry ? user.google_token_expiry * 1000 : undefined,
  });

  // Auto-refresh if expired
  oauth2Client.on('tokens', (tokens) => {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      `UPDATE users SET google_access_token = ?, google_token_expiry = ?, updated_at = ? WHERE id = ?`
    ).run(
      tokens.access_token,
      tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
      now,
      userId
    );
  });

  return oauth2Client;
}

export async function listCalendarEvents(
  userId: number,
  from: Date,
  to: Date
) {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const user = db.prepare('SELECT google_calendar_id FROM users WHERE id = ?').get(userId) as User;
  const calendarId = user?.google_calendar_id || 'primary';

  const response = await calendar.events.list({
    calendarId,
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  return response.data.items || [];
}

export async function findFreeSlots(
  userId: number,
  date: Date,
  durationMinutes: number
): Promise<FreeSlot[]> {
  const dayStart = new Date(date);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(20, 0, 0, 0);

  const events = await listCalendarEvents(userId, dayStart, dayEnd);

  // Build busy intervals
  const busy: Array<{ start: Date; end: Date }> = events
    .filter((e) => e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      start: new Date(e.start!.dateTime!),
      end: new Date(e.end!.dateTime!),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const freeSlots: FreeSlot[] = [];
  let cursor = dayStart;

  for (const event of busy) {
    if (cursor < event.start) {
      const gapMs = event.start.getTime() - cursor.getTime();
      if (gapMs >= durationMinutes * 60 * 1000) {
        freeSlots.push({
          start: cursor.toISOString(),
          end: event.start.toISOString(),
          durationMinutes: Math.floor(gapMs / 60000),
        });
      }
    }
    if (event.end > cursor) cursor = event.end;
  }

  // Gap after last event
  if (cursor < dayEnd) {
    const gapMs = dayEnd.getTime() - cursor.getTime();
    if (gapMs >= durationMinutes * 60 * 1000) {
      freeSlots.push({
        start: cursor.toISOString(),
        end: dayEnd.toISOString(),
        durationMinutes: Math.floor(gapMs / 60000),
      });
    }
  }

  return freeSlots;
}

export async function createCalendarEvent(
  userId: number,
  title: string,
  start: Date,
  end: Date,
  description?: string
) {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });
  const user = db.prepare('SELECT google_calendar_id FROM users WHERE id = ?').get(userId) as User;

  const response = await calendar.events.insert({
    calendarId: user?.google_calendar_id || 'primary',
    requestBody: {
      summary: title,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  return response.data;
}
