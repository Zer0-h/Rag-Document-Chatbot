import { Chunk } from "../models/chunk";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

function splitText(text: string): string[] {
    const paragraphs = text.split(/\n{2,}/);
    const chunks: string[] = [];
    let current = '';

    for (const para of paragraphs) {
        if (current && (current + '\n\n' + para).length > CHUNK_SIZE) {
            chunks.push(current.trim());
            current = current.slice(-CHUNK_OVERLAP) + '\n\n' + para;
        } else {
            current = current ? current + '\n\n' + para : para;
        }
    }

    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

function extractHeading(content: string): string {
    const match = content.match(/^#+\s+(.+)/m);
    return match ? match[1].trim() : 'General';
}

export function chunkDocument(source: string, markdown: string): Chunk[] {
    return splitText(markdown).map((content, i) => ({
        id: `${source}::${i}`,
        source,
        heading: extractHeading(content),
        content,
    }));
}
