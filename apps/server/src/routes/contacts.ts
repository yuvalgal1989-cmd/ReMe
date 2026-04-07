import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../db/database';
import { User, Contact } from '../types';

const router = Router();
router.use(requireAuth);

router.get('/', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY name').all(user.id);
  res.json(contacts);
});

router.post('/', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { name, phone, email, notes } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  const result = db
    .prepare('INSERT INTO contacts (user_id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?)')
    .run(user.id, name, phone ?? null, email ?? null, notes ?? null);
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid) as Contact;
  res.status(201).json(contact);
});

router.put('/:id', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { name, phone, email, notes } = req.body;
  db.prepare(
    'UPDATE contacts SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ? AND user_id = ?'
  ).run(name, phone ?? null, email ?? null, notes ?? null, req.params.id, user.id);
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id) as Contact;
  res.json(contact);
});

router.delete('/:id', (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const result = db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').run(req.params.id, user.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

export default router;
