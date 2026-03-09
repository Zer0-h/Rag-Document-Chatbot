import { AskResult } from '../models/ask.result.js';
import { VectorStore } from '../rag/vectorStore.js';
import { embedText, streamAnswer } from './gemini.service.js';

const TOP_K = 5;
let store: VectorStore;

export function setStore(vectorStore: VectorStore): void {
    store = vectorStore;
}

export async function ask(question: string): Promise<AskResult> {
    if (!store) throw new Error('Vector store has to be initialized first');

    const queryEmbedding = await embedText(question);
    const chunks = await store.query(queryEmbedding, TOP_K);
    const sources = [...new Set(chunks.map((c) => c.source))];
    const context = chunks
        .map((c) => `[${c.source}]\n${c.content}`)
        .join('\n\n---\n\n');

    const stream = streamAnswer(question, context);
    return { stream, sources };
}
