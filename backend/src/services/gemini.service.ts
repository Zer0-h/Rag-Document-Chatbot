import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini free tier rate limit for gemini-embedding-001: 100 RPM, 30k TKM, 1K RPD
const DELAY_BETWEEN_REQUESTS_MS = 700; // Around 85 RPM

function getClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('GEMINI_API_KEY is not set');
    return new GoogleGenerativeAI(apiKey);
}

export async function embedText(text: string): Promise<number[]> {
    const model = getClient().getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
        embeddings.push(await embedText(text));
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_REQUESTS_MS));
    }
    return embeddings;
}

export async function* streamAnswer(question: string, context: string): AsyncIterable<string> {
    const model = getClient().getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `You are a helpful documentation assistant for the Trifork Company.
                            Answer questions ONLY based on the provided context.
                            If the context does not contain enough information, say it explicitly, do not try to guess or hallucinate.
                            Be concise.
                            Use markdown where helpful.`,
    });

    const prompt = `Context:\n${context}\n\nQuestion: ${question}`;
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
    }
}