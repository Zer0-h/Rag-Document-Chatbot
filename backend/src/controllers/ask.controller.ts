import type { Request, Response } from 'express';
import { ask } from '../services/ask.service.js';
import type { SSEEvent } from '../types/sse.js';

export async function handleAsk(req: Request, res: Response): Promise<void> {
    const { question } = req.body as { question?: string };

    if (!question?.trim()) {
        res.status(400).json({ error: 'Question cannot be empty' });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const { stream, sources } = await ask(question);
        let fullAnswer = '';

        for await (const chunk of stream) {
            fullAnswer += chunk;
            sendSSE(res, { type: 'chunk', text: chunk });
        }

        sendSSE(res, { type: 'done', answer: fullAnswer, sources });
        res.end();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[ask]', message);
        sendSSE(res, { type: 'error', message });
        res.end();
    }
}

function sendSSE(res: Response, event: SSEEvent): void {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
}
