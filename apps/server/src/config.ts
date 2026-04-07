import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Try project root .env (3 levels up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Also try server-level .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const configSchema = z.object({
  PORT: z.string().default('3001'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 chars'),
  DATABASE_PATH: z.string().default('./data/reminders.db'),
  // Primary origin used for OAuth redirects (must be a single URL)
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  // Extra allowed CORS origins, comma-separated (optional)
  EXTRA_CORS_ORIGINS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/google/callback'),
  ANTHROPIC_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  sessionSecret: parsed.data.SESSION_SECRET,
  databasePath: path.resolve(__dirname, '..', parsed.data.DATABASE_PATH),
  clientOrigin: parsed.data.CLIENT_ORIGIN,
  allowedOrigins: [
    parsed.data.CLIENT_ORIGIN,
    ...(parsed.data.EXTRA_CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? []),
  ],
  google: {
    clientId: parsed.data.GOOGLE_CLIENT_ID,
    clientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
    redirectUri: parsed.data.GOOGLE_REDIRECT_URI,
  },
  anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT ? parseInt(parsed.data.SMTP_PORT, 10) : 587,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.SMTP_FROM,
  },
};
