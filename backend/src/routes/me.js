import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

// Minimal protected endpoint so the frontend can confirm a live session.
export const meRouter = Router();

meRouter.get('/', requireAuth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});
