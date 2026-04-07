import { runMigrations } from './db/migrations';
import { startReminderCron } from './jobs/reminderCron';
import { config } from './config';
import app from './app';

runMigrations();
startReminderCron();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
