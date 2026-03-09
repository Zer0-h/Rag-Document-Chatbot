import { Router } from 'express';
import { handleAsk, handleClearSession } from '../controllers/ask.controller';

const router = Router();

router.post('/ask', handleAsk);
router.delete('/session/:id', handleClearSession);

export default router;