import { readFileSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chunkDocument } from './chunker.js';
import { embedBatch } from '../services/gemini.service.js';
import { VectorStore } from './vectorStore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.LANCE_DB_PATH ?? resolve(__dirname, '../../../data/lancedb');

export async function ingestDocuments(docsDir: string): Promise<VectorStore> {
    const store = new VectorStore();
    await store.open(DB_PATH);

    if (store.isPopulated()) {
        console.log(`LanceDB already populated (${store.size()} chunks)`);
        return store;
    }

    const files = readdirSync(docsDir).filter((f) => f.endsWith('.md'));
    if (files.length === 0) throw new Error(`No .md files found`);

    const allChunks = files.flatMap((file) =>
        chunkDocument(`docs/${file}`, readFileSync(join(docsDir, file), 'utf-8'))
    );

    const embeddings = await embedBatch(allChunks.map((c) => `${c.heading}\n\n${c.content}`));

    await store.addBatch(allChunks, embeddings);
    console.log(`Indexed ${store.size()} chunks in LanceDB at ${DB_PATH}`);

    return store;
}
