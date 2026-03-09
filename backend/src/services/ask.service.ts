import { AskResult } from '../models/ask.result.js';
import { VectorStore } from '../rag/vectorStore.js';
import { embedText, streamAnswer } from './gemini.service.js';
import type { ConversationTurn } from '../models/conversation-turn.js';

const TOP_K = 5;
const MAX_HISTORY_TURNS = 10;

let store: VectorStore;
const sessions = new Map<string, ConversationTurn[]>();

export function setStore(vectorStore: VectorStore): void {
    store = vectorStore;
}

export async function ask(question: string, sessionId: string): Promise<AskResult> {
    if (!store) throw new Error('Vector store has to be initialized first');

    const queryEmbedding = await embedText(question);
    const chunks = await store.query(queryEmbedding, TOP_K);
    const sources = [...new Set(chunks.map((c) => c.source))];
    const context = chunks
        .map((c) => `[${c.source}]\n${c.content}`)
        .join('\n\n---\n\n');

    if (!sessions.has(sessionId)) sessions.set(sessionId, []);
    const history = sessions.get(sessionId)!;

    const stream = collectAndStore(streamAnswer(question, context, history), question, history);
    return { stream, sources };
}

export function clearSession(sessionId: string): void {
    sessions.delete(sessionId);
}

async function* collectAndStore(
    source: AsyncIterable<string>,
    question: string,
    history: ConversationTurn[]
): AsyncIterable<string> {
    let fullAnswer = '';
    for await (const chunk of source) {
        fullAnswer += chunk;
        yield chunk;
    }
    history.push({ role: 'user', parts: [{ text: question }] });
    history.push({ role: 'model', parts: [{ text: fullAnswer }] });

    // Trim so we don't have too long history
    while (history.length > MAX_HISTORY_TURNS * 2) history.splice(0, 2);
}