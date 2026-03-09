import * as lancedb from '@lancedb/lancedb';
import type { Table, Data } from '@lancedb/lancedb';
import { Chunk } from '../models/chunk';
import { Schema, Field, Utf8, FixedSizeList, Float32 } from 'apache-arrow';
import { DocRecord as DocumentRecord } from '../models/document-record';

const TABLE_NAME = 'docs';

export class VectorStore {
    private table!: Table;
    private _size = 0;

    async open(dbPath: string): Promise<void> {
        const db = await lancedb.connect(dbPath);
        const tableNames = await db.tableNames();

        if (tableNames.includes(TABLE_NAME)) {
            this.table = await db.openTable(TABLE_NAME);
            this._size = await this.table.countRows();
        } else {
            const schema = new Schema([
                new Field('id', new Utf8()),
                new Field('source', new Utf8()),
                new Field('heading', new Utf8()),
                new Field('content', new Utf8()),
                new Field('vector', new FixedSizeList(3072, new Field('item', new Float32()))),
            ]);

            this.table = await db.createEmptyTable(TABLE_NAME, schema);
            this._size = 0;
        }
    }

    async addBatch(chunks: Chunk[], embeddings: number[][]): Promise<void> {
        const records: DocumentRecord[] = chunks.map((c, i) => ({
            id: c.id,
            source: c.source,
            heading: c.heading,
            content: c.content,
            vector: embeddings[i],
        }));

        await this.table.add(records);
        this._size += records.length;
    }

    async query(queryEmbedding: number[], topK = 5): Promise<DocumentRecord[]> {
        return this.table
            .vectorSearch(queryEmbedding)
            .limit(topK)
            .toArray();
    }

    isPopulated(): boolean {
        return this._size > 0;
    }

    size(): number {
        return this._size;
    }
}