import { Router } from 'express';
import { handleAsk } from '../controllers/ask.controller';

const router = Router();

router.post('/ask', handleAsk);

export default router;