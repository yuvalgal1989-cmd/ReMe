import { Router } from 'express';
import remindersRouter from './reminders';
import contactsRouter from './contacts';
import authRouter from './auth';
import calendarRouter from './calendar';
import aiRouter from './ai';
import notificationsRouter from './notifications';

const router = Router();

router.use('/auth', authRouter);
router.use('/reminders', remindersRouter);
router.use('/contacts', contactsRouter);
router.use('/calendar', calendarRouter);
router.use('/ai', aiRouter);
router.use('/notifications', notificationsRouter);

export default router;
