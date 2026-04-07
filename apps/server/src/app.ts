import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

// Dynamically import connect-sqlite3 to bind to express-session
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Capacitor native, curl) or matching origins
    if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.dirname(config.databasePath),
  }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use('/api', apiRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
